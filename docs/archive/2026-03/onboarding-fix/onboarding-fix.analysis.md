# Analysis: onboarding-fix

> Feature: AI 플랜 품질 개선 (UUID + 칼로리 이력)
> Analyzed: 2026-03-25
> Match Rate: 100%

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | P0 완료 후 남은 P1 품질 이슈 처리 |
| **WHO** | AI 플랜 기능 사용 모든 로그인 유저 |
| **RISK** | 칼로리 집계 실패 시 0 반환 (기존 동작 유지) |
| **SUCCESS** | 식단 기록 있는 유저 → AI 플랜에 실제 평균 칼로리 반영 |
| **SCOPE** | `src/lib/ai-planner.ts` 1개 파일, 2개 함수만 수정 |

---

## 1. 분석 대상

| 항목 | 내용 |
|------|------|
| Plan 문서 | `docs/01-plan/features/onboarding-fix.plan.md` |
| 구현 파일 | `src/lib/ai-planner.ts` |
| Design 문서 | 없음 (단일 파일 수정으로 Plan→Do 직행) |

---

## 2. 성공 기준 검증

| ID | 기준 | 구현 위치 | 결과 |
|----|------|-----------|------|
| SC-1 | Plan ID 형식: `xxxxxxxx-xxxx-4xxx-...` | Line 329: `id: crypto.randomUUID()` | ✅ PASS |
| SC-2 | avgDailyCalories: 식단 기록 있는 유저 → 실제 평균값 | Lines 107-123: `dailyMap` 집계 | ✅ PASS |
| SC-3 | 신규 유저: avgDailyCalories = 0, 플랜 정상 생성 | Line 108: `let avgDailyCalories = 0` 초기화 | ✅ PASS |
| SC-4 | 오류 시: 칼로리 집계 실패해도 플랜 생성 계속 | Line 131-133: `catch → return null` → plan 계속 | ✅ PASS |

---

## 3. 기능 요구사항 검증

### FR-1 — Plan ID UUID

| 항목 | 내용 |
|------|------|
| 요구사항 | `crypto.randomUUID()` 사용, 외부 패키지 불필요 |
| 구현 | `id: crypto.randomUUID()` (Line 329) |
| 결과 | ✅ PASS |
| 비고 | Web Crypto API 네이티브 사용. Math.random() 기반 ID 완전 제거 |

### FR-2 — avgDailyCalories Supabase 집계

| 항목 | 내용 |
|------|------|
| 요구사항 | meal_logs + meal_items 최근 7일 집계 → 일평균 반환 |
| 구현 | mealRes 독립 try/catch + dailyMap으로 날짜별 합계 → 평균 계산 |
| 결과 | ✅ PASS |
| 비고 | mealRes 격리로 meal 오류 시 workout/weight 데이터 보존 |

### FR-3 — 신규 유저 폴백

| 항목 | 내용 |
|------|------|
| 요구사항 | meal_items 데이터 없는 유저 → avgDailyCalories = 0 유지 |
| 구현 | `let avgDailyCalories = 0` → `if (mealRes.data?.length > 0)` 조건부 업데이트 |
| 결과 | ✅ PASS |

---

## 4. 비기능 요구사항 검증

| 항목 | 요구사항 | 구현 | 결과 |
|------|----------|------|------|
| 패키지 | `crypto.randomUUID()`: 별도 패키지 불필요 | 네이티브 Web Crypto API | ✅ |
| 오류 처리 | 칼로리 쿼리 실패 시 0 반환 (플랜 생성 중단 없음) | 독립 catch → 0 유지 → 플랜 계속 | ✅ |
| 플로우 변경 없음 | 기존 AI 플랜 생성 플로우 그대로 | `fetchUserHistorySummary`, `generateAIPlan` 시그니처 불변 | ✅ |

---

## 5. Gap 목록

### 없음 (모두 수정 완료)

| ID | 항목 | 조치 | 결과 |
|----|------|------|------|
| G-1 | mealRes 오류 시 workout/weight 데이터 손실 | `mealRes`를 독립 `try/catch`로 분리 | ✅ FIXED |

**G-1 수정 내용:**
`meal_logs` 쿼리를 `Promise.all`에서 분리해 독립 `try/catch`로 감쌌음. 이제 meal 쿼리 오류 발생 시 `avgDailyCalories = 0` 유지, workout/weight 데이터는 정상 반환됨.

---

## 6. Match Rate

| 구분 | 항목 수 | Pass | Fail |
|------|---------|------|------|
| 성공 기준 | 4 | 4 | 0 |
| 기능 요구사항 | 3 | 3 | 0 |
| 비기능 요구사항 | 3 | 3 | 0 |
| Gap 수정 | 1 | 1 | 0 |
| **총계** | **11** | **11** | **0** |

**Match Rate: 100%**

---

## 7. 결론

모든 기능/비기능 요구사항 충족 + G-1 추가 수정 완료. Match Rate 100%.
