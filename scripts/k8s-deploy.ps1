# Deploy Maison de l'Épouvante to local Kubernetes (Docker Desktop)
#
# Pre-requisite: Docker Desktop with Kubernetes enabled
#   Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart
#
# Usage:
#   .\scripts\k8s-deploy.ps1
#   .\scripts\k8s-deploy.ps1 -SkipBuild     # skip Docker image builds
#   .\scripts\k8s-deploy.ps1 -Teardown      # delete all resources and exit

param(
    [switch]$SkipBuild,
    [switch]$Teardown
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Namespace = "maison-epouvante"
$Root      = Split-Path $PSScriptRoot -Parent
$K8sDir    = Join-Path $Root "infra\k8s"

function Write-Ok   { param($msg) Write-Host "[OK]   $msg" -ForegroundColor Green  }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red    }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan   }
function Write-Step { param($msg) Write-Host "`n──── $msg" -ForegroundColor Yellow }

# ── Teardown ───────────────────────────────────────────────────────────────────
if ($Teardown) {
    Write-Step "Tearing down namespace $Namespace"
    kubectl delete namespace $Namespace --ignore-not-found
    Write-Ok "Namespace deleted — all resources removed"
    exit 0
}

# ── Pre-flight: verify context ─────────────────────────────────────────────────
Write-Step "Switching kubectl context to docker-desktop"
kubectl config use-context docker-desktop
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Could not switch to docker-desktop context."
    Write-Fail "Make sure Kubernetes is enabled in Docker Desktop."
    exit 1
}
Write-Ok "Context: docker-desktop"

# Wait for the API server to be fully responsive (Docker Desktop can take time
# after context switch before the API server accepts connections)
Write-Info "Waiting for Kubernetes API server to be ready..."
$retries = 0
$maxRetries = 18   # up to ~3 minutes
while ($retries -lt $maxRetries) {
    kubectl cluster-info 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
    $retries++
    Write-Info "  API server not ready yet ($retries/$maxRetries) — retrying in 10s..."
    Start-Sleep -Seconds 10
}
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Kubernetes API server is unreachable after 3 minutes."
    Write-Fail "Try: Docker Desktop → Settings → Kubernetes → Reset Kubernetes Cluster"
    exit 1
}
Write-Ok "Kubernetes API server is ready"

