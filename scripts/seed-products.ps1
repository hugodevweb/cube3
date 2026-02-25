# Seed demo products — La Petite Maison de l'Épouvante
# Logs in as admin-test, creates 6 products across all categories.
#
# Usage (after the full stack is running):
#   .\scripts\seed-products.ps1 [-BaseUrl <url>]
#
# Default BaseUrl: http://localhost:3000/api

param(
    [string]$BaseUrl = "http://localhost:3000/api"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Write-Ok   { param($msg) Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }

Write-Info "Logging in as admin-test..."

# ── Login ──────────────────────────────────────────────────────────────────────
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{ username = "admin-test"; password = "admin1234" }) `
        -WebSession $Session `
        -UseBasicParsing
    Write-Ok "Logged in as admin-test"
} catch {
    Write-Fail "Login failed: $($_.Exception.Message)"
    exit 1
}

# ── Products to seed ───────────────────────────────────────────────────────────
$products = @(
    @{
        name        = "The Thing — Coffret Blu-ray 4K"
        description = "Édition collector 4K UHD avec livret 48 pages et jaquette réversible. John Carpenter, 1982."
        price       = 34.99
        stock       = 15
        type        = "film"
        metadata    = @{ director = "John Carpenter"; year = 1982; format = "4K UHD" }
    },
    @{
        name        = "Hellraiser — Édition Limitée"
        description = "Blu-ray zone B. Inclut le making-of inédit et le script original de Clive Barker."
        price       = 29.99
        stock       = 8
        type        = "film"
        metadata    = @{ director = "Clive Barker"; year = 1987; format = "Blu-ray" }
    },
    @{
        name        = "Saga Locke & Key — Intégrale Tomes 1-6"
        description = "Coffret intégral de la BD culte de Joe Hill et Gabriel Rodriguez. Édition prestige."
        price       = 89.99
        stock       = 5
        type        = "bd"
        metadata    = @{ author = "Joe Hill"; artist = "Gabriel Rodriguez"; volumes = 6 }
    },
    @{
        name        = "Grendel — Fanzine n°12"
        description = "Publication indépendante du collectif Grendel. Nouvelles courtes et illustrations originales."
        price       = 8.50
        stock       = 30
        type        = "bd"
        metadata    = @{ issue = 12; publisher = "Collectif Grendel"; pages = 64 }
    },
    @{
        name        = "Figurine Pennyhead — 30 cm résine"
        description = "Figurine de collection en résine peinte à la main. Édition limitée à 200 exemplaires."
        price       = 74.99
        stock       = 12
        type        = "goodie"
        metadata    = @{ material = "résine"; height_cm = 30; limited_edition = 200 }
    },
    @{
        name        = "Vinyle — Bande Originale Halloween (1978)"
        description = "Pressage 180g transparent. Musique originale composée et interprétée par John Carpenter."
        price       = 39.99
        stock       = 20
        type        = "goodie"
        metadata    = @{ format = "vinyle 180g"; composer = "John Carpenter"; year = 1978 }
    }
)

$created = 0
foreach ($product in $products) {
    try {
        $body = ConvertTo-Json $product -Depth 5
        $resp = Invoke-WebRequest -Uri "$BaseUrl/vente/products" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -WebSession $Session `
            -UseBasicParsing
        Write-Ok "Created: $($product.name)"
        $created++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Fail "Failed ($code): $($product.name)"
    }
}

Write-Host ""
Write-Host "────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Seeded $created / $($products.Count) products" -ForegroundColor White
Write-Host "────────────────────────────────────" -ForegroundColor DarkGray
