# Plan: fitness-type-expansion

**Feature**: 헬스 유형 분류 확장  
**Created**: 2026-04-07  
**Phase**: Plan  
**Status**: In Progress

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 현재 4가지 픽셀 유형(남2/여2)은 goal×gymType×gender 기반 2×2 구조로, 웰니스형·맨몸운동형·카디오형 사용자를 generic lean 변형으로 통합해 분류 정확도가 낮다 |
| **Solution** | 3개 신규 픽셀 변형(wellness-green, calisthenics-orange, cardio-teal)을 추가해 총 7개 유형으로 확장하고, 각 유형의 실루엣·스타일을 차별화한다 |
| **UX Effect** | 사용자가 "내 유형"을 받았을 때 실제 운동 스타일과 맞아떨어진다는 느낌↑, 온보딩 결과 화면의 공감 지수↑ |
| **Core Value** | "당신이 하는 운동 방식 그대로" 를 시각적으로 표현 — 분류가 곧 정체성 확인 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 현행 4유형은 2×2(성별×강도) 구조로 웰니스/맨몸/카디오 사용자가 맞지 않는 변형을 받게 됨. 분류 공감도 개선이 핵심 |
| **WHO** | 헬스 유형 테스트를 완료하는 모든 신규·기존 사용자. 특히 맨몸운동자, 건강유지 목적자, 유산소 중심 운동자 |
| **RISK** | 에셋 제작 일정(10레벨 × 신규 변형 수), 카디오 유형은 현재 온보딩 데이터 신호 부재, 기존 사용자 재분류 처리 |
| **SUCCESS** | 신규 유형 배정 케이스 커버율 100%, 기존 4개 유형 분류 로직 무변경, 타입체크 통과 |
| **SCOPE** | pixel-character-config.ts (새 변형 추가), ai-level-classifier.ts (배정 로직 확장), 온보딩 데이터 구조 (카디오 Phase 2), 픽셀 에셋 파일 30장 신규 |

---

## 1. 현황 분석 (현행 시스템)

### 1.1 현행 4가지 픽셀 변형

| 변형 ID | 라벨 | 배정 조건 |
|---------|------|-----------|
| `male-lightblue` | 밸런스 빌더형 | male + lean 성향 (기본) |
| `male-black` | 파워 빌더형 | male + power goal + full/garage gym |
| `female-pink` | 퍼포먼스 빌더형 | female + power goal + full/garage gym |
| `female-white` | 라인 밸런스형 | female + lean 성향 (기본) |

**Power 판정 기준:**  
- goal: `strength_gain`, `muscle_gain`, `lean_bulk`  
- AND gymType: `full_gym`, `garage_gym`

**현행 배정 코드:**  
```typescript
// ai-level-classifier.ts
export function assignPixelVariant(gender, goal, gymType): PixelVariantId {
  const isPower = POWER_GOALS.has(goal) && POWER_GYM_TYPES.has(gymType);
  if (gender === 'male') return isPower ? 'male-black' : 'male-lightblue';
  return isPower ? 'female-pink' : 'female-white';
}
```

### 1.2 커버 공백 분석

| 공백 유형 | 현재 배정 | 문제 |
|-----------|-----------|------|
| `goal === 'health' || 'maintenance'` | lean 변형 | "건강/유지" 사용자를 "체중감량/라인"처럼 표현 |
| `gymType === 'bodyweight'` | lean 변형 | 맨몸운동 철학·실루엣과 전혀 다른 캐릭터 |
| 카디오/지구력 목적 | 해당 goal 없음 | 데이터 신호 자체 미존재 |
| `gender === 'undisclosed'` | `male-lightblue` 기본값 | 성별 중립적 표현 부재 |

---

## 2. 확장 방향 결정

### 2.1 추가 여부 결론: **추가가 맞다**

현행 archetype 6종 (powerlifter/mass_builder/lean_body/dieter/wellness/all_rounder)은 이미 더 세밀한 분류를 하고 있으나, 시각적 픽셀 캐릭터와 연결되지 않아 사용자가 체감하는 "나의 유형" 정체성이 4가지로만 표현된다. 분류 정확도와 공감도를 함께 높이려면 픽셀 변형 확장이 필수다.

### 2.2 추가할 유형 (3개, Phase 1 + Phase 2)

#### Phase 1 — 기존 온보딩 데이터로 즉시 분류 가능

**유형 5: `wellness-green` — 웰니스/지속가능형**  
- **배정 조건**: `goal === 'health' || goal === 'maintenance'`  
- **성별**: 남녀 공통 단일 변형 (gender-neutral 설계)  
- **대상 사용자**: 몸 만들기보다 오래 건강하게 유지하는 것이 목적, 스트레스 해소·컨디션 관리 중심  

**유형 6: `calisthenics-orange` — 맨몸운동/케리스테닉스형**  
- **배정 조건**: `gymType === 'bodyweight'` (goal 무관)  
- **성별**: gender-neutral 단일 변형 또는 남녀 별도 (에셋 여건에 따라)  
- **대상 사용자**: 기구 없이 자체중량 운동, 철봉/딥스/링 중심, 이동성 높은 운동 스타일  

