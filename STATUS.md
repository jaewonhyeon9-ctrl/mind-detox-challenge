# Mind Detox Challenge — Status

**마지막 업데이트**: 2026-05-07

## 한 줄 요약
독일 명상 그룹(68명) 일일 체크 앱. 5월 챌린지 진행 중. Next.js 15 + Supabase. 시드/배포 대기.

## 스택
- Next.js 15 (App Router) + React 19
- TypeScript + Tailwind CSS 4 (beta)
- @supabase/supabase-js (aftermind-checkmate 프로젝트 재사용, prefix `mdc_*`)
- Vercel 배포 예정 (auto-deploy via git push)

## UI
- 언어: 독일어 (`<html lang="de">`)
- 두 가지 뷰:
  - **Heute** — 오늘 날짜 + 모든 참가자 큰 버튼 한 번에 토글
  - **Übersicht** — 월간 그리드 (행=이름, 열=날짜, 셀 클릭 토글, 워크숍/오늘 강조)
- 다크 그라데이션 테마

## 데이터 모델
```
mdc_participants (id, name, display_order, created_at)
mdc_logs         (id, participant_id, date, created_at) — 존재=TRUE, 없음=FALSE
```
- RLS: 공개 read/insert/delete (신뢰 그룹 전제, 무인증)

## 챌린지 설정 (`lib/challenge-config.ts`)
- 시작: 2026-05-02
- 끝:   2026-05-31
- 건너뜀: 2026-05-01, 2026-05-26 (시트 기준 26일은 명상 안 함)
- 워크숍: 2026-05-02, 2026-05-16, 2026-05-30
- 시간대: Europe/Berlin

## 인증/보안
- 로그인 없음 (신뢰 그룹 결정)
- aftermind-checkmate Supabase API key 공유. RLS로 다른 테이블과 격리
- 시드/관리는 service_role key (서버에서만 사용)

## 다음 작업
**`NEXT_STEPS.md` 참조.** 핵심:
1. Supabase에서 `migration-001-init.sql` 실행
2. `npm run seed`
3. `npm run dev`로 확인
4. Vercel 배포

## 알려진 미완성
- PWA 미구현 (manifest/sw 없음)
- 실시간 구독 없음 (체크 시 다른 사용자는 새로고침해야 보임)
- 참가자 추가/삭제 UI 없음 (시드로만 입력)
- Streak(연속 일수) 표시 없음 — 누적 일수만
