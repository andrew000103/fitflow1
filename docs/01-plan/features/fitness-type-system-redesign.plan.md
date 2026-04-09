# Plan: fitness-type-system-redesign

**Feature**: 헬스 유형 및 레벨 분석 시스템 전면 재설계 v2
**Created**: 2026-04-08
**Replaces**: fitness-type-expansion.plan.md (이전 플랜 대체)
**Phase**: Plan
**Status**: In Progress

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 유형과 레벨이 혼재된 현행 구조에서 캐릭터 이미지 에셋은 비어있고, 6개 유형은 SNS 바이럴에 구별력이 약하며, 레벨은 인앱 목표로 활용되지 못하고 있다 |
| **Solution** | 유형(정체성·홍보)과 레벨(인앱 목표·성장)을 완전히 분리 — 유형은 유명인 아키타입 기반 8종+성별 2배(=최대 16변형)으로 확장해 공유가치를 높이고, 레벨은 배지+이름만 유지해 단순화한다 |
| **UX Effect** | 유형 결과 화면에서 "이게 나다" 공감↑ + SNS 공유 유도↑ / 홈 레벨 카드는 깔끔한 배지형으로 정돈 |
| **Core Value** | 유형은 정체성 표현 도구, 레벨은 성장 목표 — 두 시스템이 각자의 역할에 집중 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 에셋 비워진 상태에서 기존 구조(유형=레벨 이미지 연동)를 유지할 이유 없음. 유형은 SNS 바이럴 도구로, 레벨은 인앱 목표로 역할을 재정의하는 것이 가치 극대화 |
| **WHO** | 유형 테스트를 완료하는 모든 사용자(신규·기존). SNS 공유 또는 AI 플랜으로 전환하는 사용자 |
| **RISK** | 기존 6유형 코드 참조 교체 범위, 설문 문항 수정 시 기존 사용자 재분류, 유형 이미지 에셋 제작(8~16장) |
| **SUCCESS** | 유형 테스트 독립 진입 가능, 유형 결과→공유/AI플랜 전환율 측정 가능, 레벨 배지 홈 표시, 타입체크 통과 |
| **SCOPE** | pixel-character-config.ts (유형 재정의, 레벨 이미지 제거), ai-level-classifier.ts (분류 로직 유지·확장), 유형 테스트 결과 화면(신규), 홈 레벨 카드 단순화, 설문 문항 일부 조정 |

---

## 1. 현황 진단: 왜 지금 구조를 바꾸는가

### 1.1 현행 구조의 문제

| 문제 | 설명 |
|------|------|
| **에셋 공백** | 6유형×10레벨 = 60장 에셋이 모두 임시 재사용 상태. 실제 픽셀아트 없음 |
| **유형-레벨 혼재** | 유형 테스트 결과에 캐릭터 이미지(레벨 연동)가 섞여 있어 두 시스템의 역할이 불명확 |
| **SNS 구별력 약** | 현재 6유형은 "내 유형이 뭔지" 직관적으로 공유하기 어려운 추상 명칭 |
| **레벨 활용 미흡** | 레벨명·설명이 있지만 인앱에서 사용자 목표로 활용되지 않음 |
| **성별 무시** | Gender-neutral 설계였지만 실제 사용자들은 성별 반영 유형 선호 |

### 1.2 방향 전환: 유형 ≠ 레벨

```
현행:  유형 테스트 → 유형 + 레벨 + 캐릭터이미지(레벨별) 같이 출력
변경:  유형 테스트 → 유형만 출력 (유명인 아키타입, 설명, 공유)
       레벨 시스템 → 배지+이름만 (이미지 없음, 레벨업 로직 유지)
```

---

## 2. 신규 헬스 유형 시스템 설계

### 2.1 유형 설계 원칙

1. **유명인 아키타입**: 각 유형은 글로벌 또는 한국 유명 피트니스/스포츠 인물이 연상되는 정체성
2. **성별 구분**: 주요 근력/체형 유형(powerlifter, bodybuilder, lean athlete, dieter)은 남/여 별도 변형, 나머지(calisthenics, wellness, endurance, fighter)는 gender-neutral
3. **SNS 공유 설계**: 결과 카드 하나로 "나는 [유명인] 스타일" 공유 가능
4. **분류 신호 명확**: 각 유형을 결정하는 설문 신호가 충분히 구별됨

### 2.2 추천 유형 수: 8 Core Types (성별 포함 최대 12 변형)

> **에셋 관점**: 레벨별 이미지를 폐기하므로 유형당 단일 대표 이미지만 필요.
> 8유형 × (남+여 = 2, 또는 gender-neutral = 1) = **최대 12장**으로 관리 가능.

