# Mind Detox Challenge Sheet

Tägliche Meditation für eine deutschsprachige Gruppe (~68 Teilnehmer).
Webapp, die das gemeinsame Google-Sheet ersetzt.

**한국어 작업자 안내**: `NEXT_STEPS.md` 먼저 읽으세요.

## Quick start

```bash
npm install
# 1. supabase/migration-001-init.sql 을 Supabase SQL Editor 에서 실행
npm run seed   # CSV → DB (한 번만)
npm run dev
```

## Stack
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (aftermind-checkmate 프로젝트 재사용, prefix `mdc_*`)

## Folders
- `app/`         — Next.js App Router 페이지
- `components/`  — `ChallengeBoard.tsx` (Heute / Übersicht 뷰)
- `lib/`         — `supabase.ts`, `challenge-config.ts`
- `scripts/`     — `seed.mjs` (CSV → DB)
- `supabase/`    — 마이그레이션 SQL
- `data/`        — 원본 시트 CSV 백업
