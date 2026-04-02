# Plan: Fix Incomplete Type Refactoring for Pixel Character System

**작성일**: 2026-04-02
**상태**: Plan 완료
**우선순위**: P0 (Critical)
**관련 분석**: `docs/03-analysis/pixel-character-system.analysis.md`

---

## Executive Summary

| 관점 | 내용 |
|---|---|
| **문제** | `pixel-character-system` 구현이 `HamsterLevelId` 타입을 완전히 제거하지 못하고, 레거시 코드 위에 새 기능이 추가되어 코드 일관성이 깨지고 타입 오류 위험이 상존함. |
| **해결** | 기존 분석 문서에서 식별된 Gap을 해결하기 위한 구체적인 리팩토링 작업을 수행. 핵심은 `HamsterLevelId`를 `CharacterLevelId`로 완전히 교체하고, 관련된 모든 모듈을 수정하는 것. |
| **UX 효과** | 직접적인 UX 변경은 없으나, 타입 불일치로 인한 잠재적 크래시 및 데이터 오류를 예방하여 시스템 안정성을 확보. |
| **핵심 가치** | 코드의 유지보수성, 안정성, 일관성을 확보. 개발자가 신뢰하고 수정할 수 있는 코드 기반을 마련. |

---

## 1. 배경 및 목표

`pixel-character-system`의 1차 구현이 완료되었으나, 분석 결과 핵심적인 타입 리팩토링이 누락된 것으로 확인되었다. `HamsterLevelId`가 여전히 코드베이스에 남아있어 잠재적인 버그 유발 및 유지보수 비용 증가의 원인이 되고 있다.

**목표**: `pixel-character-system.analysis.md`에서 식별된 모든 Gap을 해결하여, `pixel-character-system`이 계획대로 100% 구현되도록 한다.

---

## 2. 작업 범위 (Scope)

이번 Plan은 아래 파일들의 리팩토링에 집중한다.

1.  `src/lib/persona-engine.ts`
2.  `src/lib/ai-level-classifier.ts`
3.  `src/stores/persona-store.ts`
4.  `src/screens/home/home-screen.tsx` (검증)
5.  `src/components/home/pixel-evolution-card.tsx` (검증)

---

## 3. 리팩토링 작업 상세

### 3.1. 모듈 1: `persona-engine.ts` (가장 먼저)

-   [ ] `HamsterLevelId` 타입을 `import type { CharacterLevelId } from './pixel-character-config'` 로 교체한다.
-   [ ] `LEVELS` 배열에서 `challenger`, `ranker` 객체를 완전히 삭제한다. (12개 → 10개)
-   [ ] `calculatePersonaProfile` 함수의 반환 값 타입인 `PersonaCalculationResult` 내의 `levelId`와 `nextLevelId`가 `CharacterLevelId`를 반환하도록 내부 로직을 수정한다.
-   [ ] 파일 내 모든 `HamsterLevelId` 타입 애너테이션을 `CharacterLevelId`로 변경한다.

### 3.2. 모듈 2: `ai-level-classifier.ts`

-   [ ] `import type { HamsterLevelId } from './persona-engine'` 구문을 삭제한다.
-   [ ] `SurveyLevelId` 타입을 `Extract<CharacterLevelId, ...>`로 수정하여 `CharacterLevelId` 에서 파생되도록 한다.
-   [ ] 로컬에 중복 정의된 `LEVEL_META` 상수를 삭제한다.
-   [ ] `CHARACTER_LEVELS` (`pixel-character-config.ts`에서 import)를 직접 사용하여 `name`, `shortDescription`, `detail` 등을 조회하도록 로직을 수정한다. (e.g., `getLevelNickname` 함수 수정/활용)
-   [ ] `title` 필드를 `SurveyLevelResult` 타입에서 완전히 제거하고, 관련 로직을 `nickname` 필드를 사용하도록 통일한다.

### 3.3. 모듈 3: `src/stores/persona-store.ts`

-   [ ] `levelId`와 `nextLevelId` 상태의 타입을 `CharacterLevelId | null` 로 변경한다.
-   [ ] `import type { HamsterLevelId } from '../lib/persona-engine'` 구문을 삭제한다.
-   [ ] `migrate` 함수의 `state.levelId = legacyMap[state.levelId] as HamsterLevelId;` 와 같은 코드에서 `as HamsterLevelId` 캐스팅을 제거하거나 `as CharacterLevelId`로 수정한다.
-   [ ] 에러 메시지와 주석에 포함된 "햄식이", "hamster" 문자열을 "픽셀 캐릭터" 또는 "캐릭터"로 수정한다.

---

## 4. 검증 단계

### 4.1. UI 검증

-   [ ] `src/screens/home/home-screen.tsx` 파일을 열어 `PixelEvolutionCard` 컴포넌트에 `variantId`와 `archetypeId`가 `persona-store`로부터 올바르게 전달되는지 확인한다.
-   [ ] `src/components/home/pixel-evolution-card.tsx` 파일을 열어, 전달받은 `variantId`와 `levelId`를 사용해 `PIXEL_IMAGE_MAP`에서 올바른 이미지를 `require`하는지 로직을 검토한다. 아키타입 뱃지가 `archetypeId`에 따라 표시되는지 확인한다.

### 4.2. 최종 타입 검증

-   [ ] 모든 코드 수정 완료 후, 프로젝트 루트에서 `npx tsc --noEmit` 명령을 실행하여 타입 에러가 없는지 최종 확인한다.

---

## 5. 성공 기준

- [ ] `src/lib/persona-engine.ts`, `src/lib/ai-level-classifier.ts`, `src/stores/persona-store.ts` 파일에서 `HamsterLevelId` 타입이 완전히 제거됨.
- [ ] `npx tsc --noEmit` 실행 시 어떠한 타입 에러도 발생하지 않음.
- [ ] 앱 실행 후 홈 화면에서 픽셀 캐릭터가 정상적으로 표시됨 (이미지 깨짐, 크래시 없음).
- [ ] `challenger`, `ranker` 레벨 ID가 코드베이스에서 완전히 제거됨 (`grep`으로 확인).