| # | 유형 ID | 한국어 명칭 | 유명인 아키타입 참고 | 성별 분리 | 배정 조건 |
|---|---------|-------------|---------------------|-----------|-----------|
| 1 | `powerlifter` | 파워리프터형 | Eddie Hall / 마동석 에너지(남), 강인한 역도 선수(여) | 남/여 분리 | `strength_gain` + `full/garage_gym` |
| 2 | `bodybuilder` | 보디빌더형 | 아놀드 슈워제네거 클래식(남), 피규어/비키니 챔피언(여) | 남/여 분리 | `muscle_gain` + `full_gym` |
| 3 | `lean_athlete` | 린 애슬릿형 | MCU 액션 히어로(남), 피트니스 모델(여) | 남/여 분리 | `lean_bulk` or `muscle_gain`(비풀짐) |
| 4 | `transformer` | 트랜스포머형 | 다이어트 변신 스토리 (남녀 공통 inspirational) | 남/여 분리 | `weight_loss` |
| 5 | `calisthenics` | 케리스테닉스형 | Chris Heria 스타일 (gender-neutral) | neutral | `gymType === 'bodyweight'` (최우선) |
| 6 | `wellness` | 웰니스형 | 지속 가능한 건강 라이프스타일 (gender-neutral) | neutral | `health` / `maintenance` |
| 7 | `endurance` | 엔듀런스형 | 킵초게 마라톤 스타일(남), 트라이애슬론 선수(여) | 남/여 분리 | `endurance` goal (Phase 2 신규) |
| 8 | `fighter` | 파이터형 | UFC/복싱 선수 체형 (gender-neutral) | neutral | 신규 `combat/sport` goal (Phase 2) |

> **Phase 1**: 유형 1~6 구현 (현재 온보딩 데이터로 분류 가능)
> **Phase 2**: 유형 7~8 구현 (온보딩 goal 확장 필요)

### 2.3 성별 구분 방식

```
성별 분리 유형 (1~4, 7):
  TypeId: 'powerlifter_male' | 'powerlifter_female'
  또는: variantId = 'powerlifter', genderVariant = 'male' | 'female'
  → variantId + gender 조합 방식 권장 (타입 수 폭발 방지)

Gender-neutral 유형 (5, 6, 8):
  TypeId: 'calisthenics' | 'wellness' | 'fighter'
  → 단일 이미지 + 단일 설명
```

**배정 로직 (pseudo):**
```typescript
function assignFitnessType(goal, gymType, gender):
  // Phase 1 (현재 데이터로 분류 가능)
  if gymType === 'bodyweight' → 'calisthenics' (neutral)
  if goal === 'strength_gain' + power_gym → 'powerlifter' + gender
  if goal === 'muscle_gain' + full_gym → 'bodybuilder' + gender
  if goal === 'lean_bulk' or muscle_gain(non-full) → 'lean_athlete' + gender
  if goal === 'weight_loss' → 'transformer' + gender
  if goal === 'maintenance' → 'wellness' (neutral)
  default → 'wellness' (neutral)
```

---

## 3. 설문 문항 조정 방향

### 3.1 현행 온보딩 설문 (9문항)의 문제

현재 설문은 AI 플랜 생성 최적화 목적이라 유형 분류 신호가 약한 항목이 있음:
- `primaryStrengthFocus` (strength_gain 전용) → 유형 분류엔 과잉
- `plateauHistory`, `recoveryLevel`, `sleepQuality` → 레벨 분류에 유용, 유형 분류엔 덜 중요

### 3.2 유형 테스트 전용 설문 구성 (독립 플로우)

유형 테스트는 AI 온보딩과 **별개의 짧은 플로우**로 설계:

| # | 질문 | 유형 분류 신호 |
|---|------|---------------|
| 1 | **운동 목표** (체중감량 / 근비대 / 근력향상 / 린매스 / 건강유지 / 맨몸기술 / 지구력/카디오) | 유형 1차 분류 |
| 2 | **주로 하는 운동 환경** (풀 헬스장 / 홈짐/파워랙 / 덤벨만 / 맨몸) | 유형 세분화 |
| 3 | **운동 경험** (입문~상급 5단계) | 레벨 분류 |
| 4 | **주당 운동 빈도** | 레벨 분류 |
| 5 | **성별** (남/여/선택안함) | 유형 비주얼 변형 |

> **총 5문항** — 기존 9문항 대비 간결화. 레벨 계산에 필요한 최소 신호 포함.
> AI 플랜 온보딩(9문항)과는 별개. 유형 테스트 완료 후 AI 플랜을 원하면 나머지 4문항 추가 진행.

