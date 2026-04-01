# [DESIGN] AI 플랜 운동 직접 선택 기능

- **Feature:** `ai-plan-custom-exercise-swap`
- **Author:** Gemini
- **Date:** 2026-04-01
- **Status:** DRAFT

---

## 1. 개요 (Overview)

본 문서는 'AI 플랜 운동 직접 선택 기능'의 기술 설계를 정의합니다. 사용자가 AI 운동 계획의 특정 종목을 교체할 때, 추천 목록 외에 직접 원하는 운동을 검색하여 선택할 수 있도록 시스템을 확장합니다. 이를 위해 운동 교체 UI(`SwapExerciseSheet.tsx`)를 수정하고, 운동 검색/선택을 위한 신규 화면을 추가하며, 관련 상태(`ai-plan-store.ts`)를 업데이트하는 로직을 구현합니다.

## 2. 아키텍처 및 데이터 흐름 (Architecture & Data Flow)

1.  **사용자 시작 (UI):** 사용자가 운동 계획 화면에서 특정 운동의 '교체' 버튼을 누릅니다.
2.  **교체 시트 표시 (UI):** `SwapExerciseSheet.tsx`가 모달 형태로 나타나며, 기존처럼 추천 대체 운동 리스트를 보여줍니다.
3.  **직접 선택 (UI):** 시트 하단에 새로 추가된 '직접 운동 선택' 버튼을 누릅니다.
4.  **검색 화면 이동 (Navigation):** `ExerciseSearchScreen`으로 화면이 전환됩니다. 이 화면은 전체 운동 목록을 표시하고 상단에 검색창을 가집니다.
5.  **운동 검색 및 선택 (UI):** 사용자는 검색창에 키워드를 입력하여 운동을 필터링하고, 목록에서 원하는 운동을 선택합니다.
6.  **상태 업데이트 (State):** 운동을 선택하면, 네비게이션 스택을 통해 이전 화면으로 돌아가면서 선택한 운동의 정보(예: `exerciseId`)가 전달됩니다. `SwapExerciseSheet`는 이 정보를 받아 `ai-plan-store`의 `swapExercise` 액션을 호출합니다.
7.  **데이터 변경 (Store):** `swapExercise` 액션은 `schedule` 상태에서 해당 날짜(day)와 순서(index)에 맞는 운동 객체를 새로운 운동 객체로 교체(Immer 활용)합니다.
8.  **UI 반영 (UI):** 상태 변경에 따라 운동 계획 화면의 UI가 자동으로 갱신되어, 교체된 운동이 즉시 표시됩니다.

## 3. 데이터 모델 변경 (Data Model Changes)

- 신규 데이터 모델이나 기존 모델의 구조적 변경은 필요하지 않습니다. 모든 변경은 프론트엔드 컴포넌트의 상태와 `Zustand` 스토어 내에서 처리됩니다.

## 4. 프론트엔드 변경 (Frontend Changes)

### `src/components/ai/SwapExerciseSheet.tsx`

- 추천 운동 목록(`FlatList`)의 `ListFooterComponent` 또는 시트 하단에 `Button` 컴포넌트를 추가합니다.
    - **라벨:** "직접 운동 선택" 또는 "다른 운동 검색하기"
    - **동작:** 탭하면 `navigation.navigate('ExerciseSearchScreen', { dayIndex, exerciseIndex })`를 호출하여 검색 화면으로 이동하고, 교체 대상의 위치 정보를 전달합니다.

- 화면 전환 후 다시 돌아왔을 때 선택된 운동으로 교체하는 로직을 `useEffect`나 네비게이션 콜백을 통해 처리해야 합니다.

### `src/screens/ai/ExerciseSearchScreen.tsx` (신규 파일)

- **구성 요소:**
    - `Header`: 화면 제목 ("운동 검색")과 뒤로가기 버튼.
    - `TextInput`: 운동 이름을 검색할 수 있는 입력 필드.
    - `FlatList`: 필터링된 운동 목록을 표시.
- **데이터 소스:**
    - 전체 운동 목록은 `src/constants/exercises.ts`나, `src/lib/exercise-utils.ts`에 있는 유틸 함수를 통해 가져옵니다.
- **기능:**
    - 화면 마운트 시 전체 운동 목록을 로드합니다.
    - `TextInput`의 `onChangeText` 이벤트에 따라 목록을 실시간으로 필터링합니다.
    - 목록의 각 아이템(운동)을 탭하면, `navigation.navigate('PreviousScreen', { selectedExercise })` 방식으로 선택된 운동 정보를 전달하고 이전 화면으로 돌아갑니다. 또는 `navigation.goBack()` 후 부모가 리스닝하는 방식을 사용합니다.

