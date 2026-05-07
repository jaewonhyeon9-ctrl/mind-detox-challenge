# Mind Detox Challenge — Status

**마지막 업데이트**: 2026-05-08
**Production**: https://mind-detox-challenge.vercel.app

## 한 줄 요약
독일어권 68명 명상 그룹의 일일 체크 PWA. 5월 챌린지 운영 중. 첫 방문 자동 튜토리얼 + 참가자 관리 + PWA 설치 가이드까지 완비.

## 스택
- Next.js 15.5.16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (beta)
- @supabase/supabase-js (aftermind-checkmate 프로젝트 재사용, prefix `mdc_*`)
- Vercel auto-deploy via git push

## 화면

### Heute 탭 (기본)
- 헤더: 달+별 아이콘, serif 제목, 실시간 날짜 (독일어 풀네임)
- 진행률 바 (라벤더 → 세이지 → 골드 그라데이션)
- 68명 카드 리스트 (체크 시 부드러운 세이지 글로우)
- 카드 우측: 누적 일수 (예: 7/29)

### Übersicht 탭
- 가로 그리드: 행=이름, 열=29일치
- **상단/하단 가로 스크롤바** (sync — 위에서도 스크롤 가능)
- **sticky 날짜 헤더** — 모바일 vertical 스크롤 시에도 날짜 항상 보임
- 진입 시 오늘 컬럼으로 자동 스크롤
- 워크숍 일자 (5/2, 5/16, 5/30): 골든 WS 배지
- 오늘: 라벤더 ring 강조

### 모달
- **App installieren** — iOS/Android/Desktop 자동 감지, 독일어 단계별 안내
- **Verwalten** — 참가자 추가 / 인라인 이름 수정 / 삭제 (확인 알림 포함)
- **Anleitung** — 5단계 튜토리얼 (첫 방문 자동 + 푸터 트리거)

## 데이터 모델

```sql
mdc_participants (id, name UNIQUE, display_order, created_at)
mdc_logs         (id, participant_id FK CASCADE, date, created_at, UNIQUE(participant_id, date))
```
- 존재 = TRUE, 없음 = FALSE
- RLS: 무인증 공개 (read/insert/update/delete)
- FK CASCADE: 참가자 삭제 시 그 사람의 모든 logs 자동 삭제

## 챌린지 설정 (`lib/challenge-config.ts`)
- 시작: 2026-05-02
- 끝:   2026-05-31
- 건너뜀: 2026-05-01, 2026-05-26
- 워크숍: 2026-05-02, 2026-05-16, 2026-05-30
- 시간대: Europe/Berlin

## PWA
- Manifest + 달+별 SVG 아이콘 (icon.svg, apple-icon.svg)
- Service Worker (`public/sw.js`) — 네트워크 우선, Supabase 호출은 항상 fresh
- iOS safe area 대응 (`env(safe-area-inset-*)`)
- Theme color: `#0a0a1f` (미드나잇)

## 완료된 마일스톤
- [x] 2026-05-07 초기 스캐폴딩 + 시드 + 첫 배포
- [x] 2026-05-07 모바일 UI 폴리시 + PWA + 독일어 설치 안내
- [x] 2026-05-07 명상 톤 디자인 리뉴얼 (별빛 배경, serif 제목)
- [x] 2026-05-07 동기화 상단 가로 스크롤바
- [x] 2026-05-08 모바일 sticky 날짜 헤더
- [x] 2026-05-08 참가자 CRUD (추가 / 수정 / 삭제)
- [x] 2026-05-08 5단계 독일어 튜토리얼

## 알려진 미완성 / 백로그
- 연속 일수(Streak) 표시 — 현재는 누적 일수만
- Supabase Realtime 구독 — 다른 사람 체크 시 즉시 반영 (현재는 새로고침)
- CSV export / 시트 동기화
- 드래그로 참가자 순서 변경
- 다국어 토글 (영어 등)

## 자세한 다음 단계
**`NEXT_STEPS.md`** 참조.