# ── NGINX Ingress Controller ────────────────────────────────────────────────────
Write-Step "Checking NGINX ingress controller"
$ingressNs = kubectl get namespace ingress-nginx --ignore-not-found 2>$null
if (-not $ingressNs) {
    Write-Info "Installing NGINX ingress controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
    Write-Info "Waiting for ingress controller to be ready (up to 3 min)..."
    kubectl wait --namespace ingress-nginx `
        --for=condition=ready pod `
        --selector=app.kubernetes.io/component=controller `
        --timeout=180s
    Write-Ok "NGINX ingress controller ready"
} else {
    Write-Ok "NGINX ingress controller already installed"
}

# ── Build Docker images ─────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Step "Building Docker images"

    $services = @(
        @{ name = "auth";       context = "services\auth"      },
        @{ name = "vente";      context = "services\vente"     },
        @{ name = "communaute"; context = "services\communaute"},
        @{ name = "media";      context = "services\media"     },
        @{ name = "gateway";    context = "services\gateway"   },
        @{ name = "frontend";   context = "frontend"           }
    )

    foreach ($svc in $services) {
        $tag     = "maison-epouvante/$($svc.name):latest"
        $context = Join-Path $Root $svc.context
        Write-Info "Building $tag ..."
        docker build -t $tag $context
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Failed to build $tag"
            exit 1
        }
        Write-Ok "Built $tag"
    }
} else {
    Write-Info "Skipping image builds (-SkipBuild)"
}

# ── Apply manifests ─────────────────────────────────────────────────────────────
Write-Step "Applying Kubernetes manifests"

# Helper: apply a single manifest file
function Apply-Manifest { param($file)
    Write-Info "Applying $file ..."
    kubectl apply -f (Join-Path $K8sDir $file)
    if ($LASTEXITCODE -ne 0) { Write-Fail "Failed to apply $file"; exit 1 }
}

# 1. Namespace first
Apply-Manifest "namespace.yaml"

# 2. Infrastructure (stateful services)
Apply-Manifest "postgres.yaml"
Apply-Manifest "rabbitmq.yaml"

# 3. Keycloak depends on postgres
Apply-Manifest "keycloak.yaml"

# Wait for postgres and rabbitmq to be ready before starting app services
Write-Info "Waiting for postgres to be ready..."
kubectl rollout status deployment/postgres -n $Namespace --timeout=180s

Write-Info "Waiting for rabbitmq to be ready..."
kubectl rollout status deployment/rabbitmq -n $Namespace --timeout=180s

# Keycloak takes a while to start (imports realm, connects to DB)
Write-Info "Waiting for keycloak to be ready (up to 8 min)..."
kubectl rollout status deployment/keycloak -n $Namespace --timeout=480s

# 4. Application microservices (can start in parallel once infra is ready)
Apply-Manifest "auth.yaml"
Apply-Manifest "vente.yaml"
Apply-Manifest "communaute.yaml"
Apply-Manifest "media.yaml"
Apply-Manifest "gateway.yaml"
Apply-Manifest "frontend.yaml"

# 5. Ingress last
Apply-Manifest "ingress.yaml"

# ── Wait for all app deployments ────────────────────────────────────────────────
Write-Step "Waiting for all application deployments to be ready"

$appDeployments = @("auth", "vente", "communaute", "media", "gateway", "frontend")
foreach ($dep in $appDeployments) {
    Write-Info "Waiting for $dep ..."

    # Force-delete any pod stuck in Terminating from a previous deploy before watching
    $stuckPods = kubectl get pods -n $Namespace -l "app=$dep" --field-selector=status.phase=Failed -o name 2>$null
    if ($stuckPods) {
        Write-Info "Removing failed pods for $dep ..."
        kubectl delete pods -n $Namespace -l "app=$dep" --field-selector=status.phase=Failed --force --grace-period=0 2>$null
    }

    kubectl rollout status deployment/$dep -n $Namespace --timeout=300s
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Rollout timed out — checking for stuck terminating pods and retrying..."
        kubectl delete pods -n $Namespace -l "app=$dep" --force --grace-period=0 2>$null
        Start-Sleep -Seconds 5
        kubectl rollout status deployment/$dep -n $Namespace --timeout=120s
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "$dep did not become ready in time"
            Write-Info "Check logs: kubectl logs -n $Namespace deployment/$dep"
            exit 1
        }
    }
    Write-Ok "$dep is ready"
}

# ── Done ────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Stack is running on Kubernetes (Docker Desktop)" -ForegroundColor White
Write-Host ""
Write-Host "  Frontend  →  http://localhost"                   -ForegroundColor Cyan
Write-Host "  API       →  http://localhost/api"               -ForegroundColor Cyan
Write-Host "  RabbitMQ  →  kubectl port-forward -n $Namespace svc/rabbitmq 15672:15672" -ForegroundColor DarkGray
Write-Host "  Keycloak  →  kubectl port-forward -n $Namespace svc/keycloak 8080:8080"   -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Useful commands:"                                -ForegroundColor DarkGray
Write-Host "    kubectl get pods -n $Namespace"                -ForegroundColor DarkGray
Write-Host "    kubectl logs -n $Namespace deployment/<name>"  -ForegroundColor DarkGray
Write-Host "    .\scripts\k8s-deploy.ps1 -Teardown"           -ForegroundColor DarkGray
Write-Host "────────────────────────────────────────────────" -ForegroundColor DarkGray
