#!/bin/sh
# Cloudflare 고정 터널 만들기 (처음 한 번). 사용: sh scripts/setup-tunnel.sh poka.내도메인.com
# 1) 브라우저가 열리면 Cloudflare에 로그인하고 도메인을 고른다
# 2) "pokafinder" 터널을 만들고 주소를 연결한다
set -e
HOST="$1"
[ -n "$HOST" ] || { echo "사용: sh scripts/setup-tunnel.sh poka.내도메인.com"; exit 1; }
npx --yes cloudflared tunnel login
npx --yes cloudflared tunnel create pokafinder
npx --yes cloudflared tunnel route dns pokafinder "$HOST"
grep -q '^APP_URL=' .env.local 2>/dev/null || echo "APP_URL=https://$HOST" >> .env.local
echo "완료. 실행: npx cloudflared tunnel run --url http://localhost:3000 pokafinder"
