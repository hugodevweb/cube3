#!/usr/bin/env bash
# E2E smoke test — La Petite Maison de l'Épouvante
# Exercises the full happy path: login → products → order → community
#
# Usage:
#   bash scripts/smoke-test.sh [BASE_URL] [USERNAME] [PASSWORD]
#
# Defaults:
#   BASE_URL  = http://localhost:3000/api
#   USERNAME  = testuser
#   PASSWORD  = testpassword

set -euo pipefail

BASE_URL="${1:-http://localhost:3000/api}"
USERNAME="${2:-testuser}"
PASSWORD="${3:-testpassword}"
COOKIE_JAR="$(mktemp /tmp/smoke-cookies-XXXXXX.txt)"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[PASS]${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAIL++)); }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

info "Base URL : $BASE_URL"
info "User     : $USERNAME"
echo ""

# ─── Step 1: Login ───────────────────────────────────────────────────────────
info "Step 1 — Login"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -c "$COOKIE_JAR" \
  -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

if [[ "$HTTP_CODE" == "200" ]]; then
  ok "POST /auth/login → $HTTP_CODE"
else
  fail "POST /auth/login → $HTTP_CODE (expected 200)"
  echo "Aborting — cannot proceed without a valid session."
  exit 1
fi

# ─── Step 2: Get current user ────────────────────────────────────────────────
info "Step 2 — Current user (/auth/me)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  "$BASE_URL/auth/me")

if [[ "$HTTP_CODE" == "200" ]]; then
  ok "GET /auth/me → $HTTP_CODE"
else
  fail "GET /auth/me → $HTTP_CODE (expected 200)"
fi

# ─── Step 3: Browse products ─────────────────────────────────────────────────
info "Step 3 — Browse products"
PRODUCTS_BODY=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/vente/products")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  "$BASE_URL/vente/products")

if [[ "$HTTP_CODE" == "200" ]]; then
  ok "GET /vente/products → $HTTP_CODE"
else
  fail "GET /vente/products → $HTTP_CODE (expected 200)"
fi

# Extract the first product ID (requires jq)
PRODUCT_ID=""
if command -v jq &>/dev/null; then
  PRODUCT_ID=$(echo "$PRODUCTS_BODY" | jq -r '.[0].id // empty' 2>/dev/null || true)
fi

if [[ -n "$PRODUCT_ID" ]]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -b "$COOKIE_JAR" \
    "$BASE_URL/vente/products/$PRODUCT_ID")
  if [[ "$HTTP_CODE" == "200" ]]; then
    ok "GET /vente/products/$PRODUCT_ID → $HTTP_CODE"
  else
    fail "GET /vente/products/$PRODUCT_ID → $HTTP_CODE (expected 200)"
  fi
else
  info "No products found — skipping product detail check"
fi

# ─── Step 4: Place an order ──────────────────────────────────────────────────
info "Step 4 — Place an order"
if [[ -n "$PRODUCT_ID" ]]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/vente/orders" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":1}]}")

  if [[ "$HTTP_CODE" == "201" ]]; then
    ok "POST /vente/orders → $HTTP_CODE"
  else
    fail "POST /vente/orders → $HTTP_CODE (expected 201)"
  fi

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -b "$COOKIE_JAR" \
    "$BASE_URL/vente/orders")
  if [[ "$HTTP_CODE" == "200" ]]; then
    ok "GET /vente/orders → $HTTP_CODE"
  else
    fail "GET /vente/orders → $HTTP_CODE (expected 200)"
  fi
else
  info "No products available — skipping order placement"
fi

# ─── Step 5: Community posts ─────────────────────────────────────────────────
info "Step 5 — Community posts"
POSTS_BODY=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/communaute/posts")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  "$BASE_URL/communaute/posts")

if [[ "$HTTP_CODE" == "200" ]]; then
  ok "GET /communaute/posts → $HTTP_CODE"
else
  fail "GET /communaute/posts → $HTTP_CODE (expected 200)"
fi

# ─── Step 6: Create a post ───────────────────────────────────────────────────
info "Step 6 — Create a community post"
CREATE_POST_BODY=$(curl -s \
  -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/communaute/posts" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke test post","content":"Automated smoke test — safe to delete."}')
HTTP_CODE=$(echo "$CREATE_POST_BODY" | grep -o '"id"' | wc -l | tr -d ' ')

CREATE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/communaute/posts" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke test post 2","content":"Automated smoke test — safe to delete."}')

if [[ "$CREATE_CODE" == "201" ]]; then
  ok "POST /communaute/posts → $CREATE_CODE"
else
  fail "POST /communaute/posts → $CREATE_CODE (expected 201)"
fi

# ─── Step 7: Logout ──────────────────────────────────────────────────────────
info "Step 7 — Logout"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/auth/logout")

if [[ "$HTTP_CODE" == "204" ]]; then
  ok "POST /auth/logout → $HTTP_CODE"
else
  fail "POST /auth/logout → $HTTP_CODE (expected 204)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────"
echo -e "  Results: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}"
echo "────────────────────────────────────"

[[ "$FAIL" -eq 0 ]]