### 3.3 기존 AI 온보딩과의 관계

```
유형 테스트 (5문항, 독립)
  ↓
유형 결과 화면
  ↓ (선택)
"AI 플랜 받기" 탭 → 기존 AI 온보딩 나머지 문항 (강도, 회복, 수면, 플래토 등)
                    → AI 플랜 생성 → 기존 결과 화면
```

---

## 4. 레벨 시스템 변경사항

### 4.1 유지하는 것

| 항목 | 유지 여부 | 비고 |
|------|----------|------|
| 10단계 레벨명 (초심자~챔피언) | ✅ 유지 | |
| 레벨 배정 로직 (classifySurveyLevel) | ✅ 유지 | |
| 레벨업 시스템 | ✅ 유지 | |
| 레벨 nickname/vibe/description | ✅ 유지 | 홈 표시에서는 미사용, 데이터는 유지 |

### 4.2 제거하는 것

| 항목 | 제거 여부 | 비고 |
|------|----------|------|
| 레벨별 픽셀 캐릭터 이미지 | ✅ 제거 | `PIXEL_IMAGE_MAP` 전체 삭제 |
| 홈 상세보기 레벨 설명 UI | ✅ 제거 | |
| 레벨별 vibe/description 홈 표시 | ✅ 제거 | 데이터는 보존, UI에서만 미사용 |
| `CharacterLevelMeta.assetNum` | ✅ 제거 | 에셋 경로 불필요 |
| `LEVEL_TO_ASSET_NUM` | ✅ 제거 | |

### 4.3 홈 화면 레벨 표시 변경

```
현행:  [캐릭터 이미지 카드] + 레벨명 + 상세보기 (설명들)
변경:  [레벨 배지] 레벨명 (예: "중급자") + 경험치 바 (선택)
```

---

## 5. 유형 결과 화면 UX 플로우

### 5.1 결과 화면 구성 (신규 설계)

```
┌──────────────────────────────────────┐
│  [유형 대표 이미지 / 아이콘]            │
│  "당신은 린 애슬릿형이에요"             │
│  레벨: 중급자 (배지)                    │
│                                      │
│  ── 유형 설명 ──                       │
│  MCU 히어로처럼 기능적이면서 선명한      │
│  체형을 추구하는 타입이에요...           │
│                                      │
│  ── 이 유형의 특징 & 팁 ──              │
│  ✓ 근육량과 체지방률을 동시에 관리      │
│  ✓ 분할 운동 + 유산소 병행              │
│  ✓ 단백질 섭취가 핵심                   │
│                                      │
│  ── 이 유형의 유명한 사람들 ──          │
│  [아키타입 연상 이미지/설명]             │
│                                      │
│  [친구에게 공유하기]  [AI 플랜 받기]    │
└──────────────────────────────────────┘
```

### 5.2 공유 카드 설계

- 유형명 + 유형 대표 이미지 + 레벨 배지 + 앱 링크
- 공유 시 "나는 [유형]이야! 너는?" 형식의 바이럴 문구

### 5.3 AI 플랜 연결

- "AI 플랜 받기" 탭 시 → 기존 AI 플랜 온보딩 나머지 질문 진행
- 유형 테스트에서 수집한 데이터(goal, gymType, experience, gender)는 온보딩 pre-fill로 전달
- 사용자가 다시 입력하지 않아도 되도록 처리

---

## 6. 기술 구현 범위

### 6.1 Phase 1 파일 변경 목록

#### `src/lib/pixel-character-config.ts` (전면 재작성)
- `PixelVariantId` 타입 변경:
  - 기존: `'powerlifter' | 'mass_builder' | 'lean_body' | 'dieter' | 'calisthenics' | 'wellness'`
  - 변경: `'powerlifter' | 'bodybuilder' | 'lean_athlete' | 'transformer' | 'calisthenics' | 'wellness'`
  - 성별 변형은 별도 `FitnessTypeGenderVariant = 'male' | 'female' | 'neutral'`
- `PIXEL_IMAGE_MAP` **완전 삭제** (레벨 이미지 폐기)
- `CharacterLevelMeta`에서 `assetNum` 제거
- `LEVEL_TO_ASSET_NUM` 삭제
- `FITNESS_TYPE_META` 신규 추가 (유형별 설명, 팁, 유명인 아키타입 텍스트)

#### `src/lib/ai-level-classifier.ts`
- `assignPixelVariant()` → `assignFitnessType()` 리네임 + 로직 업데이트
  - `bodybuilder` 추가 (`mass_builder` 대체)
  - `lean_athlete` 추가 (`lean_body` 대체)
  - `transformer` 추가 (`dieter` 대체)
