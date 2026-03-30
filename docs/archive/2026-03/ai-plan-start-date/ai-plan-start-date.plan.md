# Plan: ai-plan-start-date

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | AI 플랜 시작일 선택 — 사용자가 운동 프로그램 시작 날짜를 직접 지정 |
| 작성일 | 2026-03-27 |
| 대상 파일 | `ai-plan-result-screen.tsx`, `ai-plan-store.ts`, `ai-planner.ts` |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| Problem | weekStart가 항상 이번 주 월요일로 고정 → 첫날이 휴식일이면 즉시 운동 불가 |
| Solution | 결과 화면에서 시작일(달력) 선택 → weekStart 재계산 + 휴식일 경고·대안 제안 |
| Function UX Effect | 원하는 날부터 플랜을 시작할 수 있고, 휴식일 충돌 시 다음 운동일로 안내 |
| Core Value | 플랜이 사용자의 실제 일정에 맞게 적용되어 첫 실천 성공률 향상 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | `getThisMonday()`로 항상 이번 주 월요일이 weekStart로 고정되어, 사용자가 원하는 날부터 시작하거나 오늘이 휴식일인 경우 대처 불가 |
| WHO | AI 플랜을 생성한 직후 또는 재생성 후, 시작일을 원하는 날로 조정하고 싶은 사용자 |
| RISK | DateTimePicker 라이브러리 추가 시 Expo 호환성 이슈 가능 → 최소한의 네이티브 API 또는 Expo 전용 패키지 선택 |
| SUCCESS | 달력에서 날짜 선택 → weekStart 갱신 → 결과 화면 날짜 정확하게 표시 / 휴식일 선택 시 경고+대안 제안 |
| SCOPE | `ai-plan-result-screen.tsx` UI, `ai-plan-store.ts` updateWeekStart 액션, `ai-planner.ts` getMondayOf 헬퍼 |

---

## 1. 배경 및 문제 정의

### 1.1 현재 동작

`ai-planner.ts`의 `getThisMonday()`(line 460)가 호출 시점의 이번 주 월요일을 반환, `AIPlan.weekStart`로 고정됩니다.

`ai-plan-result-screen.tsx`의 `weekLabel` 계산은 `weekStart`를 기준으로 +6일(일요일)까지 날짜를 표시합니다.

사용자가 "오늘부터 시작"하려고 해도:
- 오늘이 목요일이고 AI가 목요일을 휴식일로 배정했다면 → 첫날부터 운동 불가
- 오늘이 이미 이번 주 후반부라 계획된 운동일이 다 지나갔을 수도 있음
- weekStart를 직접 조정하는 UI가 없음

### 1.2 목표

1. AIPlanResult 화면에 "시작일 변경" 버튼 추가
2. 달력(DatePicker)에서 날짜 선택
3. 선택한 날짜의 요일이 AI 플랜의 휴식일이면 → 경고 + 다음 운동일 제안
4. 확정 시 `weekStart` = 해당 날짜가 속한 주의 월요일로 업데이트

---

## 2. 요구사항

### FR-1: 시작일 변경 UI

- **위치**: AIPlanResult 헤더 하단(주간 날짜 배지 옆) 또는 별도 "시작일 변경" 텍스트 버튼
- **기본값**: 현재 `weekStart` 기준 표시 (기존 동작)
- **UX 흐름**:
  1. "시작일 변경" 탭
  2. DateTimePicker(날짜 선택) 표시 (`@react-native-community/datetimepicker` 또는 `expo` 내장)
  3. 날짜 선택 완료
  4. 선택일의 요일 판별 → 휴식일 체크 (FR-2)
  5. 문제 없으면 weekStart 업데이트

### FR-2: 휴식일 충돌 경고

- 선택한 날짜의 요일이 `weeklyWorkout` 기준 `isRestDay: true`인 경우:
  - Alert 또는 인라인 메시지: "선택한 날({날짜})은 휴식일입니다. 다음 운동일은 {N일 후 날짜}({운동 포커스})입니다."
  - 버튼 2개:
    - **그래도 이날로 설정**: `weekStart` 업데이트 (휴식일로 시작하는 것 허용)
    - **다음 운동일로 설정**: 가장 가까운 다음 운동일 날짜의 주 월요일로 `weekStart` 설정

### FR-3: weekStart 업데이트

- `ai-plan-store.ts`에 `updateWeekStart(newDate: string)` 액션 추가
- `currentPlan.weekStart`를 갱신 (Supabase 저장은 비동기·결과 무시)
- `ai-planner.ts`에 `getMondayOf(dateStr: string): string` 헬퍼 추가

---

## 3. 비기능 요구사항

- `@react-native-community/datetimepicker`가 이미 설치되어 있다면 재사용, 없으면 확인 후 결정
- iOS/Android 양쪽 동작 확인 (iOS: spinner, Android: calendar)
- Supabase `ai_plans.week_start` 컬럼 업데이트는 비동기·결과 무시 (낙관적 업데이트 패턴)

---

## 4. 범위 외 (Out of Scope)

- 플랜 생성 시 시작일을 AI 프롬프트에 반영 (스케줄 rotate)
- weekStart 변경 시 Supabase `week_start` 즉시 동기화 보장
- 2주 이상 미래 날짜 선택 제한 (현재 제한 없음)

---

## 5. 성공 기준

- [ ] AIPlanResult에 시작일 변경 버튼 표시
- [ ] 날짜 선택 후 weekLabel(날짜 범위) 정확히 업데이트
- [ ] 휴식일 선택 시 경고 + 다음 운동일 표시
- [ ] "다음 운동일로 설정" 선택 시 weekStart 올바르게 조정
- [ ] 결과 화면 새로고침(재진입) 후에도 변경된 weekStart 유지

---

## 6. 구현 순서

1. `getMondayOf` 헬퍼 (`ai-planner.ts`)
2. `updateWeekStart` 스토어 액션 (`ai-plan-store.ts`)
3. 날짜 선택 + 휴식일 감지 로직 + UI (`ai-plan-result-screen.tsx`)
