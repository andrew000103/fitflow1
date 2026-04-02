# Plan: pixel-character-system

**작성일**: 2026-04-02  
**상태**: Plan 완료  
**우선순위**: P2

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 기존 햄식이 이미지 에셋이 삭제됐고, 픽셀맨/픽셀우먼 에셋(4 변형 × lv1~10)이 준비됨. 코드 전반에 HamsterLevelId·hamster 레퍼런스가 남아 크래시 위험 있음 |
| **해결** | 픽셀 캐릭터 시스템으로 전면 교체. 성별·목표 기반 변형 자동 배정, 10단계 레벨 체계, 분류 유형(아키타입) 뱃지 도입 |
| **UX 효과** | 캐릭터가 내 목표·성별을 반영하게 되어 몰입감 증가. 10단계 진화 경로가 명확해져 동기 부여 향상 |
| **핵심 가치** | 개인화된 픽셀 캐릭터가 앱 내 '나의 분신'으로 작동. 온보딩~홈~설문 결과까지 일관된 캐릭터 경험 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 햄식이 에셋 삭제로 인한 이미지 로드 크래시 해결 + 더 개인화된 캐릭터 경험으로 업그레이드 |
| **WHO** | 신규/기존 사용자 모두. 특히 AI 온보딩 완료 사용자 (성별·목표 데이터 보유) |
| **RISK** | HamsterLevelId 타입이 여러 파일에 분산되어 있어 타입 교체 시 누락 위험. 기존 AsyncStorage persist 데이터와의 호환 |
| **SUCCESS** | 앱 전체에서 hamster 관련 크래시 0, npx tsc --noEmit 통과, 4 변형 캐릭터가 성별·목표에 맞게 노출 |
| **SCOPE** | 타입/설정 레이어 + 할당 로직 + UI 컴포넌트 + 화면 4개 교체. AI 플랜 생성 로직은 무변경 |

---

## 1. 배경 및 문제

### 1.1 현재 상황
- `assets/hamster_1200x1200/` 전체 삭제됨 (git status에서 확인)
- `assets/pixel/male/light-blue/lb_lv1~10.png`, `male/black/b_lv1~10.png`, `female/pink/p_lv1~10.png`, `female/white/w_lv1~10.png` 준비 완료
- 코드 레퍼런스: `hamster-evolution-card.tsx`, `ai-level-result-screen.tsx`, `persona-engine.ts`, `ai-level-classifier.ts`, `persona-store.ts` 등에 `HamsterLevelId`, `HAMSTER_LEVEL_META`, hamster 텍스트 잔존
- 현재 레벨 수: 12개 (`beginner → god`), 픽셀 에셋은 lv1~10 (10개)

### 1.2 해결 방향
1. 레벨 체계를 10단계로 정리 (챌린저·랭커 제거)
2. 픽셀 캐릭터 4 변형 중 하나를 성별+목표 기준으로 자동 배정
3. "분류 유형" 아키타입 시스템 도입 (뱃지 + 설명 + 변형 배정 연동)
4. 코드 전반의 hamster 레퍼런스를 pixel character 레퍼런스로 교체

---

## 2. 캐릭터 시스템 설계

### 2.1 픽셀 에셋 구조

```
assets/pixel/
  male/
    light-blue/   lb_lv1.png ~ lb_lv10.png   (날씬·애슬레틱 타입)
    black/        b_lv1.png  ~ b_lv10.png    (근육질·파워 타입)
  female/
    pink/         p_lv1.png  ~ p_lv10.png    (건강·슬림 목표)
    white/        w_lv1.png  ~ w_lv10.png    (근력·벌크 목표)
```

### 2.2 캐릭터 변형 ID

```typescript
export type PixelVariantId = 'male-lightblue' | 'male-black' | 'female-pink' | 'female-white';
```

### 2.3 변형 배정 규칙

| 성별 | 목표 | 배정 변형 | 분류 유형 |
|------|------|-----------|-----------|
| male | strength_gain, muscle_gain, lean_bulk + full_gym/garage | male-black | 파워형 / 매스업형 |
| male | weight_loss, health, maintenance, bodyweight 환경 | male-lightblue | 다이어터형 / 웰니스형 |
| female | strength_gain, muscle_gain, lean_bulk | female-white | 파워형 / 매스업형 |
| female | weight_loss, health, maintenance | female-pink | 다이어터형 / 웰니스형 |
| undisclosed / 미설정 | — | male-lightblue (기본값) | — |