### `src/stores/ai-plan-store.ts`

- `swapExercise` 액션을 새로 정의합니다.

```typescript
// src/stores/ai-plan-store.ts
import { produce } from 'immer';

// ... existing store setup

export interface AIPlanState {
  // ...
  actions: {
    // ...
    swapExercise: (dayIndex: number, exerciseIndex: number, newExercise: GeneratedExercise) => void;
  };
}

// ... in create(...)
    swapExercise: (dayIndex, exerciseIndex, newExercise) =>
      set(
        produce((draft: AIPlanState) => {
          if (draft.schedule && draft.schedule[dayIndex]?.sessions[exerciseIndex]) {
            // 참고: newExercise 객체 구조는 기존 Exercise 객체와 맞춰야 합니다.
            // GeneratedExercise 타입에 맞게 id, name, muscle, equipment 등을 설정해야 합니다.
            draft.schedule[dayIndex].sessions[exerciseIndex].exercise = newExercise;
          }
        })
      ),
// ...
```
*(참고: `newExercise`의 타입 `GeneratedExercise`는 예시이며, 실제 프로젝트의 타입에 맞게 조정해야 합니다.)*

### `src/navigation/main-navigator.tsx` (또는 관련 네비게이터)

- `ExerciseSearchScreen`을 스택 네비게이터에 추가합니다.

```typescript
// src/navigation/main-navigator.tsx

// ...
const Stack = createNativeStackNavigator();

function MainNavigator() {
  return (
    <Stack.Navigator>
      // ... other screens
      <Stack.Screen name="ExerciseSearch" component={ExerciseSearchScreen} />
    </Stack.Navigator>
  );
}
```

## 5. 백엔드 변경 (Backend Changes)

- 이 기능은 전적으로 프론트엔드에서 처리되므로 백엔드 변경은 필요 없습니다.

## 6. 테스트 계획 (Test Plan)

- **Component Test:**
    - `ExerciseSearchScreen.tsx`:
        - 목(mock) 운동 데이터가 주어졌을 때 목록이 올바르게 렌더링되는지 확인합니다.
        - 검색어 입력 시 필터링 기능이 정확하게 동작하는지 테스트합니다.
        - 특정 운동을 선택했을 때, 네비게이션 함수가 올바른 파라미터와 함께 호출되는지 확인합니다.
- **E2E Test:**
    - **시나리오:** 사용자가 AI 플랜의 '벤치프레스'를 '덤벨 프레스'로 직접 검색하여 교체합니다.
    - **절차:**
        1.  AI 운동 계획 화면으로 이동합니다.
        2.  '벤치프레스' 항목의 '교체' 버튼을 누릅니다.
        3.  `SwapExerciseSheet`에서 '직접 운동 선택' 버튼을 누릅니다.
        4.  `ExerciseSearchScreen`으로 이동되었는지 확인합니다.
        5.  검색창에 "덤벨 프레스"를 입력합니다.
        6.  목록에 나타난 '덤벨 프레스'를 선택합니다.
    - **검증:**
        1.  다시 운동 계획 화면으로 돌아왔는지 확인합니다.
        2.  '벤치프레스'가 있던 자리에 '덤벨 프레스'가 표시되는지 확인합니다.
        3.  `ai-plan-store`의 상태가 올바르게 변경되었는지 (devtools 등으로) 확인합니다.

## 7. 해결 과제 및 결정 (Open Questions & Decisions)

- **운동 데이터 동기화:** `src/constants/exercises.ts`에 정의된 운동 목록과 데이터베이스의 운동 목록이 일치하는지 확인해야 합니다. 만약 동적으로 가져오는 구조라면, 검색 화면에서 API를 호출해야 합니다. 현재 구조상 `constants`를 사용하는 것이 간단해 보입니다.
- **네비게이션 콜백 처리:** 검색 화면에서 운동을 선택하고 돌아왔을 때, 부모 스크린(`SwapExerciseSheet` 또는 그 상위)이 선택된 운동 데이터를 안정적으로 수신하는 메커니즘을 정해야 합니다. React Navigation의 `params`를 이용한 이벤트 리스너 방식(`navigation.addListener`) 또는 화면에 `useEffect` 훅을 사용하는 것이 일반적인 해결책입니다.
