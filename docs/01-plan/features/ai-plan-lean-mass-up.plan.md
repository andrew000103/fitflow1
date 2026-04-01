# [PLAN] AI 플랜 린매스업 목표 추가

- **Feature:** `ai-plan-lean-mass-up`
- **Author:** Gemini
- **Date:** 2026-03-31
- **Status:** DRAFT

---

## 1. Executive Summary

본 문서는 AI 플랜 기능에 '린매스업(Lean Mass Up)' 목표를 추가하는 기능 개발 계획을 정의합니다. 현재 시스템은 체중 감량, 벌크업 등 5가지 기본 목표만 제공하여, 근육량 증가와 체지방 최소화를 동시에 원하는 사용자 요구를 충족시키지 못하고 있습니다. 본 기능 추가를 통해 사용자 목표에 더욱 정밀하게 부합하는 개인화된 운동 및 식단 계획을 제공함으로써 서비스 만족도와 사용자 유지율을 높이고자 합니다.

- **Problem:** AI 플랜의 목표 설정 옵션이 제한적이어서 '린매스업'과 같은 특정 요구를 가진 사용자를 지원하지 못함.
- **Solution:** '린매스업'을 새로운 목표 옵션으로 추가하고, 이에 맞는 맞춤형 계획 생성 로직을 개발.
- **Core Value:** 개인화 강화, 사용자 목표 달성 지원, 서비스 경쟁력 향상.

## 2. Problem Statement

- **What:** 현재 AI 플랜 기능은 사용자가 선택할 수 있는 목표가 체중 감량, 벌크업, 체중 유지, 건강 개선, 근력 증가로 한정되어 있습니다.
- **Where:** AI 플랜 목표 설정 단계.
- **When:** 사용자가 자신의 목표가 선택지에 없어 이탈하거나 만족도가 저하될 때.
- **Impact:** '린매스업'이라는 명확한 목표를 가진 사용자층을 유치하고 만족시키는 데 한계가 있습니다. 이는 잠재 고객 이탈 및 서비스 경쟁력 약화로 이어질 수 있습니다.

## 3. Goal Statement

- **Primary Goal:** 사용자가 AI 플랜 생성 시 '린매스업'을 목표로 선택하고, 해당 목표에 최적화된 운동 및 식단 계획을 제공받을 수 있도록 시스템을 확장합니다.
- **Secondary Goal:** 향후 다른 목표들도 쉽게 추가할 수 있도록 시스템의 확장성을 고려하여 개발합니다.

## 4. Success Metrics

- **Quantitative:**
  - '린매스업' 목표 선택 비중이 전체 목표 설정의 10% 이상 달성.
  - 기능 출시 후 1개월 내 AI 플랜 생성률 5% 증가.
- **Qualitative:**
  - "내 목표에 딱 맞는 계획을 받았다"와 같은 긍정적인 사용자 피드백.
  - 생성된 '린매스업' 계획이 영양학 및 운동생리학적 원칙에 부합한다는 내부 검토 통과.

## 5. Scope

### In-Scope
- 목표 선택 UI에 '린매스업' 옵션 추가
- '린매스업' 페르소나(목표)에 대한 파라미터 정의 (칼로리 계산, 매크로 비율 등)
- '린매스업' 목표를 처리하도록 `persona-engine.ts` 로직 수정
- Supabase `generate-ai-plan` 함수에서 '린매스업' 목표에 따른 계획 생성 로직 추가
- 다국어 지원이 필요한 경우, '린매스업' 관련 텍스트 추가

### Out-of-Scope
- 이번 단계에서 '린매스업' 외 다른 새로운 목표 추가
- 기존 AI 플래너의 대대적인 리팩토링
- '린매스업'과 관련 없는 UI/UX 변경

## 6. High-Level Plan

| Phase | Task | ETA |
|---|---|---|
| **Phase 1: Discovery & Design** | - 페르소나/목표 관련 기존 코드 분석 (`persona-engine.ts`, `ai-planner.ts` 등)<br>- '린매스업' 목표 파라미터 정의<br>- UI/UX 설계 | 1 day |
| **Phase 2: Development** | - UI 컴포넌트 수정<br>- `persona-engine.ts` 로직 구현<br>- Supabase `generate-ai-plan` 함수 수정 | 3-5 days |
| **Phase 3: Testing & Validation** | - 단위 테스트 및 E2E 테스트<br>- 생성된 계획 검증 | 2 days |
| **Phase 4: Deployment & Release**| - 배포 및 기능 활성화 | 1 day |

**Total Estimated Time:** 7-9 days

## 7. Dependencies & Risks

- **Dependencies:**
  - '린매스업' 목표에 대한 명확한 정의 (칼로리 잉여 수준, 매크로 비율 등)
  - Supabase 프로젝트 접근 권한
- **Risks:**
  - '린매스업'의 정의가 사용자마다 달라 기대치 충족이 어려울 수 있음. (완화: 명확한 가이드라인 제공)
  - Supabase 함수 변경이 기존 계획 생성에 예기치 않은 버그를 유발할 수 있음. (완화: 철저한 회귀 테스트 수행)

## 8. Stakeholders

- **Product Manager:** 기능 정의 및 최종 승인
- **FE/BE Developer:** 기능 구현 및 테스트
- **QA:** 기능 테스트 및 품질 보증
- **User:** 최종 사용자
