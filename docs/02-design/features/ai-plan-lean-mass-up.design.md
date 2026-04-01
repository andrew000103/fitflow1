# [DESIGN] AI 플랜 린매스업 목표 추가

- **Feature:** `ai-plan-lean-mass-up`
- **Author:** Gemini
- **Date:** 2026-03-31
- **Status:** DRAFT

---

## 1. 개요 (Overview)

본 문서는 'AI 플랜 린매스업 목표 추가' 기능의 기술 설계를 정의합니다. 사용자가 AI 플랜 온보딩 과정에서 '린매스업'을 새로운 목표로 선택할 수 있도록 관련 타입, UI, 상태 관리, 칼로리 계산 및 AI 플랜 생성 로직을 수정합니다.

## 2. 아키텍처 및 데이터 흐름 (Architecture & Data Flow)

1.  **사용자 선택 (UI):** 사용자가 `ai-onboarding-screen.tsx`에서 '린매스업'(`lean_mass_up`)을 선택합니다.
2.  **상태 저장 (State):** 선택된 목표는 `ai-plan-store`를 통해 상태로 관리됩니다.
3.  **페르소나/목표 분류 (Logic):** `persona-engine.ts`에서 `'lean_mass_up'`을 '증량'(`gain`) 카테고리로 분류하여 일관된 로직을 따르도록 합니다.
4.  **칼로리 계산 (Logic):** `diet-screen.tsx` 등 칼로리 계산이 필요한 부분에서 '린매스업'에 맞는 잉여 칼로리(+200kcal)를 적용합니다.
5.  **AI 플랜 생성 (Backend):** `generate-ai-plan` Supabase 함수에 `'lean_mass_up'` 목표가 전달되고, 근비대 중심의 운동 계획을 생성하는 프롬프트가 구성됩니다.

## 3. 데이터 모델 변경 (Data Model Changes)

### `stores/ai-plan-store.ts`

- `AIGoal` 타입에 `'lean_mass_up'`을 추가합니다.
- `AIGoalNames` 객체에 한글 번역을 추가합니다.

```typescript
// src/stores/ai-plan-store.ts

// 1. AIGoal 타입에 'lean_mass_up' 추가
export type AIGoal = 'weight_loss' | 'muscle_gain' | 'strength_gain' | 'maintenance' | 'health' | 'lean_mass_up';

export const AIGoalNames: Record<AIGoal, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가 (벌크업)',
  strength_gain: '근력 강화',
  maintenance: '체중 유지',
  health: '건강한 습관 형성',
  lean_mass_up: '린매스업', // 2. 한글명 추가
};
```

## 4. 프론트엔드 변경 (Frontend Changes)

### `screens/ai/ai-onboarding-screen.tsx`

- 목표 선택 질문에 '린매스업' 옵션을 추가합니다.

```typescript
// screens/ai/ai-onboarding-screen.tsx

// ...
  {
    key: 'goal',
    // ...
    options: [
      // ... 기존 옵션
      { label: '근육 증가 (벌크업)', value: 'muscle_gain' },
      { label: '근력 강화 (파워리프팅/힘 증가)', value: 'strength_gain' },
      { label: '린매스업', value: 'lean_mass_up' }, // 새로운 옵션 추가
      // ...
    ],
  },
// ...
```

### `lib/persona-engine.ts`

- `resolvePersonaGoal` (또는 유사 함수)에서 `'lean_mass_up'`을 `'gain'`으로 매핑하는 로직을 추가합니다.

```typescript
// lib/persona-engine.ts

// ...
// muscle_gain, strength_gain을 'gain'으로 매핑하는 로직을 찾아 'lean_mass_up' 추가
// 예시:
if (goal === 'muscle_gain' || goal === 'strength_gain' || goal === 'lean_mass_up') {
  return 'gain';
}
// ...
```

### `screens/diet/diet-screen.tsx` (또는 관련 칼로리 계산 로직)

- '린매스업' 목표에 맞는 잉여 칼로리를 설정합니다.

```typescript
// screens/diet/diet-screen.tsx

// ...
// 목표에 따라 칼로리를 계산하는 로직
if (goalType === 'muscle_gain') return Math.round(tdee + 300);
if (goalType === 'lean_mass_up') return Math.round(tdee + 200); // +200 잉여 칼로리 적용
// ...
```

## 5. 백엔드 변경 (Backend Changes)

### `supabase/functions/generate-ai-plan/index.ts`

- '린매스업' 목표를 받았을 때, '근육 증가'(`muscle_gain`)와 유사하지만, 더 명확하게 근비대와 린(Lean)한 상태 유지를 강조하는 프롬프트를 구성합니다.
- **1차 구현:** 초기에는 `muscle_gain`과 동일한 프롬프트 엔지니어링 로직을 공유하여 구현 복잡도를 낮추고, 추후 피드백을 통해 고도화합니다.

```typescript
// supabase/functions/generate-ai-plan/index.ts

// ...
let prompt_focus = "";
if (goal === 'muscle_gain' || goal === 'lean_mass_up') {
  prompt_focus = "근비대를 위한 운동 프로그램을 생성합니다. 각 운동은 8-12회 반복 가능한 무게로 설정하고, 세트 간 휴식은 60-90초로 합니다. 전체적인 볼륨을 점진적으로 늘려나가는 방식에 집중합니다.";
  if (goal === 'lean_mass_up') {
    prompt_focus += " 동시에, 불필요한 체지방 증가는 최소화하기 위해 주 1-2회 가벼운 컨디셔닝 운동을 포함할 수 있습니다.";
  }
}
// ...
```

## 6. 테스트 계획 (Test Plan)

- **Unit Test:**
  - `persona-engine.ts`: `'lean_mass_up'`이 `'gain'`으로 올바르게 매핑되는지 테스트합니다.
  - 칼로리 계산 로직: TDEE와 `'lean_mass_up'` 목표가 주어졌을 때 `TDEE + 200`이 반환되는지 테스트합니다.
- **E2E Test:**
  - **시나리오:** AI 플랜 온보딩
  - **절차:**
    1. 앱 시작 후 AI 플랜 생성 시작
    2. 목표 선택 단계에서 '린매스업' 선택
    3. 나머지 온보딩 질문에 답변 후 계획 생성
  - **검증:**
    1. 생성된 식단 계획의 목표 칼로리가 `TDEE + 200`에 맞게 설정되었는지 확인
    2. 생성된 운동 계획이 근비대 원칙에 따라 구성되었는지 확인
    3. 모든 과정에서 오류가 없는지 확인

## 7. 해결 과제 및 결정 (Open Questions & Decisions)

- **'린매스업'의 정확한 칼로리 잉여량:** `+200kcal`로 설정하는 것을 제안합니다. 이는 일반적인 벌크업(+300~500kcal)보다 보수적인 접근으로, '린'한 상태를 유지하며 근성장을 도모하는 목표에 부합합니다.
- **운동 프로그램의 차별화:** 초기에는 '근육 증가'와 동일한 로직을 사용하되, 프롬프트에 "불필요한 체지방 증가 최소화" 문구를 추가하여 미세한 차이를 만듭니다. 향후 사용자 피드백에 따라 별도의 로직으로 분리할 수 있습니다.
