# Plan: workout-aware-diet

**Feature**: 운동 연동 식단 목표 자동 조정  
**Status**: Plan  
**Created**: 2026-04-02  
**Author**: Donghyun An

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| Problem | 기존 식단 앱(포함 현재 FIT)은 운동 여부와 무관한 고정 목표를 보여줘, 사용자가 맥락 없는 숫자만 쫓게 됨 |
| Solution | 오늘 완료된 운동 세션 데이터를 기반으로 칼로리/매크로 목표를 자동 조정하고, 식단 탭에 운동 컨텍스트 카드를 표시 |
| UX Effect | "오늘 더 먹어도 돼요"가 데이터 기반으로 제시되어 사용자가 안심하고 맥락 있는 식단 결정을 내릴 수 있음 |
| Core Value | FIT만이 가능한 운동-식단 통합 — 운동 데이터 없는 순수 식단 앱은 절대 제공할 수 없는 차별화 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 사용자 핵심 불편: "숫자만 쫓게 된다" — 운동을 했는데도 식단 앱은 그걸 모름. FIT은 운동 세션을 알기 때문에 맥락 있는 목표를 줄 수 있음 |
| WHO | 운동 + 식단을 같이 관리하는 FIT 핵심 타겟. nSuns 사용자, 자유 운동 기록자 모두 포함 |
| RISK | 칼로리 추정 로직이 부정확하면 신뢰성 저하. AI 플랜 목표와 충돌 시 우선순위 혼선 위험 |
| SUCCESS | 오늘 운동 완료 시 식단 탭 상단에 컨텍스트 카드 표시 + 목표값이 운동 볼륨/부위 기반으로 조정됨 |
| SCOPE | 식단 탭 + 새 계산 유틸리티. 외부 API 변경 없음. Push notification 제외. |

---

## 1. 배경 및 문제 정의

### 1.1 현재 상태

현재 식단 탭은 다음 우선순위로 목표값을 표시한다:
1. 승인된 AI 플랜 목표
2. `user_goals` (수동 설정)
3. BMR 기반 기본값

이 구조 자체는 나쁘지 않지만, **운동 데이터가 전혀 반영되지 않는다**. 오늘 nSuns 하체 운동을 했든, 쉬었든, 식단 탭은 동일한 목표를 보여준다.

### 1.2 사용자 경험 문제

기존 식단 앱의 핵심 불편: **"숫자만 쫓게 된다"**

- 칼로리 목표를 맞추는 것에 집중하다 보면, "왜 이 숫자인지"를 잊게 됨
- 운동을 열심히 한 날에도 식단 앱은 "목표 초과"라고 경고
- 반대로, 쉰 날에도 같은 목표가 뜨므로 목표가 의미 없어 보임

### 1.3 FIT의 차별화 기회

FIT은 운동 세션, 세트, 반복, 중량을 모두 기록한다. 이를 활용하면:
- "오늘 하체 운동 했으니 탄수화물 +80g은 괜찮다"는 맥락을 줄 수 있음
- 단순한 목표 추적이 아닌, **상황 기반 식단 가이드**로 포지셔닝 가능
- 이 기능은 운동을 전혀 모르는 순수 식단 앱이 절대 제공할 수 없음

---

## 2. 목표 및 성공 기준

### 2.1 목표
1. 오늘 완료된 운동 세션을 기반으로 식단 목표를 자동 조정
2. 식단 탭에서 조정 근거를 사용자가 이해할 수 있는 언어로 표시
3. 기존 AI 플랜 목표 및 수동 목표와 충돌 없이 공존

### 2.2 성공 기준
- [ ] 오늘 운동 완료 시, 식단 탭 칼로리/매크로 목표가 변경됨
- [ ] 변경 이유를 담은 컨텍스트 카드가 상단에 표시됨
- [ ] 운동 없는 날은 기존 목표 그대로 (회귀 없음)
- [ ] AI 플랜 목표가 있어도 컨텍스트 카드는 표시됨 (단, 수치 조정은 AI 플랜 위에 additiveBonus로 적용)
- [ ] `npx tsc --noEmit` 통과

---

## 3. 기능 요구사항

### FR-1: 운동 세션 기반 목표 조정 계산기

**신규 파일**: `src/lib/workout-diet-sync.ts`

#### FR-1.1 오늘의 운동 세션 조회
- `workout_sessions` 테이블에서 오늘 날짜 + `user_id` 기준으로 완료된 세션 조회
- `ended_at IS NOT NULL` 조건 (완료된 세션만)

#### FR-1.2 운동 볼륨 계산
- 총 볼륨 = 오늘 완료된 모든 세트의 `weight_kg × reps` 합산
- 단, 맨몸 운동(weight_kg = 0)은 `reps × 체중_추정값`으로 처리

#### FR-1.3 운동 부위 분류
- `exercises` 테이블의 `muscle_group` 또는 종목명 기반으로 분류
- 분류 결과: `lower_body` / `upper_body` / `full_body` / `cardio` / `unknown`
- 분류가 불분명하면 `unknown` → 보수적 조정값 적용

#### FR-1.4 추가 칼로리/매크로 계산 로직

```
// 운동 강도 레벨 (볼륨 기반)
light: 총 볼륨 < 3,000kg  → +150 kcal, 탄수화물 +20g, 단백질 +5g
moderate: 3,000~8,000kg  → +250 kcal, 탄수화물 +40g, 단백질 +10g
intense: > 8,000kg       → +400 kcal, 탄수화물 +60g, 단백질 +20g

// 부위 보정 (탄수화물 추가)
lower_body: 탄수화물 +20g 추가
full_body:  탄수화물 +15g 추가
upper_body: 단백질 +5g 추가

// 최종 = base + intensity + body_part_bonus
```

