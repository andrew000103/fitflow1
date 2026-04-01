# AI 플랜 UX 개선 및 신뢰도 향상 Design

## 1. Options Considered (고려된 옵션)

### 옵션 1: 신규 컴포넌트 및 로직 구현
- **주 운동 일수 세분화:** 완전히 새로운 UI 컴포넌트(예: 슬라이더)를 만들고, `ai-plan-store`에 새로운 상태(state)를 추가하여 관리하는 방안.
- **플랜 생성 이유 UI:** 새로운 접이식(collapsible) 컴포넌트를 만들고, AI 플랜 결과물에 `explanation` 필드가 없다면 백엔드 API를 수정하여 해당 정보를 추가하는 방안.

### 옵션 2: 기존 기능 최대한 활용 (Leverage Existing Features)
- **주 운동 일수 세분화:** 코드베이스를 분석하여 `OnboardingData` 타입에 이미 `workoutDaysPerWeek` 필드가 존재하는 것을 확인. 이 필드를 그대로 활용하고, 온보딩 질문의 선택지만 수정하는 방안.
- **플랜 생성 이유 UI:** `ai-plan-result-screen.tsx`에 이미 `ExplanationCard` 컴포넌트와 `AIPlan` 타입에 `explanation` 객체가 구현되어 있는 것을 확인. 이 컴포넌트의 기본 상태만 수정하여 요구사항을 충족시키는 방안.

## 2. Chosen Approach (선택된 접근 방식)

**옵션 2**를 선택합니다.

대부분의 요구사항이 이미 기존 코드베이스에 준비되어 있어, 최소한의 변경으로 최대의 효과를 얻을 수 있습니다. 이는 개발 비용을 절감하고, 기존 아키텍처와의 일관성을 유지하며, 사이드 이펙트 발생 가능성을 최소화하는 가장 효율적인 방법입니다.

### 세부 구현 계획

1.  **주 운동 일수 세분화 (Workout Frequency Granularity):**
    -   `src/screens/ai/ai-onboarding-screen.tsx` 파일의 `QUESTIONS` 배열에서 `workoutDaysPerWeek` 키를 가진 질문 객체를 찾습니다.
    -   해당 질문의 `options` 배열을 다음과 같이 수정하여 사용자가 주 2, 3, 4, 5, 6일을 명확하게 선택할 수 있도록 합니다.

    ```javascript
    // 변경 전
    options: [
      { label: '1~2일', value: '2' },
      { label: '3일', value: '3' },
      { label: '4일', value: '4' },
      { label: '5일 이상', value: '5' },
    ],

    // 변경 후
    options: [
      { label: '주 2일', value: '2' },
      { label: '주 3일', value: '3' },
      { label: '주 4일', value: '4' },
      { label: '주 5일', value: '5' },
      { label: '주 6일', value: '6' },
    ],
    ```

2.  **플랜 생성 이유 UI 개선 (Collapsible Plan Rationale):**
    -   `src/screens/ai/ai-plan-result-screen.tsx` 파일 내의 `ExplanationCard` 함수형 컴포넌트를 찾습니다.
    -   컴포넌트 내부의 `useState` 훅을 수정하여, 내용이 기본적으로 접혀 있도록 초기 상태를 `true`에서 `false`로 변경합니다.

    ```javascript
    // 변경 전
    function ExplanationCard({ plan, colors }: { plan: AIPlan; colors: any }) {
      const [open, setOpen] = useState(true);
      // ...
    }

    // 변경 후
    function ExplanationCard({ plan, colors }: { plan: AIPlan; colors: any }) {
      const [open, setOpen] = useState(false); // 초기 상태를 false로 변경
      // ...
    }
    ```

3.  **AI 플랜 신뢰도 향상 방안 (Trust Enhancement Features):**
    -   **즉시 적용 가능 (Implemented):**
        -   **AI 추천 근거 제공:** `ExplanationCard`가 `plan.explanation.detail` 필드를 사용하므로, AI 모델이 생성하는 이 부분의 내용을 풍부하게 만드는 것만으로 신뢰도를 높일 수 있습니다. (백엔드/프롬프트 엔지니어링 영역)
        -   **참고 자료 명시:** `plan.explanation.sources` 배열이 이미 존재하므로, "NSCA-CPT", "ACSM Guideline" 등 공신력 있는 자료를 명시하여 전문성을 어필할 수 있습니다.
    -   **향후 고려 사항 (Future Considerations):**
        -   **예상 효과 시각화:** "12주 후 예상 1RM 증량: +10kg" 와 같은 구체적인 수치를 `AIPlan` 결과물에 포함하고 시각적으로 표시하는 기능.
        -   **신뢰도 점수:** 사용자의 프로필과 목표에 플랜이 얼마나 부합하는지를 백분율(%)로 보여주는 "Match Score" 도입.
        -   **사용자 피드백 루프:** "이 운동이 너무 어려워요"와 같은 피드백을 받아 다음 플랜 생성에 반영하는 기능.

## 3. Target Files (대상 파일)

- **`src/screens/ai/ai-onboarding-screen.tsx`**: 주 운동 일수 선택 옵션을 수정하기 위해 변경이 필요합니다.
- **`src/screens/ai/ai-plan-result-screen.tsx`**: 플랜 생성 이유 UI의 기본 상태를 수정하기 위해 변경이 필요합니다.

## 4. Validation Plan (검증 계획)

1.  **AI 온보딩 플로우 수동 테스트:**
    -   앱을 실행하여 AI 플랜 생성 온보딩을 시작합니다.
    -   '주당 운동할 수 있는 날' 질문 화면에서 '주 2일'부터 '주 6일'까지의 새로운 옵션이 표시되는지 확인합니다.
    -   '주 3일'을 선택하고 나머지 질문에 답하여 플랜 생성을 완료합니다.
2.  **결과 화면 검증:**
    -   플랜 결과 화면으로 이동했을 때, '이 플랜이 당신에게 맞는 이유' 섹션이 기본적으로 닫혀 있는지 (내용이 보이지 않는지) 확인합니다.
    -   해당 섹션을 탭했을 때 상세 설명이 부드럽게 펼쳐지는지 확인합니다.
    -   다시 탭하면 다시 접히는지 확인합니다.
3.  **플랜 내용 검증:**
    -   '운동 계획' 탭의 내용이 주 3회 운동, 4회 휴식으로 구성되어 있는지 확인하여, 온보딩에서 선택한 값이 AI 플래너에게 올바르게 전달되었는지 검증합니다.

## 5. Out of Scope (범위 외)

-   본 설계는 프론트엔드 UI 및 상태 변경에 중점을 둡니다. AI 모델이 플랜의 `explanation` 텍스트를 생성하는 로직(프롬프트 엔지니어링)은 이 작업의 범위를 벗어납니다.
-   '신뢰도 향상 방안'의 '향후 고려 사항'으로 제안된 기능들의 실제 구현은 포함되지 않습니다.
