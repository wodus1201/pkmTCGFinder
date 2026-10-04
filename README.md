# 포카파인더

내 위치와 관심 지역 주변 편의점에 포켓몬 카드 재고가 생기면 폰으로 알려주는 웹앱(PWA)입니다.

## 실행

```bash
npm install
npm run build && npm start   # 평소 사용 (빠름)
npm run dev                  # 코드 고칠 때만
```

http://localhost:3000/stock 을 열면 됩니다. 서버가 켜져 있는 동안 10분마다(`CHECK_INTERVAL_MIN`) 알림을 켠 사용자의 위치를 확인해서 새 재고가 생기면 웹 푸시를 보냅니다.

처음 재고를 조회할 때 이마트24 전국 매장 목록(약 140페이지)을 받느라 1~2분 걸립니다. 이후에는 `data/`에 일주일간 캐시됩니다.

## 카드 도감 데이터

홈·도감·스캔·거래소 탭은 포켓몬코리아 카드 검색(pokemoncard.co.kr)에서 모은 한글판 카드를 씁니다. 처음 한 번 모아야 합니다 (1초에 한 장, 세트당 2분 정도).

```bash
npx tsx scripts/crawl-cards.ts 2023 2026
```

`data/cards.json`에 저장되고, 중간에 멈춰도 다시 실행하면 이어서 받습니다. 새 세트가 나오면 같은 명령을 다시 실행하세요. 보유 카드는 이 기기 브라우저에만 저장됩니다.

## 폰에서 알림 받기

웹 푸시는 HTTPS에서만 동작합니다. 맥에서 서버를 띄운 채로 터널을 열어 폰에서 접속하는 게 가장 간단합니다.

```bash
npx cloudflared tunnel --url http://localhost:3000
```

- 안드로이드: 크롬에서 주소를 열고 재고 탭에서 "알림 켜기"
- 아이폰(iOS 16.4+): 사파리 공유 버튼 → "홈 화면에 추가" → 홈 화면 앱에서 "알림 켜기"

## 데이터 출처와 한계

| 출처 | 내용 | 상태 |
| --- | --- | --- |
| 이마트24 비공식 웹 API | 매장별 포켓몬 카드 재고 수량 | 동작 (요청이 몰리면 IP가 30분가량 차단돼서 요청 간격을 0.5초로 둠) |
| 포켓몬코리아 공식 자판기 지도 | 자판기 위치 176곳 | 위치만, 재고 정보 없음 |
| CU | 상품 검색은 되지만 매장별 수량은 공개 API에 없음 | 미지원 |
| GS25, 세븐일레븐 | 앱 API가 인증키·방화벽으로 막혀 있음 | 미지원 |

- 편의점 API는 모두 비공식이라 예고 없이 막힐 수 있습니다. 이마트24 조회 방식은 [hmmhmmhm/daiso-mcp](https://github.com/hmmhmmhm/daiso-mcp)(MIT)의 분석을 참고했습니다.
- "내 위치" 알림은 마지막으로 앱을 연 위치 기준입니다. 웹은 백그라운드 위치를 받을 수 없어서, 자주 가는 곳은 관심 지역으로 저장해 두는 걸 권장합니다.
- 구독·관심 지역은 `data/db.json`에 저장됩니다. 서버 한 대 기준이라, 배포할 때는 계속 떠 있는 Node 서버(`npm run build && npm start`)가 필요합니다.

## 확인

```bash
npx tsx lib/watch.check.ts
```

## 사진 인식

```bash
npx tsx scripts/hash-cards.ts
```

카드를 새로 모은 뒤 실행하면 사진 인식용 지문(`data/prints.json`)이 갱신됩니다. 정확도 확인: `npx tsx lib/fingerprint.check.ts`

## 고정 주소 (Tailscale Funnel, 무료)

1. 맥에 Tailscale 앱을 설치하고 로그인 (tailscale.com/download)
2. 서버를 켜 두고 외부 공개:

```bash
npm run build
npx pm2 start ecosystem.config.cjs && npx pm2 save
/Applications/Tailscale.app/Contents/MacOS/Tailscale funnel --bg 3000
```

처음 한 번은 Funnel 사용 승인 링크가 나오니 브라우저에서 승인합니다. 주소는 `https://맥이름.tailnet이름.ts.net` 형태로 고정되고, `--bg`라 재부팅 후에도 유지됩니다. 이 주소를 `.env.local`에 `APP_URL=https://...ts.net`로 넣습니다.

## 카카오 로그인

1. developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가
2. 앱 키의 **REST API 키**를 `.env.local`에 `KAKAO_REST_API_KEY=...`로 넣기
3. 플랫폼 → Web → 사이트 도메인에 `https://맥이름.tailnet이름.ts.net` 등록
4. 카카오 로그인 → 활성화, Redirect URI에 `https://맥이름.tailnet이름.ts.net/api/auth/kakao/callback` 등록
5. 동의항목 → 닉네임, 프로필 사진 사용
6. (선택) 보안 → Client Secret을 켰다면 `KAKAO_CLIENT_SECRET=...` 추가
7. `npm run build` 후 서버 재시작

보유 카드와 거래소 글은 카카오 계정별로 `data/db.json`에 저장됩니다. 로그인 전에 쓰던 보유 카드는 첫 로그인 계정으로 옮겨집니다.

## 다른 맥(예: 회사 맥)으로 서버 옮기기

1. 새 맥에 Node 22, git, Tailscale 설치 후 같은 Tailscale 계정으로 로그인
2. 저장소 받기: `gh repo clone wodus1201/pkmTCGFinder && cd pkmTCGFinder && npm install`
3. 지금 맥에서 `data/` 폴더 전체와 `.env.local`을 새 맥의 같은 위치로 복사 (AirDrop 등). `data/`에는 카드 데이터, 계정·도감, 알림 구독, **VAPID 키(`vapid.json`)**, **로그인 서명 키(`auth-secret.txt`)**가 들어 있어서, 바뀌면 알림 구독과 로그인이 풀립니다.
4. 지금 맥: `npx pm2 delete all`, `Tailscale funnel --bg off`, 그리고 Tailscale 관리 화면(login.tailscale.com/admin/machines)에서 지금 맥의 이름을 다른 이름으로 바꾸기
5. 새 맥: 관리 화면에서 새 맥 이름을 지금 맥이 쓰던 이름으로 바꾼 뒤 `npm run build && npx pm2 start ecosystem.config.cjs && npx pm2 save && Tailscale funnel --bg 3000`
6. 재부팅 후 자동 실행: `npx pm2 startup`이 알려주는 명령을 한 번 실행

맥 이름을 넘겨받으면 주소(`*.ts.net`)가 그대로라서 카카오 설정과 폰 홈 화면 앱을 바꿀 필요가 없습니다.
