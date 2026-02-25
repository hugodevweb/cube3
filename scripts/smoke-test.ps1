# E2E smoke test — La Petite Maison de l'Épouvante (PowerShell)
# Exercises the full happy path: login → products → order → community
#
# Usage:
#   .\scripts\smoke-test.ps1 [-BaseUrl <url>] [-Username <user>] [-Password <pass>]
#
# Defaults:
#   BaseUrl  = http://localhost:3000/api
#   Username = user-test
#   Password = user123

param(
    [string]$BaseUrl  = "http://localhost:3000/api",
    [string]$Username = "user-test",
    [string]$Password = "user123"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Pass = 0
$Fail = 0

# Cookie session (Invoke-WebRequest persists cookies per session)
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Write-Ok   { param($msg) Write-Host "[PASS] $msg" -ForegroundColor Green;  $script:Pass++ }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red;    $script:Fail++ }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Yellow }

Write-Info "Base URL : $BaseUrl"
Write-Info "User     : $Username"
Write-Host ""

# ─── Step 1: Login ───────────────────────────────────────────────────────────
Write-Info "Step 1 — Login"
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ username = $Username; password = $Password }) `
        -WebSession $Session `
        -UseBasicParsing
    if ($resp.StatusCode -eq 200) { Write-Ok "POST /auth/login → 200" }
    else                           { Write-Fail "POST /auth/login → $($resp.StatusCode) (expected 200)" }
} catch {
    Write-Fail "POST /auth/login → $($_.Exception.Response.StatusCode) — aborting"
    exit 1
}

# ─── Step 2: Current user ────────────────────────────────────────────────────
Write-Info "Step 2 — Current user (/auth/me)"
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/auth/me" `
        -Method GET `
        -WebSession $Session `
        -UseBasicParsing
    if ($resp.StatusCode -eq 200) { Write-Ok "GET /auth/me → 200" }
    else                           { Write-Fail "GET /auth/me → $($resp.StatusCode) (expected 200)" }
} catch {
    Write-Fail "GET /auth/me → $($_.Exception.Response.StatusCode)"
}

# ─── Step 3: Browse products ─────────────────────────────────────────────────
Write-Info "Step 3 — Browse products"
$ProductId = $null
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/vente/products" `
        -Method GET `
        -WebSession $Session `
        -UseBasicParsing
    if ($resp.StatusCode -eq 200) {
        Write-Ok "GET /vente/products → 200"
        $products = $resp.Content | ConvertFrom-Json
        if ($products.Count -gt 0) { $ProductId = $products[0].id }
    } else {
        Write-Fail "GET /vente/products → $($resp.StatusCode) (expected 200)"
    }
} catch {
    Write-Fail "GET /vente/products → $($_.Exception.Response.StatusCode)"
}

if ($ProductId) {
    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl/vente/products/$ProductId" `
            -Method GET `
            -WebSession $Session `
            -UseBasicParsing
        if ($resp.StatusCode -eq 200) { Write-Ok "GET /vente/products/$ProductId → 200" }
        else                           { Write-Fail "GET /vente/products/$ProductId → $($resp.StatusCode)" }
    } catch {
        Write-Fail "GET /vente/products/$ProductId → error"
    }
} else {
    Write-Info "No products found — skipping product detail check"
}

# ─── Step 4: Place an order ──────────────────────────────────────────────────
Write-Info "Step 4 — Place an order"
if ($ProductId) {
    try {
        $orderBody = ConvertTo-Json @{ items = @(@{ productId = $ProductId; quantity = 1 }) }
        $resp = Invoke-WebRequest -Uri "$BaseUrl/vente/orders" `
            -Method POST `
            -ContentType "application/json" `
            -Body $orderBody `
            -WebSession $Session `
            -UseBasicParsing
        if ($resp.StatusCode -eq 201) { Write-Ok "POST /vente/orders → 201" }
        else                           { Write-Fail "POST /vente/orders → $($resp.StatusCode) (expected 201)" }
    } catch {
        Write-Fail "POST /vente/orders → $($_.Exception.Response.StatusCode)"
    }

    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl/vente/orders" `
            -Method GET `
            -WebSession $Session `
            -UseBasicParsing
        if ($resp.StatusCode -eq 200) { Write-Ok "GET /vente/orders → 200" }
        else                           { Write-Fail "GET /vente/orders → $($resp.StatusCode)" }
    } catch {
        Write-Fail "GET /vente/orders → error"
    }
} else {
    Write-Info "No products available — skipping order placement"
}

# ─── Step 5: Community posts ─────────────────────────────────────────────────
Write-Info "Step 5 — Community posts"
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/communaute/posts" `
        -Method GET `
        -WebSession $Session `
        -UseBasicParsing
    if ($resp.StatusCode -eq 200) { Write-Ok "GET /communaute/posts → 200" }
    else                           { Write-Fail "GET /communaute/posts → $($resp.StatusCode)" }
} catch {
    Write-Fail "GET /communaute/posts → $($_.Exception.Response.StatusCode)"
}

# ─── Step 6: Create a post ───────────────────────────────────────────────────
Write-Info "Step 6 — Create a community post"
try {
    $postBody = ConvertTo-Json @{ title = "Smoke test post"; content = "Automated smoke test — safe to delete." }
    $resp = Invoke-WebRequest -Uri "$BaseUrl/communaute/posts" `
        -Method POST `
        -ContentType "application/json" `
        -Body $postBody `
        -WebSession $Session `
        -UseBasicParsing
    if ($resp.StatusCode -eq 201) { Write-Ok "POST /communaute/posts → 201" }
    else                           { Write-Fail "POST /communaute/posts → $($resp.StatusCode) (expected 201)" }
} catch {
    Write-Fail "POST /communaute/posts → $($_.Exception.Response.StatusCode)"
}

# ─── Step 7: Logout ──────────────────────────────────────────────────────────
Write-Info "Step 7 — Logout"
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/auth/logout" `
        -Method POST `
        -WebSession $Session `
        -UseBasicParsing
    if ($resp.StatusCode -eq 204) { Write-Ok "POST /auth/logout → 204" }
    else                           { Write-Fail "POST /auth/logout → $($resp.StatusCode) (expected 204)" }
} catch {
    # 204 No Content can throw in PowerShell — check if it's actually a no-content response
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 204) { Write-Ok "POST /auth/logout → 204" }
    else                      { Write-Fail "POST /auth/logout → $statusCode" }
}

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "────────────────────────────────────"
Write-Host "  Results: " -NoNewline
Write-Host "$Pass passed  " -ForegroundColor Green -NoNewline
Write-Host "$Fail failed"  -ForegroundColor Red
Write-Host "────────────────────────────────────"

if ($Fail -gt 0) { exit 1 }
