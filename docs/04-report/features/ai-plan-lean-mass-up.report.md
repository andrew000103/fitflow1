# [REPORT] AI 플랜 린매스업 목표 추가

- **Feature:** `ai-plan-lean-mass-up`
- **Author:** Gemini
- **Date:** 2026-03-31
- **Status:** COMPLETED

---

## 1. Executive Summary

- **Feature:** AI 플랜 `린매스업` 목표 추가
- **Outcome:** **Successfully Implemented** (Frontend)
- **Summary:** '린매스업(Lean Mass Up)'을 AI 플랜의 신규 목표로 추가하는 기능이 성공적으로 구현되었습니다. 사용자는 이제 온보딩 과정에서 '린매스업'을 선택할 수 있으며, 해당 목표에 맞는 차별화된 칼로리(+200kcal)가 적용된 식단 가이드를 받게 됩니다. PDCA 사이클을 통해 초기 구현의 논리적 결함을 발견하고 수정하여 기능의 완성도를 확보했습니다.

| Aspect | Description |
| :--- | :--- |
| **Problem** | 기존 AI 플랜에는 근육 증가와 체지방 최소화를 동시에 추구하는 '린매스업' 목표가 부재했습니다. |
| **Solution** | UI, 데이터 타입, 칼로리 계산 로직을 포함한 시스템 전반에 '린매스업' 옵션을 추가하고, '벌크업'과 차별화된(+200kcal) 계획을 제공하도록 구현했습니다. |
| **Function UX Effect**| 사용자는 자신의 세분화된 목표에 정확히 부합하는 AI 플랜을 제공받아, 더 높은 만족도와 신뢰를 가지고 서비스를 이용할 수 있게 됩니다. |
| **Core Value** | **정밀한 개인화** 및 **사용자 신뢰도 향상**. |


## 2. Implementation Details

- **`src/stores/ai-plan-store.ts`**:
  - `AIGoal` 타입에 `lean_bulk`를 추가했습니다.
  - `AI_GOAL_LABEL`에 '린매스업' 한글명을 추가했습니다.

- **`src/screens/ai/ai-onboarding-screen.tsx`**:
  - 목표 선택 옵션에 '린매스업 (체지방 최소화 + 근육 증가)' UI를 추가했습니다.

- **`src/lib/persona-engine.ts`**:
  - `mapOnboardingGoalToPersonaGoal`에서 `lean_bulk`를 'gain' 카테고리로 매핑했습니다.
  - **(핵심 수정)** `deriveTargets`에서 `lean_bulk` 목표에 대해 잉여 칼로리를 `+200`으로 적용하도록 수정하여, `+300`인 다른 증량 목표와 차별화했습니다.

## 3. Process Summary (PDCA Cycle)

1.  **Plan:** '린매스업' 기능 추가를 위한 요구사항과 범위를 정의했습니다.
2.  **Design:** `persona-engine.ts` 등 수정이 필요한 파일을 특정하고, `+200kcal`라는 구체적인 구현 방식을 설계했습니다.
3.  **Do (via User):** 사용자가 외부 도구를 통해 초기 코드를 구현했습니다.
4.  **Check (Analyze):** 1차 분석에서 설계와 구현 간의 칼로리 설정 (`+300kcal` vs `+200kcal`) Gap을 발견했습니다.
5.  **Act (Iterate):** `iterate` 단계를 통해 `persona-engine.ts`의 칼로리 계산 로직을 수정하여 발견된 Gap을 해결했습니다.
6.  **Check (Analyze):** 2차 분석에서 수정된 코드가 설계와 100% 일치함을 검증했습니다.
7.  **Report:** 본 문서를 통해 최종 완료를 보고합니다.

## 4. Testing Verification

- 본 기능은 아래와 같은 테스트가 필요하며, QA 팀 또는 담당 개발자의 실행이 요구됩니다.
- **Unit Test:**
  - **Given:** `deriveTargets` 함수에 `onboarding.goal`이 `lean_bulk`로 전달
  - **When:** 함수 실행
  - **Then:** 반환된 `caloriesTarget`이 `TDEE + 200`과 일치하는지 검증
- **E2E Test:**
  - **Given:** 사용자가 앱 온보딩 플로우 시작
  - **When:** 목표로 '린매스업' 선택 후 플랜 생성 완료
  - **Then:** 식단 화면에 표시되는 목표 칼로리가 사용자의 TDEE + 200kcal 근사치인지 검증

## 5. Changelog

```
feat(ai-plan): '린매스업' 목표 추가

- AI 플랜 생성 시 새로운 목표인 '린매스업'을 선택할 수 있습니다.
- '린매스업'은 기존 '벌크업'보다 낮은 잉여 칼로리(+200kcal)를 적용하여, 체지방 증가를 최소화하며 근육량을 늘리려는 사용자에게 최적화된 플랜을 제공합니다.
```