> 참고: 정확한 열량 계산보다 "방향성 제시"가 목적. 너무 정밀하게 만들려다 신뢰성 문제를 만들지 말 것.

#### FR-1.5 출력 타입

```typescript
interface WorkoutDietAdjustment {
  hasWorkout: boolean;
  workoutLabel: string;       // "하체 운동", "상체 운동", "전신 운동"
  intensityLevel: 'light' | 'moderate' | 'intense';
  additionalCalories: number;
  additionalProtein: number;
  additionalCarbs: number;
  additionalFat: number;
}
```

---

### FR-2: 식단 탭 운동 컨텍스트 카드

**신규 파일**: `src/components/diet/WorkoutContextCard.tsx`

#### FR-2.1 카드 표시 조건
- 오늘 완료된 운동이 있을 때만 표시
- 오늘 운동 없으면 카드 없음 (기존 UI 그대로)

#### FR-2.2 카드 내용
```
[아이콘] 하체 운동 완료 · 탄수화물 목표 +60g 조정됨
         단백질 +10g · 칼로리 +250 kcal 추가 적용 중
         [카드 닫기 ×]
```

- 운동 라벨 + 강도 레벨 텍스트
- 조정된 수치 요약 (칼로리, 주요 매크로)
- 닫기 버튼 → 오늘 하루 dismissal (AsyncStorage 저장, 자정 초기화)

#### FR-2.3 AI 플랜 목표 있을 때 문구 변경
```
[아이콘] 하체 운동 완료 · AI 플랜 목표 기준 +250 kcal 추가
         AI 플랜 목표에 운동 조정분이 더해졌어요
```

---

### FR-3: 식단 탭 목표값 적용 순서 수정

**수정 파일**: `src/screens/diet/diet-screen.tsx`

현재 우선순위:
```
AI 플랜 목표 > user_goals > 기본값
```

변경 후 우선순위:
```
(AI 플랜 목표 OR user_goals OR 기본값) + 운동 보정값
```

- 운동 보정값은 기존 목표에 더해지는 방식 (override가 아닌 additive)
- AI 플랜 목표를 "덮어쓰지" 않으면서 운동 맥락을 반영

---

## 4. 비기능 요구사항

### 4.1 성능
- 식단 탭 진입 시 운동 세션 조회 1회 (오늘 날짜 캐시 가능)
- 조회 실패 시 graceful fallback: 운동 조정 없이 기존 목표 표시

### 4.2 호환성
- 운동 기록이 없는 신규 사용자: 기존 동작 100% 유지
- AI 플랜 없는 사용자: `user_goals` 기반 목표에 조정값 합산

### 4.3 정확성 면책
- 칼로리 추정은 운동 데이터 기반 근사값임을 카드 하단에 명시
- `"운동 볼륨 기반 추정값입니다"` 작은 텍스트

---

## 5. 범위 외 (Out of Scope)

이 Feature에서 구현하지 않음:

| 항목 | 이유 |
|------|------|
| 운동 직후 Push Notification | 복잡도 증가, 별도 Feature로 |
| 바코드 스캔 | 별도 Feature (카메라 권한 등 의존성) |
| 자연어 식단 입력 | AI API 추가 비용, 별도 Feature |
| 음식 사진 인식 | 별도 Feature |
| 운동 부위별 음식 추천 목록 | 이번 범위는 목표 조정까지. 추천은 다음 단계 |
| 주간 인사이트 카드 | 별도 Feature로 분리 |

---

## 6. 구현 우선순위

### Phase 1 (핵심)
1. `src/lib/workout-diet-sync.ts` 구현
2. 식단 탭 목표값 조정 로직 연결
3. `WorkoutContextCard` 기본 UI

### Phase 2 (완성도)
4. 카드 dismissal (오늘 하루 숨김)
5. AI 플랜 목표와 공존 문구 처리
6. 강도 레벨별 라벨 텍스트 다듬기

---

## 7. 관련 파일

### 신규 생성
- `src/lib/workout-diet-sync.ts`
- `src/components/diet/WorkoutContextCard.tsx`

### 수정 대상
- `src/screens/diet/diet-screen.tsx` — 운동 컨텍스트 카드 추가 + 목표값 계산 수정

### 참조 (읽기 전용)
- `src/stores/ai-plan-store.ts` — `currentPlan`, `appliedSections` 확인
- `src/lib/profile.ts` — `getUserProfile`, `getLatestUserGoal` 패턴 참조
- `src/types/food.ts` — `MealType`, `NutritionUnit` 타입

---

## 8. 위험 요소 및 대응

| 위험 | 가능성 | 대응 |
|------|--------|------|
| 운동 볼륨 계산이 부정확함 | 높음 | "근사값" 면책 텍스트 추가, 수치보다 방향성 강조 |
| AI 플랜 목표와 혼선 | 중간 | additive 방식으로 설계, 카드 문구에서 명확히 구분 |
| 맨몸 운동 볼륨 계산 엣지케이스 | 중간 | `weight_kg = 0` 시 reps × 60kg(추정) 또는 light로 처리 |
| 세션 조회 실패 | 낮음 | try-catch + graceful fallback (조정 없이 기존 목표) |
| 기존 사용자 행동 회귀 | 낮음 | 운동 없는 날은 완전히 기존 동작 유지 |

---

## 9. 참고 사항

- 이 기능은 `운동 탭 → 식단 탭`의 데이터 흐름을 처음 연결하는 첫 번째 시도
- 향후 확장 가능성: 타이밍 안내, 음식 추천, 주간 인사이트
- 기존 `CLAUDE.md`의 "네이티브 앱 불변 원칙" 적용: 웹 전용 변경 시 `Platform.OS === 'web'` 분기