> **Quick Character Setup 경로 (AI 온보딩 미완료 사용자)**  
> `trainingStyle: 'performance'` → black/white 변형  
> `trainingStyle: 'physique'` + `workoutFrequency: '5_plus'` → black/white 변형  
> 그 외 → lightblue/pink 변형  
> gender 필드를 `QuickCharacterProfile`에 추가해야 함

### 2.4 미결정 성별 처리
- `character-setup-screen.tsx`에 gender 선택 항목 추가 (male / female / 선택 안 함)
- 선택 안 함(undisclosed)이면 `male-lightblue` 기본 배정, 나중에 프로필에서 변경 가능

---

## 3. 레벨 체계 (10단계)

### 3.1 레벨 ID 매핑

현재 12개 → 10개로 정리 (챌린저·랭커 제거):

| 레벨 | 내부 ID | 별명 | 획득 경로 |
|------|---------|------|-----------|
| lv1 | `beginner` | 헬린이 | 설문 배정 |
| lv2 | `novice` | 루키 | 설문 배정 |
| lv3 | `intermediate` | 단련 중 | 설문 배정 |
| lv4 | `upper_intermediate` | 준전문가 | 설문 배정 |
| lv5 | `advanced` | 강철인 | 설문 배정 |
| lv6 | `veteran` | 고인물 | 설문 최고치 |
| lv7 | `artisan` | 달인 | 앱 활동 |
| lv8 | `master` | 마스터 | 앱 활동 |
| lv9 | `grandmaster` | 전설 | 앱 활동 |
| lv10 | `god` | 신의 경지 | 앱 활동 |

> **내부 ID는 semantic string 유지** (beginner, novice, ..., god)  
> lv 숫자는 에셋 파일명 매핑에만 사용

### 3.2 HamsterLevelId → CharacterLevelId 타입 변경

```typescript
// 변경 전 (12개)
export type HamsterLevelId = 'beginner' | 'novice' | ... | 'challenger' | 'ranker' | 'god';

// 변경 후 (10개, challenger·ranker 제거)
export type CharacterLevelId = 'beginner' | 'novice' | 'intermediate' | 'upper_intermediate' 
  | 'advanced' | 'veteran' | 'artisan' | 'master' | 'grandmaster' | 'god';
```

### 3.3 레벨→에셋 번호 매핑

```typescript
export const LEVEL_TO_ASSET_NUM: Record<CharacterLevelId, number> = {
  beginner: 1, novice: 2, intermediate: 3, upper_intermediate: 4,
  advanced: 5, veteran: 6, artisan: 7, master: 8, grandmaster: 9, god: 10,
};
```

---

## 4. 분류 유형 (아키타입) 시스템

### 4.1 아키타입 목록

| ID | 이름 | 설명 | 배정 조건 |
|----|------|------|-----------|
| `powerlifter` | 파워리프터 | 중량과 힘이 전부인 타입 | strength_gain + full/garage gym |
| `mass_builder` | 매스 빌더 | 몸을 키우는 게 목표인 타입 | muscle_gain / lean_bulk + full gym |
| `lean_body` | 린 바디 | 단단하고 슬림한 체형 추구 | lean_bulk + intermediate+ |
| `dieter` | 다이어터 | 체중 감량이 현재 목표 | weight_loss |
| `wellness` | 웰니스형 | 건강과 균형을 중시 | health / maintenance |
| `all_rounder` | 올라운더 | 특정 성향 없이 균형 추구 | 분류 기준 미해당 시 기본값 |

### 4.2 아키타입 표시
- `hamster-evolution-card` (→ `pixel-evolution-card`) 내부에 아키타입 뱃지 표시
- 뱃지 레이블 + 1줄 설명 텍스트
- 아키타입이 캐릭터 변형 배정의 입력값이기도 함 (4.3)

### 4.3 아키타입→변형 연동
- `powerlifter`, `mass_builder` → black / white
- `lean_body`, `dieter`, `wellness`, `all_rounder` → lightblue / pink

---

## 5. 영향 파일 목록

### 5.1 수정이 필요한 파일

