# Report: onboarding-fix

> Feature: AI 플랜 품질 개선 (UUID + 칼로리 이력)
> Completed: 2026-03-25
> Match Rate: 100%

---

## 1. Executive Summary

### 1.1 Overview

| 항목 | 내용 |
|------|------|
| Feature | onboarding-fix |
| 시작일 | 2026-03-25 |
| 완료일 | 2026-03-25 |
| 수정 파일 | 1개 (`src/lib/ai-planner.ts`) |
| Match Rate | 100% |
| Gap 수정 | 1건 (G-1, 수정 완료) |

### 1.2 Results Summary

| 항목 | 계획 | 실제 |
|------|------|------|
| 수정 함수 | 2개 | 2개 |
| 추가 수정 | - | 1건 (G-1 resilience) |
| 패키지 추가 | 없음 | 없음 |
| 기존 동작 변경 | 없음 | 없음 |

### 1.3 Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | AI 플랜 ID 충돌 위험(Math.random) + 칼로리 이력 미반영(하드코딩 0)으로 플랜 품질 저하 |
| **Solution** | `crypto.randomUUID()` 네이티브 교체 + Supabase `meal_logs` 7일 집계로 실제 데이터 반영 |
| **Function UX Effect** | 식단 기록이 있는 유저는 실제 평균 칼로리 기반 맞춤 플랜 수신, ID 충돌 0% |
| **Core Value** | 외부 패키지 없이 AI 플랜 데이터 품질 향상. mealRes 독립 분리로 부분 오류 시에도 운동/체중 데이터 보존 |

---

## 2. 구현 상세

### 2.1 FR-1 — Plan ID UUID 교체

**변경 전:**
```typescript
id: Math.random().toString(36).slice(2),
```

**변경 후:**
```typescript
id: crypto.randomUUID(),
```

- 위치: `src/lib/ai-planner.ts` `generateAIPlan()` 함수
- 패키지 없음 — Web Crypto API 네이티브 (Expo SDK 49+ / RN 0.71+)
- UUID v4 형식 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`) 보장

### 2.2 FR-2 — avgDailyCalories Supabase 집계

**변경 전:**
```typescript
// MVP: 하드코딩 기본값 사용
const avgDailyCalories = 0;
```

**변경 후 (독립 try/catch):**
```typescript
let avgDailyCalories = 0;
try {
  const mealRes = await supabase
    .from('meal_logs')
    .select('logged_at, meal_items(calories)')
    .eq('user_id', userId)
    .gte('logged_at', since);
  if (mealRes.data && mealRes.data.length > 0) {
    const dailyMap = new Map<string, number>();
    for (const log of mealRes.data) {
      const date = (log.logged_at as string).split('T')[0];
      const dayCalories = ((log.meal_items ?? []) as { calories: number }[]).reduce(
        (sum, item) => sum + (item.calories ?? 0), 0
      );
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + dayCalories);
    }
    if (dailyMap.size > 0) {
      const total = Array.from(dailyMap.values()).reduce((s, v) => s + v, 0);
      avgDailyCalories = Math.round(total / dailyMap.size);
    }
  }
} catch {
  // meal 쿼리 오류 시 0 유지
}
```

- 위치: `src/lib/ai-planner.ts` `fetchUserHistorySummary()` 함수
- `meal_logs` + `meal_items` JOIN, 최근 7일, 날짜별 합계 → 평균
- **추가 개선 (G-1)**: 기존 `Promise.all`에서 분리 → 독립 `try/catch`로 meal 쿼리 격리

### 2.3 G-1 — mealRes 독립 격리 (추가 수정)

**문제**: `mealRes`가 workout/weight와 같은 `Promise.all`에 있어, meal_logs 오류 시 운동/체중 데이터도 함께 소실

**수정**: meal 쿼리를 독립 `try/catch`로 분리

**효과**: meal_logs 테이블 오류 / RLS 차단 시에도
- workout 완료율 정상 반환 ✅
- 체중 트렌드 정상 반환 ✅
- avgDailyCalories = 0으로 graceful fallback ✅

---

## 3. 성공 기준 검증

| ID | 기준 | 결과 |
|----|------|------|
| SC-1 | Plan ID UUID 형식 | ✅ `crypto.randomUUID()` |
| SC-2 | avgDailyCalories 실제 평균값 반환 | ✅ dailyMap 집계 |
| SC-3 | 신규 유저 폴백 0, 플랜 정상 | ✅ `let avgDailyCalories = 0` |
| SC-4 | 오류 시 플랜 생성 중단 없음 | ✅ 독립 catch, outer null |

---

## 4. 학습 & 회고

### 잘 된 점
- **단일 파일 집중**: `ai-planner.ts` 1개만 수정. 사이드 이펙트 없음
- **패키지 제로**: `crypto.randomUUID()` 네이티브 사용으로 번들 크기 영향 없음
- **G-1 선제 개선**: Gap 분석 중 발견한 resilience 이슈를 즉시 수정

### 주의 사항
- **diet-sync 마이그레이션 선행 필요**: `meal_logs` + `meal_items` 테이블이 존재해야 함
  ```sql
  -- docs/archive/2026-03/diet-sync/ 참조
  ALTER TABLE meal_items ADD COLUMN IF NOT EXISTS food_json JSONB;
  ALTER TABLE meal_items ADD COLUMN IF NOT EXISTS entry_local_id TEXT;
  ```
- meal_logs의 `logged_at`이 ISO8601 형식이어야 날짜 split 정상 동작

---

## 5. 다음 단계

CLAUDE.md P1 항목 처리 완료. 남은 P1/P2 우선순위:

| 우선순위 | 항목 |
|---------|------|
| P1 | 식단 Supabase 동기화 — 앱 시작 시 `meal_items`에서 오늘 식단 복원 |
| P1 | 홈 목표값 연결 — 하드코딩 제거 → `user_goals` 테이블 |
| P2 | nSuns 디바이스 end-to-end 테스트 |
| P2 | 음식 스키마 통일 (`diet-search.ts` vs `custom-food-db.ts`) |
