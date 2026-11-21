#!/usr/bin/env bash
# ==============================================================================
# VibeGrid — Automated Post-Deploy Cache Warming & Crawl Defense
# Warms Next.js SSR pages, DB queries, and dynamic sitemap to eliminate cold-starts
# ==============================================================================

set -eo pipefail

BASE_URL="${1:-${NEXT_PUBLIC_APP_URL:-http://localhost:3000}}"
BASE_URL="${BASE_URL%/}"

echo "============================================================"
echo "🚀 VibeGrid Cache Warming & Crawl Defense: ${BASE_URL}"
echo "============================================================"

USER_AGENT_GOOGLE="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
USER_AGENT_WHATSAPP="WhatsApp/2.21.12.21 A"

warm_url() {
  local url="$1"
  local label="$2"
  local ua="${3:-$USER_AGENT_GOOGLE}"

  local start_ms
  start_ms=$(date +%s%N)
  
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: ${ua}" "${url}" || echo "000")
  
  local end_ms
  end_ms=$(date +%s%N)
  local duration_ms=$(( (end_ms - start_ms) / 1000000 ))

  if [[ "$http_code" =~ ^(200|301|302|304)$ ]]; then
    printf "  ✅ [%-3s] %-40s (%4sms)\n" "${http_code}" "${label}" "${duration_ms}"
  else
    printf "  ⚠️  [%-3s] %-40s (%4sms)\n" "${http_code}" "${label}" "${duration_ms}"
  fi
}

echo ""
echo "--- 1. Warming Core Public Landing Routes ---"
warm_url "${BASE_URL}/" "Home Feed (/)"
warm_url "${BASE_URL}/explore" "Explore Tech Discussions (/explore)"
warm_url "${BASE_URL}/communities" "Builder Communities (/communities)"
warm_url "${BASE_URL}/robots.txt" "Robots Policy (/robots.txt)"
warm_url "${BASE_URL}/sitemap.xml" "Dynamic XML Sitemap (/sitemap.xml)"

echo ""
echo "--- 2. Testing Case Normalization Redirects ---"
warm_url "${BASE_URL}/ROBOTS.TXT" "Uppercase /ROBOTS.TXT"
warm_url "${BASE_URL}/Sitemap.xml" "Mixed-case /Sitemap.xml"

echo ""
echo "--- 3. Pre-Warming Dynamic Sitemap Entries ---"
SITEMAP_CONTENT=$(curl -s "${BASE_URL}/sitemap.xml" || true)

if echo "${SITEMAP_CONTENT}" | grep -q "<loc>"; then
  DYNAMIC_URLS=$(echo "${SITEMAP_CONTENT}" | grep -oPm10 "(?<=<loc>)[^<]+" | head -n 10 || true)
  count=0
  for url in ${DYNAMIC_URLS}; do
    count=$((count + 1))
    path="${url#$BASE_URL}"
    warm_url "${url}" "Sitemap Dynamic: ${path:0:35}" "${USER_AGENT_WHATSAPP}"
  done
  echo "  Pre-warmed ${count} dynamic entity pages from sitemap."
else
  echo "  (Sitemap returned empty or non-XML; skipped dynamic extraction)"
fi

echo ""
echo "============================================================"
echo "✅ Cache warming cycle completed successfully!"
echo "============================================================"