| 파일 | 변경 내용 | 중요도 |
|------|-----------|--------|
| `src/lib/persona-engine.ts` | `HamsterLevelId` → `CharacterLevelId`, 12→10개, LEVELS 배열에서 challenger·ranker 제거, `HAMSTER_LEVEL_META` → `CHARACTER_LEVEL_META` | Critical |
| `src/lib/ai-level-classifier.ts` | `SurveyLevelId`, `LEVEL_META` 업데이트, `title` 필드에서 "햄식이" 제거, 변형 배정 로직 추가 (`assignPixelVariant()`), 아키타입 분류 로직 추가 (`classifyArchetype()`) | Critical |
| `src/components/home/hamster-evolution-card.tsx` | 파일 및 컴포넌트명 변경 (`PixelEvolutionCard`), `LEVEL_IMAGE_MAP` → 변형별 4개 맵, 도감 모달 텍스트 교체, props에 `variantId: PixelVariantId` 추가 | Critical |
| `src/screens/ai/ai-level-result-screen.tsx` | `LEVEL_IMAGE_MAP` → 픽셀 에셋으로 교체, "햄식이" 텍스트 제거, variantId 기반 이미지 선택 | High |
| `src/stores/persona-store.ts` | `HamsterLevelId` → `CharacterLevelId`, `variantId: PixelVariantId | null` 추가, `archetypeId` 추가 | High |
| `src/stores/ai-plan-store.ts` | `SurveyLevelResult` 내 `title` 필드 수정, `variantId` 반환 포함 | High |
| `src/screens/persona/character-setup-screen.tsx` | gender 선택 항목 추가 (`male / female / undisclosed`), `QuickCharacterProfile`에 gender 저장 | High |
| `src/screens/home/home-screen.tsx` | `HamsterEvolutionCard` → `PixelEvolutionCard`, `variantId` 전달 | Medium |

### 5.2 신규 추가 파일

| 파일 | 용도 |
|------|------|
| `src/lib/pixel-character-config.ts` | 10단계 레벨 메타 + 에셋 경로 맵 (변형별 4개) + 아키타입 상수 |
| `src/components/home/pixel-evolution-card.tsx` | 기존 hamster-evolution-card 대체 (변형 지원) |

### 5.3 삭제 파일

| 파일 | 사유 |
|------|------|
| `src/components/home/hamster-evolution-card.tsx` | `pixel-evolution-card.tsx`로 대체 |

---

## 6. 모듈 분리 (구현 순서)

| 모듈 | 범위 | 설명 |
|------|------|------|
| **M1** | 타입·설정 레이어 | `pixel-character-config.ts` 신규, `persona-engine.ts` 타입 교체, challenger/ranker 제거 |
| **M2** | 배정 로직 | `ai-level-classifier.ts`에 `assignPixelVariant()`, `classifyArchetype()` 추가, `QuickCharacterProfile` gender 추가 |
| **M3** | 스토어 연동 | `persona-store.ts`, `ai-plan-store.ts` 타입 업데이트 + variantId/archetypeId 저장 |
| **M4** | UI 교체 | `pixel-evolution-card.tsx` 신규, `ai-level-result-screen.tsx` 수정, `home-screen.tsx` 컴포넌트 교체, `character-setup-screen.tsx` gender 추가 |

---

## 7. 리스크 및 완화

| 리스크 | 가능성 | 완화 방법 |
|--------|--------|-----------|
| `HamsterLevelId` 타입을 `CharacterLevelId`로 교체할 때 누락 발생 | 높음 | M1 완료 직후 `npx tsc --noEmit` 통과 확인 |
| 기존 AsyncStorage persist 데이터에 `challenger`/`ranker` levelId 저장된 경우 | 중간 | persona-store의 rehydrate/migrate에서 legacy id → nearest level로 fallback 처리 |
| gender 없는 Quick Character Setup 사용자 (기존 계정) | 중간 | `variantId: null`이면 `male-lightblue` 기본값으로 fallback, 프로필에서 변경 유도 |
| 이미지 require() 경로가 번들 시간에 결정되므로 동적 경로 불가 | 높음 | 40개 이미지를 모두 정적으로 require()하는 맵 객체 사용 (`pixel-character-config.ts`) |

---

## 8. 성공 기준

- [ ] 앱 전체에서 `hamster_1200x1200` 경로 참조 0건
- [ ] `npx tsc --noEmit` 통과
- [ ] 성별·목표 기반으로 4 변형 중 하나가 올바르게 노출됨
- [ ] lv1~lv10 이미지가 모두 정상 로드됨 (40개 에셋)
- [ ] `challenger`, `ranker` 레벨 ID 완전 제거
- [ ] 아키타입 뱃지가 홈 캐릭터 카드에 표시됨

---

## 9. 추후 고려 (이번 스코프 제외)

- 캐릭터 변형 수동 변경 UI (설정 화면)
- 애니메이션 진화 이펙트 (레벨업 시)
- 픽셀 캐릭터 커스터마이징 (색상/아이템 추가)
- undisclosed gender 사용자를 위한 중립 픽셀 캐릭터 에셋 (현재는 male-lightblue 기본값)
