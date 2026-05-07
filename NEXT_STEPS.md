# Mind Detox Challenge — Naechste Schritte

> **다음 세션에서 이 파일 먼저 읽기.** 진행 상태와 다음에 할 일이 정리되어 있음.

## 🚦 현재 상태 (2026-05-08)

✅ **운영 중** — https://mind-detox-challenge.vercel.app

- Next.js 15 + React 19 + Tailwind 4 + Supabase 스캐폴딩
- 독일어 UI 두 뷰: **Heute** (오늘 체크) / **Übersicht** (월간 그리드, sticky 날짜 헤더 + 동기화 상단 스크롤바)
- PWA: manifest + 달+별 SVG 아이콘 + service worker
- "App installieren" 모달: iOS/Android/Desktop 자동 감지, 독일어 안내
- "Verwalten" 모달: 참가자 추가 / 수정 / 삭제 (cascade delete)
- 5단계 독일어 튜토리얼: 첫 방문 자동 + 푸터 "Anleitung anzeigen"
- 명상 톤 디자인: 미드나잇 그라데이션 + 별빛 + 라벤더/세이지/골드 액센트, serif 제목
- aftermind-checkmate Supabase 프로젝트 재사용 (`mdc_*` prefix), Vercel auto-deploy

## ⚠️ 새로운 환경에서 다시 셋업하려면

### 1. Supabase 마이그레이션 (한 번만)
[Supabase 대시보드](https://supabase.com/dashboard/project/pwnegioardhvvkxttjsx) → SQL Editor:

1. `supabase/migration-001-init.sql` 복붙 → Run
2. `supabase/migration-002-participant-crud.sql` 복붙 → Run

### 2. 시드 (한 번만)
```powershell
cd "C:\Users\Hyun Jae Won\Desktop\mind-detox-challenge"
npm install
npm run seed
```
> ⚠️ 운영 중에는 절대 재실행 금지 — 모든 logs/participants 삭제됨.

### 3. 개발 서버
```powershell
npm run dev   # http://localhost:3000
```

### 4. 배포
이미 GitHub `main` 브랜치 → Vercel auto-deploy 연결됨.
```powershell
git add . && git commit -m "..." && git push
```
→ 1~2분 후 https://mind-detox-challenge.vercel.app 자동 갱신.

## 🧩 다음에 추가할 만한 기능 (백로그)

- **연속 일수 (Streak) 표시** — 누적이 아닌 연속 명상일
- **워크숍 일자 필터** — 워크숍 날만 따로 보기
- **Supabase Realtime 구독** — 다른 사람이 체크하면 즉시 반영 (현재는 새로고침 필요)
- **CSV export / 시트 동기화** — 운영 종료 시 백업
- **드래그 정렬** — 참가자 순서 변경 (display_order)
- **Streak 격려 메시지** — Heute 뷰에서 "5일 연속!" 같은
- **다국어** — 영어 토글 (관광객 가입 시)

## 📂 프로젝트 구조

```
mind-detox-challenge/
├─ app/
│  ├─ globals.css           Tailwind 4 + 별빛 배경 + soft-scroll + breathe-in
│  ├─ layout.tsx            lang="de", PWA 메타데이터, ServiceWorker 등록
│  ├─ page.tsx              Server Component (Supabase 데이터 로드)
│  ├─ icon.svg              앱 아이콘 (달+별)
│  ├─ apple-icon.svg        iOS 홈화면 아이콘
│  └─ manifest.ts           PWA manifest
├─ components/
│  ├─ ChallengeBoard.tsx    Heute / Übersicht 뷰 + Header/Footer
│  ├─ InstallApp.tsx        "App installieren" 모달
│  ├─ ManageParticipants.tsx 참가자 CRUD 모달 (Verwalten)
│  ├─ ServiceWorkerRegister.tsx
│  └─ Tutorial.tsx          5단계 독일어 가이드
├─ lib/
│  ├─ challenge-config.ts   일자 빌더 + Berlin TZ + 워크숍/스킵 일자
│  └─ supabase.ts           createClient (anon key)
├─ scripts/
│  └─ seed.mjs              CSV → DB (한 번만)
├─ supabase/
│  ├─ migration-001-init.sql           초기 테이블 + RLS
│  └─ migration-002-participant-crud.sql RLS INSERT/UPDATE/DELETE
├─ public/
│  └─ sw.js                 Service worker (네트워크 우선, Supabase 패스스루)
├─ data/
│  └─ sheet.csv             원본 시트 백업
└─ .env.local               실제 키 (gitignored)
```

## ⚠️ 주의사항

- **aftermind-checkmate Supabase와 공유** — 테이블 prefix `mdc_*`로 분리됨. 충돌 없음.
- **무인증**: 누구나 체크/추가/수정/삭제 가능. 신뢰 그룹 전제.
- **시간대**: Europe/Berlin 기준 "오늘". 한국 새벽에 보면 베를린 어제일 수 있음.
- **시드 재실행 위험**: 운영 중 `npm run seed` 절대 금지. 전체 데이터 삭제 후 재삽입.
- **Tailwind 4 beta**: stable 출시 시 업그레이드 검토.
- **삭제 시 cascade**: 참가자 삭제하면 그 사람의 모든 명상 로그도 자동 삭제 (FK ON DELETE CASCADE).

## 🔧 참고

- **Supabase 프로젝트 ID**: `pwnegioardhvvkxttjsx`
- **Vercel 프로젝트**: `jaewonhyeon9-7705s-projects/mind-detox-challenge`
- **GitHub repo**: https://github.com/jaewonhyeon9-ctrl/mind-detox-challenge (public)
- **Production URL**: https://mind-detox-challenge.vercel.app
- **원본 시트**: https://docs.google.com/spreadsheets/d/1lCYi_pKPQPX6GEwJQ0sBNgG89nVeXsk1VLpond7LERo