#### Phase 2 — 온보딩 데이터 확장 후 가능

**유형 7: `cardio-teal` — 카디오/지구력형**  
- **배정 조건**: 온보딩에 `goal: 'endurance'` 또는 `workoutStyle: 'cardio'` 추가 필요  
- **성별**: gender-neutral 단일 변형  
- **대상 사용자**: 러닝, 사이클, 크로스핏 카디오 중심, 체중 감량보다 퍼포먼스 향상 동기  
- **범위 주의**: 이 단계에서는 `AIGoal` 타입 확장 + 온보딩 UI + ai-planner 프롬프트 연동 필요

---

## 3. 신규 유형 상세 설계

### 3.1 `wellness-green` (웰니스/지속가능형)

| 항목 | 내용 |
|------|------|
| **라벨** | 웰니스 빌더형 |
| **shortReason** | 건강을 오래 유지하는 것이 중심인 유형이에요. |
| **detailReason** | 빠른 변화보다 지속 가능한 흐름을 만드는 쪽에 가까워요. 운동을 통해 컨디션과 멘탈을 함께 챙기는 루틴이 잘 맞습니다. |
| **variantHint** | `lean` (archetype 매핑 시 wellness/all_rounder 우선) |

**디자인 방향:**
- **색상**: Forest green (#3D7A5C) + Light sage accent (#A8C9A5)
- **실루엣**: 중간 체형, 편안한 운동복 (트레이닝 팬츠 + 루즈핏 탑)
- **포즈**: 자연스럽게 서 있는 자세, 두 손은 편안히 내리거나 한 손 hips-on (여유로운 분위기)
- **분위기 키워드**: 꾸준함, 자연스러움, 지속가능, 온기
- **차별점**: 기존 lean 변형보다 덜 날카롭고, 더 편안한 실루엣. 긴 다리나 날카로운 윤곽보다 균형 잡힌 비율
- **레벨 진화**: 초반에는 편안한 복장 → 상위 레벨일수록 정돈된 운동복, 자신감 있는 포즈

### 3.2 `calisthenics-orange` (맨몸운동/케리스테닉스형)

| 항목 | 내용 |
|------|------|
| **라벨** | 케리스테닉스형 |
| **shortReason** | 맨몸으로 가장 강해지는 타입이에요. |
| **detailReason** | 무게 기구 없이 자체 중량만으로 높은 수행 능력을 만드는 운동 방식이에요. 이동성과 기능적 근력이 핵심입니다. |
| **variantHint** | `power` (높은 기능적 근력 표현) |

**디자인 방향:**
- **색상**: Amber orange (#E07B39) + Dark charcoal outline (#2C2C2C)
- **실루엣**: 날렵하고 근육이 정의된 체형 (bulky 아닌 functional lean), 허리 좁고 어깨 넓음
- **포즈**: 동작적 포즈 — 낮은 수준에서는 스쿼트 자세 → 높은 레벨에서 플란체/L-sit 느낌 포즈로 진화
- **분위기 키워드**: 기능적 강인함, 자유, 이동성, 도전
- **차별점**: 기존 4개 유형 중 가장 동적인 포즈. 바벨 같은 기구 없이 맨몸 그 자체의 강인함 표현
- **레벨 진화**: 낮은 레벨은 기본 운동 자세 → 높은 레벨은 스킬 무브 연상 포즈

### 3.3 `cardio-teal` (카디오/지구력형) — Phase 2

| 항목 | 내용 |
|------|------|
| **라벨** | 엔듀런스형 |
| **shortReason** | 달리고 버티는 힘이 진짜 강점인 유형이에요. |
| **detailReason** | 근육량보다 심폐 능력과 지구력을 끌어올리는 방향에 가까워요. 꾸준히 움직이는 것 자체가 강점이 되는 스타일입니다. |
| **variantHint** | `lean` |

**디자인 방향:**
- **색상**: Teal (#2A9D8F) + Bright cyan highlight (#4CC9F0)
- **실루엣**: 러너형 체형 — 슬림하고 가벼운 느낌, 경량 런닝웨어
- **포즈**: 달리는 중 또는 스타트 포지션 → 높은 레벨일수록 역동적 스트라이드 포즈
- **분위기 키워드**: 속도, 가벼움, 지구력, 에너지
- **차별점**: 가장 역동적이고 경량화된 실루엣. 무게보다 이동을 표현

---

## 4. 기술 구현 범위

### 4.1 Phase 1 코드 변경

#### `src/lib/pixel-character-config.ts`
- `PixelVariantId` 타입에 `'wellness-green' | 'calisthenics-orange'` 추가
- `PIXEL_IMAGE_MAP`에 신규 변형 × 10레벨 항목 추가
- `PIXEL_VARIANT_META`에 신규 변형 메타 추가
- `DEFAULT_PIXEL_VARIANT` 유지 (변경 없음)

#### `src/lib/ai-level-classifier.ts`
- `assignPixelVariant()` 함수 로직 확장:
  ```
  우선순위:
  1. gymType === 'bodyweight' → calisthenics-orange
  2. goal === 'health' || 'maintenance' → wellness-green
  3. gender === 'male' + power → male-black
  4. gender === 'female' + power → female-pink
  5. gender === 'male' + lean → male-lightblue
  6. gender === 'female' + lean → female-white
  7. undisclosed + power → male-black (현행)
  8. undisclosed + lean → wellness-green (개선)
  ```
- `classifyArchetype()` 변경 없음 (archetype은 이미 6종으로 충분히 세분화됨)

### 4.2 Phase 2 코드 변경

#### `src/stores/ai-plan-store.ts`
- `AIGoal`에 `'endurance'` 추가

#### `src/screens/ai/ai-onboarding-screen.tsx`
- 목표 선택지에 `지구력/카디오` 추가

#### `src/lib/pixel-character-config.ts`
- `'cardio-teal'` 변형 추가

#### `src/lib/ai-level-classifier.ts`
- `goal === 'endurance'` → `cardio-teal` 배정 추가

### 4.3 에셋 요구사항

| 신규 변형 | 필요 이미지 수 | Phase |
|-----------|----------------|-------|
| `wellness-green` | 10장 | 1 |
| `calisthenics-orange` | 10장 | 1 |
| `cardio-teal` | 10장 | 2 |
| **합계** | **30장** | - |

파일명 규칙 (기존과 동일):
- wellness-green: `wg_lv1.png` ~ `wg_lv10.png`
- calisthenics-orange: `co_lv1.png` ~ `co_lv10.png`
- cardio-teal: `ct_lv1.png` ~ `ct_lv10.png`

경로: `assets/pixel/wellness/green/`, `assets/pixel/calisthenics/orange/`, `assets/pixel/cardio/teal/`

---

## 5. 영향 범위 및 하위 호환성

### 5.1 기존 사용자 재분류 처리

| 시나리오 | 현재 | 변경 후 | 대응 |
|---------|------|---------|------|
| `goal=health` + `male` 사용자 | `male-lightblue` | `wellness-green` | 앱 재진입 시 자동 재배정 |
| `gymType=bodyweight` + `male` 사용자 | `male-lightblue` | `calisthenics-orange` | 앱 재진입 시 자동 재배정 |
| `goal=health` + `female` 사용자 | `female-white` | `wellness-green` | 앱 재진입 시 자동 재배정 |

**주의**: 재분류는 `classifySurveyLevel()` 재호출 시 자동 처리되므로 마이그레이션 스크립트 불필요. 단, 사용자가 이미 분류 결과를 Supabase에 저장한 경우(health-level-card 관련 테이블 있다면) 확인 필요.

### 5.2 기존 4개 유형 영향

- 기존 배정 로직에서 wellness-green/calisthenics-orange가 먼저 걸러지므로, 나머지 4개 유형의 배정 대상이 줄어들 뿐 로직은 변경되지 않는다.
- `DEFAULT_PIXEL_VARIANT`는 `male-lightblue`로 유지.

---

## 6. 성공 기준

| 기준 | 측정 방법 |
|------|-----------|
| 신규 3가지 변형 타입 정의 완료 | `PixelVariantId` 타입 포함 여부 |
| 분류 로직 우선순위 동작 확인 | 단위 케이스별 `assignPixelVariant()` 반환값 검증 |
| 기존 4개 유형 배정 무변경 | power/lean 케이스 회귀 테스트 |
| TypeScript 타입체크 통과 | `npx tsc --noEmit` 성공 |
| 에셋 경로 정의 완료 | `PIXEL_IMAGE_MAP` 구조에 신규 변형 항목 포함 |

---

## 7. 구현 우선순위

### P1 (Phase 1 — 즉시)
1. `pixel-character-config.ts` — 신규 변형 타입·메타 추가
2. `ai-level-classifier.ts` — 배정 로직 확장
3. 에셋 파일 제작 + 경로 등록 (wellness-green 10장, calisthenics-orange 10장)

### P2 (Phase 2 — 별도 PDCA)
4. 온보딩에 `endurance/cardio` goal 추가
5. `cardio-teal` 에셋 제작 + 배정 로직 추가

---

## 8. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| 에셋 제작 지연으로 코드-에셋 불일치 | 중 | 에셋 완성 전까지 `require()` 경로에 placeholder 이미지 사용 |
| 기존 사용자 재분류로 인한 캐릭터 변경 혼란 | 저 | 홈 화면에 "유형 분석이 업데이트됐어요" 알림 1회 노출 (선택) |
| 카디오 goal 추가 시 ai-planner 프롬프트 연동 | 중 | Phase 2 별도 PDCA로 분리해 리스크 격리 |
| `wellness-green` 배정이 과도하게 광범위 | 저 | `goal=health/maintenance`로만 한정, 추후 gymType 조건 추가 가능 |
