# Start the full local dev stack — La Petite Maison de l'Épouvante
#
# Opens each service in a new PowerShell window, then opens the browser.
# Run from the project root:  .\scripts\start-dev.ps1
#
# Prerequisites:
#   - Docker Desktop running
#   - npm install done in every service (run this script once, it will offer to install)
#   - .env at the project root

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

function Write-Step { param($n, $msg) Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg)     Write-Host "    OK  $msg" -ForegroundColor Green }
function Write-Warn { param($msg)     Write-Host "    !!  $msg" -ForegroundColor Yellow }

# ── 0. Make sure we're at the project root ────────────────────────────────────
Set-Location $Root

# ── 1. Check node_modules in every service ────────────────────────────────────
Write-Step 1 "Checking node_modules..."
$services = @("services\auth","services\gateway","services\vente","services\communaute","services\media","frontend")
foreach ($svc in $services) {
    if (-not (Test-Path "$Root\$svc\node_modules")) {
        Write-Warn "$svc missing node_modules — running npm install..."
        Push-Location "$Root\$svc"
        npm install | Out-Null
        Pop-Location
        Write-Ok "$svc installed"
    } else {
        Write-Ok "$svc OK"
    }
}

# ── 2. Start Docker Compose (infra only) ─────────────────────────────────────
Write-Step 2 "Starting Docker Compose (PostgreSQL + RabbitMQ + Keycloak)..."
docker compose up -d postgres rabbitmq keycloak
if ($LASTEXITCODE -ne 0) { Write-Error "docker compose up failed"; exit 1 }
Write-Ok "Containers started"

# ── 3. Wait for Keycloak to be healthy ────────────────────────────────────────
Write-Step 3 "Waiting for Keycloak to be healthy (up to 120 s)..."
$maxWait  = 300
$interval = 10
$elapsed  = 0
do {
    Start-Sleep $interval
    $elapsed += $interval
    $status = docker inspect --format="{{.State.Health.Status}}" maison_keycloak 2>$null
    Write-Host "    $elapsed s — Keycloak: $status" -ForegroundColor DarkGray
} while ($status -ne "healthy" -and $elapsed -lt $maxWait)

if ($status -ne "healthy") {
    Write-Warn "Keycloak did not become healthy within $maxWait s — continuing anyway"
} else {
    Write-Ok "Keycloak healthy"
}

# ── 4. Launch each NestJS service in a new window ─────────────────────────────
Write-Step 4 "Launching microservices in separate windows..."

$svcDefs = @(
    @{ title = "Auth   :3001"; path = "services\auth" },
    @{ title = "Gateway:3000"; path = "services\gateway" },
    @{ title = "Vente  :3002"; path = "services\vente" },
    @{ title = "Comm.  :3003"; path = "services\communaute" },
    @{ title = "Media  :3004"; path = "services\media" }
)

foreach ($svc in $svcDefs) {
    $dir = "$Root\$($svc.path)"
    Start-Process powershell -ArgumentList `
        "-NoExit", `
        "-Command", `
        "Set-Location '$dir'; `$host.ui.RawUI.WindowTitle='$($svc.title)'; npm run start:dev"
    Write-Ok "$($svc.title)"
}

# ── 5. Launch the frontend ─────────────────────────────────────────────────────
Write-Step 5 "Launching frontend (Vite :5173)..."
$frontendDir = "$Root\frontend"
Start-Process powershell -ArgumentList `
    "-NoExit", `
    "-Command", `
    "Set-Location '$frontendDir'; `$host.ui.RawUI.WindowTitle='Frontend :5173'; npm run dev"
Write-Ok "Frontend"

# ── 6. Summary ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  Stack started — wait ~15 s for services to boot" -ForegroundColor White
Write-Host "════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Frontend         http://localhost:5173"
Write-Host "  API Gateway      http://localhost:3000/api/docs"
Write-Host "  Auth Service     http://localhost:3001/auth/docs"
Write-Host "  Vente Service    http://localhost:3002/vente/docs"
Write-Host "  Communaute       http://localhost:3003/communaute/docs"
Write-Host "  Keycloak Admin   http://localhost:8080   (admin / changeme_admin)"
Write-Host "  RabbitMQ UI      http://localhost:15672  (maison / changeme)"
Write-Host ""
Write-Host "  Users:  admin-test / admin123   (roles: admin + user)"
Write-Host "          user-test  / user123    (role: user)"
Write-Host ""
Write-Host "  Once services are up, seed demo products:"
Write-Host "  .\scripts\seed-products.ps1" -ForegroundColor Yellow
Write-Host ""
