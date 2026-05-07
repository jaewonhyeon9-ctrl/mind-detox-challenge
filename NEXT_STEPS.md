# Mind Detox Challenge — Naechste Schritte

> **다음 세션에서 이 파일 먼저 읽기.** 진행 상태와 다음에 할 일이 정리되어 있음.

## 🚦 현재 상태 (2026-05-07)

✅ 완료
- Next.js 15 + React 19 + Tailwind 4 + Supabase 스캐폴딩
- 독일어 UI 두 개 뷰: **Heute** (오늘 체크) / **Übersicht** (월간 그리드)
- 시드 스크립트 (`scripts/seed.mjs`) — CSV → Supabase
- SQL 마이그레이션 (`supabase/migration-001-init.sql`)
- aftermind-checkmate Supabase 프로젝트 재사용 (`.env.local` 설정됨)

⏳ 미완 / 사용자 액션 필요
1. **Supabase에서 SQL 마이그레이션 실행** — Supabase SQL Editor 열어서
   `supabase/migration-001-init.sql` 내용 복사 후 실행
2. **시드 실행** — `npm run seed`
3. **dev 서버 확인** — `npm run dev` 후 http://localhost:3000
4. **Vercel 배포** — github 연결 + auto-deploy (배포는 git push로만 패턴)

## 📋 사용자가 해야 할 단계 (순서대로)

### 1. Supabase에 테이블 만들기
1. https://supabase.com/dashboard/project/pwnegioardhvvkxttjsx 접속
2. SQL Editor 열기 (왼쪽 사이드바)
3. `supabase/migration-001-init.sql` 파일 내용 전체 복사 → 붙여넣기 → **Run**
4. 두 테이블 `mdc_participants`, `mdc_logs` 생성 확인

### 2. 시드 (참가자 + 기존 체크 데이터 입력)
```powershell
cd C:\Users\Hyun Jae Won\Desktop\mind-detox-challenge
npm run seed
```
출력 예시:
```
Parsed 68 participants, 29 days
Truncating existing data…
Inserting participants…
Inserting 24 log rows…
Seed complete.
```

### 3. 개발 서버
```powershell
npm run dev
```
브라우저: http://localhost:3000

### 4. 배포 (선택)
- 새 GitHub repo 만들기 → push
- Vercel 대시보드 → New Project → repo 선택
- 환경변수 3개 설정 (`.env.local` 내용 그대로):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Deploy

## 🧩 다음에 추가할 만한 기능 (선택)

- **PWA**: `manifest.json` + service worker (홈화면 추가 가능)
- **참가자 추가 UI**: 현재는 시드만으로 입력. 운영자 화면 필요할 수도
- **연속 일수(Streak) 표시**: 현재는 누적 일수만
- **워크숍 일자 필터**: 워크숍 날만 따로 보기
- **Supabase Realtime 구독**: 다른 사람이 체크하면 즉시 반영 (현재는 새로고침 필요)
- **CSV export**: 다시 시트로 내보내기

## 📂 프로젝트 구조

```
mind-detox-challenge/
├─ app/
│  ├─ globals.css       (Tailwind 4 import + 다크 그라데이션)
│  ├─ layout.tsx        (lang="de", 메타데이터)
│  └─ page.tsx          (Server Component, 데이터 로드)
├─ components/
│  └─ ChallengeBoard.tsx (Heute / Übersicht 뷰)
├─ lib/
│  ├─ challenge-config.ts (일자 빌더, Berlin TZ, 워크숍/스킵 일자)
│  └─ supabase.ts          (createClient)
├─ scripts/
│  └─ seed.mjs           (CSV → DB)
├─ supabase/
│  └─ migration-001-init.sql
├─ data/
│  └─ sheet.csv          (원본 시트 백업)
└─ .env.local             (실제 키 들어있음, .gitignore됨)
```

## ⚠️ 주의사항

- **체크메이트 Supabase와 같이 씀** — 테이블 prefix `mdc_*`로 분리됨. 충돌 없음.
- **무인증**: 누구나 다른 사람을 체크할 수 있음. 신뢰 그룹 전제. (사용자 OK)
- **시간대**: Berlin TZ 기준으로 "오늘" 계산. 한국에서 새벽에 보면 베를린 어제일 수 있음.
- **시드 재실행 위험**: 시드 스크립트는 `mdc_logs`/`mdc_participants` 전체 삭제 후 재삽입. 운영 중에는 절대 실행 금지.
