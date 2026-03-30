# Analysis: ai-plan-start-date

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | weekStart 항상 이번 주 월요일 고정 → 오늘이 휴식일이면 즉시 운동 불가 |
| WHO | AI 플랜 생성/재생성 후 시작일을 원하는 날로 조정하고 싶은 사용자 |
| RISK | DatePicker 패키지 미사용 → 커스텀 주간 네비게이터로 대체 (신규 패키지 없음) |
| SUCCESS | 주간 네비게이터에서 날짜 선택 → weekStart 갱신 → 결과 화면 날짜 정확 표시 |
| SCOPE | `ai-plan-result-screen.tsx`, `ai-plan-store.ts`, `ai-planner.ts` 3개 파일 수정 |

---

## Gap Analysis Results

- **Match Rate**: 93%
- **Analysis Date**: 2026-03-27
- **Iterations**: 0

## Module Scores

| Module | Score | Notes |
|--------|:-----:|-------|
| M1: getMondayOf 헬퍼 | 100% | export 추가, getThisMonday 내부 리팩토링 완료 |
| M2: updateWeekStart 스토어 액션 | 100% | interface + 구현 완전 일치 |
| M3: StartDateSheet 컴포넌트 | 85% | 기능 완전 동작, 인라인 스타일 vs StyleSheet.create 차이 |
| M4: 헤더 weekLabel 버튼 교체 | 100% | TouchableOpacity, handleStartDateConfirm, Supabase 업데이트 |

**Overall: 93%**

## Gaps Found

### Important (Non-critical)
- `StartDateSheet` 내 인라인 스타일 사용 — 설계는 `StyleSheet.create` 명명 스타일 지정. 기능 영향 없음.

### Minor
- `selectedDow` → `selectedIdx` 명칭 변경 (위치 기반 인덱스, 설계보다 향상)
- `DAY_KEYS` Sun-first → `DAY_KEYS_ORDER` Mon-first (설계 일관성 오류 수정)
- 주 이동 시 선택 자동 초기화, 비활성 화살표 피드백 (설계 이상의 UX 추가)
- 화살표 문자 `< >` → `‹ ›` (시각적 차이만)

### Missing Features
없음 — 모든 M1-M4 완전 구현

## Success Criteria Verification

- [x] M1: `getMondayOf(date)` 임의 날짜 → 해당 주 월요일 반환 정확
- [x] M2: `updateWeekStart` 호출 시 `currentPlan.weekStart` 갱신, persist 유지
- [x] M3: 주간 네비게이터 < / > 클릭 시 주간 이동, 요일 버튼 운동/휴식 시각 구분
- [x] M3: 휴식일 탭 시 충돌 경고 + 다음 운동일 표시, "다음 운동일로 설정" 동작
- [x] M4: `weekLabel` 탭 → 시트 오픈, 확정 후 헤더 날짜 범위 즉시 갱신