- `classifyArchetype()`은 유지 (AI 플랜 연동에 사용)
- `SurveyLevelResult.variantId` → `fitnessTypeId` 리네임

#### `src/screens/ai/ai-level-result-screen.tsx` (신규 또는 기존 교체)
- 유형 결과 화면 (유형 이미지 + 설명 + 팁 + 공유 + AI플랜 CTA)
- 기존 `ai-consent-screen` → `ai-onboarding-screen` 흐름과 독립

#### `src/components/home/pixel-evolution-card.tsx` (수정)
- 캐릭터 이미지 렌더링 제거
- 레벨 배지 + 레벨명 단순 표시로 교체

#### `src/navigation/root-navigator.tsx` (최소 수정)
- 유형 테스트 독립 진입 경로 추가 (홈 또는 프로필에서 진입 가능)

### 6.2 Phase 2 파일 변경

- `endurance` / `fighter` 유형 추가
- `AIGoal`에 `'endurance'` 추가 (ai-plan-store.ts)
- 온보딩 목표 선택지에 지구력/카디오 추가

### 6.3 에셋 요구사항 (대폭 축소)

| 구분 | 현행 계획 | 변경 후 |
|------|---------|---------|
| 레벨별 이미지 | 6유형 × 10레벨 = 60장 | **0장 (폐기)** |
| 유형 대표 이미지 | 없음 | 6유형 × 최대 2성별 = **최대 12장** |
| 합계 | 60장 | **12장** (80% 감소) |

---

## 7. 하위 호환성 처리

### 7.1 기존 사용자 variantId 마이그레이션

```
기존 variantId → 신규 fitnessTypeId 매핑
'powerlifter'  → 'powerlifter'
'mass_builder' → 'bodybuilder'
'lean_body'    → 'lean_athlete'
'dieter'       → 'transformer'
'calisthenics' → 'calisthenics'
'wellness'     → 'wellness'
```

- `ai-plan-store.ts` rehydrate 시 legacy variantId 자동 변환 추가
- Supabase `ai_plans.plan_json`에 저장된 구버전은 재테스트 유도 or 자동 매핑

### 7.2 AI 플랜 연동 유지

- `classifyArchetype()` 로직은 변경 없음 — AI 플랜 생성에 archetype 계속 사용
- `assignFitnessType()` (구 `assignPixelVariant()`)은 유형 결과 화면 전용으로 역할 명확화

---

## 8. 성공 기준

| 기준 | 측정 방법 |
|------|-----------|
| 유형 테스트 독립 진입 가능 | 홈/프로필에서 "내 유형 찾기" 진입 경로 존재 |
| 유형 결과 화면 6종 정상 표시 | 각 유형별 설명/팁/공유 버튼 렌더링 |
| 레벨 배지+이름만 홈 표시 | 픽셀 이미지 없이 홈 레벨 카드 정상 동작 |
| 레벨 분류 로직 무변경 | 기존 classifySurveyLevel() 동일 결과 반환 |
| AI 플랜 온보딩 pre-fill | 유형 테스트 데이터가 AI 온보딩에 전달됨 |
| TypeScript 타입체크 통과 | `npx tsc --noEmit` 성공 |

---

## 9. 구현 우선순위

### P1 (Phase 1 — 즉시 가능)
1. `pixel-character-config.ts` — 유형 재정의, 이미지 맵 제거
2. `ai-level-classifier.ts` — `assignFitnessType()` 로직 업데이트
3. `pixel-evolution-card.tsx` — 홈 레벨 배지 단순화
4. 유형 결과 화면 (`ai-level-result-screen.tsx`) — 6유형 설명/팁/공유/AI플랜 CTA
5. 유형 테스트 5문항 플로우 (신규 screen or 기존 온보딩 분기)

### P2 (Phase 2 — 별도 PDCA)
6. 유형 대표 이미지 에셋 12장 제작 + 연동
7. 공유 카드 이미지 생성 (유형별)
8. `endurance` / `fighter` 유형 추가

---

## 10. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| 기존 코드에서 `PIXEL_IMAGE_MAP` 참조 누락 삭제 | 중 | 전수 grep으로 참조 찾아 제거 |
| 유형 테스트와 AI 온보딩 설문 중복 입력 UX 마찰 | 중 | pre-fill 구현으로 해결 |
| `PixelVariantId` 이름 변경 시 Supabase 저장 데이터 불일치 | 중 | 마이그레이션 매핑 테이블 (`pixel-character-config.ts`에 포함) |
| 에셋 제작 전 유형 이미지 공백 | 저 | Phase 1은 텍스트+색상 카드로 대체, Phase 2에 이미지 추가 |
