# Design: fitness-type-system-redesign

**Feature**: 헬스 유형 및 레벨 시스템 전면 재설계 v2
**Created**: 2026-04-08
**Architecture**: Option C — Pragmatic Balance
**Phase**: Design
**Status**: In Progress

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 에셋 비워진 상태에서 기존 구조(유형=레벨 이미지 연동)를 유지할 이유 없음. 유명인 픽셀 아트 16장 준비 완료 → 유형은 SNS 바이럴 도구로, 레벨은 인앱 목표로 역할 재정의 |
| **WHO** | 유형 테스트 완료하는 모든 사용자(신규·기존). SNS 공유 또는 AI 플랜 전환 사용자 |
| **RISK** | 기존 `PixelVariantId` 타입명 변경으로 Supabase 저장 데이터 불일치, `PIXEL_IMAGE_MAP` 참조 누락 제거 |
| **SUCCESS** | 유형 결과 화면에서 유명인 헤드라인 표시, 레벨 배지만 홈 표시, 독립 유형 테스트 진입 가능, tsc 통과 |
| **SCOPE** | pixel-character-config.ts 재작성, ai-level-classifier.ts 업데이트, ai-level-result-screen.tsx 레이아웃 교체, pixel-evolution-card.tsx 모달 제거, fitness-type-test-screen.tsx 신규, navigation 타입 추가 |

---

## 1. 아키텍처 개요 (Option C)

### 1.1 변경 파일 요약

| 파일 | 변경 유형 | 핵심 변경 |
|------|-----------|-----------|
| `src/lib/pixel-character-config.ts` | 재작성 | PixelVariantId 이름 교체, PIXEL_IMAGE_MAP→FITNESS_TYPE_IMAGE_MAP(성별키), FitnessTypeContent 추가 |
| `src/lib/ai-level-classifier.ts` | 업데이트 | assignPixelVariant→assignFitnessType, genderVariant 반환 추가 |
| `src/screens/ai/ai-level-result-screen.tsx` | 레이아웃 교체 | 유명인 중심 레이아웃으로 전환 (내비게이션 구조 유지) |
| `src/components/home/pixel-evolution-card.tsx` | 단순화 | PixelLevelViewer 모달 + 이미지 렌더링 완전 제거 |
| `src/types/navigation.ts` | 추가 | FitnessTypeTest 라우트 추가 |
| `src/navigation/root-navigator.tsx` | 최소 수정 | FitnessTypeTest 스크린 등록 |
| `src/screens/ai/fitness-type-test-screen.tsx` | **신규** | 5문항 독립 유형 테스트 플로우 |

### 1.2 삭제 항목

- `PIXEL_IMAGE_MAP` — 레벨×유형 조합 이미지 맵 완전 삭제
- `PixelLevelViewer` 컴포넌트 — 10단계 레벨 슬라이더 모달 삭제
- `CharacterLevelMeta.assetNum` 필드 삭제
- `LEVEL_TO_ASSET_NUM` 맵 삭제

---

## 2. 에셋 파일 매핑

에셋 위치: `assets/pixel/` (16개 PNG, 이미 준비 완료)

| `PixelVariantId` | 성별 | 파일명 | require 경로 (src/lib 기준) |
|------------------|------|--------|-----------------------------|
| `powerlifter` | male | `Eddie Hall.png` | `../../assets/pixel/Eddie Hall.png` |
| `powerlifter` | female | `Stefi Cohen.png` | `../../assets/pixel/Stefi Cohen.png` |
| `bodybuilder` | male | `Chris Bumstead.png` | `../../assets/pixel/Chris Bumstead.png` |
| `bodybuilder` | female | `Iris Kyle.png` | `../../assets/pixel/Iris Kyle.png` |
| `lean_athlete` | male | `Zac Efron.png` | `../../assets/pixel/Zac Efron.png` |
| `lean_athlete` | female | `Kayla Itsines.png` | `../../assets/pixel/Kayla Itsines.png` |
| `transformer` | male | `Chris Pratt.png` | `../../assets/pixel/Chris Pratt.png` |
| `transformer` | female | `Adele.png` | `../../assets/pixel/Adele.png` |
| `calisthenics` | male | `Chris Heria.png` | `../../assets/pixel/Chris Heria.png` |
| `calisthenics` | female | `Chloe Ting.png` | `../../assets/pixel/Chloe Ting.png` |
| `wellness` | male | `Daniel Craig.png` | `../../assets/pixel/Daniel Craig.png` |
| `wellness` | female | `Jennifer Aniston.png` | `../../assets/pixel/Jennifer Aniston.png` |
| `endurance` (P2) | male | `Eliud Kipchoge.png` | `../../assets/pixel/Eliud Kipchoge.png` |
| `endurance` (P2) | female | `Paula Radcliffe.png` | `../../assets/pixel/Paula Radcliffe.png` |
| `fighter` (P2) | male | `Conor McGregor.png` | `../../assets/pixel/Conor McGregor.png` |
| `fighter` (P2) | female | `Ronda Rousey.png` | `../../assets/pixel/Ronda Rousey.png` |

> **주의**: Metro bundler는 `require()` 경로를 빌드 타임에 정적으로 분석한다.
> 공백이 포함된 경로는 정적 `require()` 문자열 리터럴로만 허용되므로,
> `FITNESS_TYPE_IMAGE_MAP`의 모든 항목을 개별 `require()` 호출로 인라인 작성해야 한다.
> 변수/함수로 경로를 동적 조합하면 번들 오류 발생.

---

## 3. 데이터 구조

### 3.1 `pixel-character-config.ts` 신규 타입

```typescript
// 헬스 유형 ID — Phase 1 (6종), Phase 2에 endurance/fighter 추가
export type PixelVariantId =
  | 'powerlifter'    // 파워리프터형
  | 'bodybuilder'    // 보디빌더형 (구: mass_builder)
  | 'lean_athlete'   // 린 애슬릿형 (구: lean_body)
  | 'transformer'    // 트랜스포머형 (구: dieter)
  | 'calisthenics'   // 케리스테닉스형
  | 'wellness';      // 웰니스형
  // Phase 2: | 'endurance' | 'fighter'

// 성별 변형 — assignFitnessType()이 반환, 이미지/콘텐츠 선택에 사용
export type FitnessTypeGenderVariant = 'male' | 'female' | 'neutral';

// 유명인 콘텐츠 단위
export interface FitnessTypeCelebrity {
  name: string;         // "에디 홀"
  nameEn: string;       // "Eddie Hall"
  headline: string;     // "당신은 에디 홀형이에요."
  celebIntro: string;   // 유명인 소개 (2-3문장)
  typeStory: string;    // 이 유형의 이야기 (2-3문장)
  traits: [string, string, string]; // 이런 특징이 있어요 (정확히 3개)
  trainingTip: string;  // 운동 방향
  dietTip: string;      // 식단 방향
}

// 유형별 콘텐츠 (male/female 둘 다 포함 — Phase 1 6종 모두)
export interface FitnessTypeContent {
  id: PixelVariantId;
  label: string;              // "파워리프터형"
  male: FitnessTypeCelebrity;
  female: FitnessTypeCelebrity;
}
```

### 3.2 이미지 맵 구조 (PIXEL_IMAGE_MAP 대체)

```typescript
// 성별 → 이미지 소스 맵
export type FitnessTypeImageVariants = {
  male?: ReturnType<typeof require>;
  female?: ReturnType<typeof require>;
  neutral?: ReturnType<typeof require>;
};

// 유형 ID → 성별 → 이미지
export const FITNESS_TYPE_IMAGE_MAP: Record<PixelVariantId, FitnessTypeImageVariants> = {
  powerlifter: {
    male:   require('../../assets/pixel/Eddie Hall.png'),
    female: require('../../assets/pixel/Stefi Cohen.png'),
  },
  bodybuilder: {
    male:   require('../../assets/pixel/Chris Bumstead.png'),
    female: require('../../assets/pixel/Iris Kyle.png'),
  },
  lean_athlete: {
    male:   require('../../assets/pixel/Zac Efron.png'),
    female: require('../../assets/pixel/Kayla Itsines.png'),
  },
  transformer: {
    male:   require('../../assets/pixel/Chris Pratt.png'),
    female: require('../../assets/pixel/Adele.png'),
  },
  calisthenics: {
    male:   require('../../assets/pixel/Chris Heria.png'),
    female: require('../../assets/pixel/Chloe Ting.png'),
  },
  wellness: {
    male:   require('../../assets/pixel/Daniel Craig.png'),
    female: require('../../assets/pixel/Jennifer Aniston.png'),
  },
};

// 헬퍼: 유형+성별로 이미지 소스 반환 (없으면 male 폴백)
export function getFitnessTypeImage(
  typeId: PixelVariantId,
  genderVariant: FitnessTypeGenderVariant,
) {
  const variants = FITNESS_TYPE_IMAGE_MAP[typeId];
  if (!variants) return null;
  return variants[genderVariant as 'male' | 'female'] ?? variants.male ?? null;
}

// 헬퍼: 유형+성별로 콘텐츠 반환 (없으면 male 폴백)
export function getFitnessTypeContent(
  typeId: PixelVariantId,
  genderVariant: FitnessTypeGenderVariant,
): FitnessTypeCelebrity {
  const content = FITNESS_TYPE_CONTENT[typeId];
  if (genderVariant === 'female' && content.female) return content.female;
  return content.male;
}
```

### 3.3 `CharacterLevelMeta` 변경 (assetNum 제거)

```typescript
export interface CharacterLevelMeta {
  id: CharacterLevelId;
  // assetNum: number; ← 삭제
  nickname: string;
  name: string;
  vibe: string;
  description: string;
  surveyMax: boolean;
}
```

### 3.4 레거시 마이그레이션 맵

```typescript
// ai-plan-store.ts rehydrate 시 구버전 variantId 자동 교체
export const LEGACY_VARIANT_ID_MAP: Record<string, PixelVariantId> = {
  mass_builder: 'bodybuilder',
  lean_body: 'lean_athlete',
  dieter: 'transformer',
  powerlifter: 'powerlifter',
  calisthenics: 'calisthenics',
  wellness: 'wellness',
};

export function normalizeLegacyVariantId(id: string): PixelVariantId {
  return (LEGACY_VARIANT_ID_MAP[id] as PixelVariantId) ?? 'wellness';
}
```

### 3.5 `SurveyLevelResult` 변경

```typescript
export interface SurveyLevelResult {
  // ... 기존 필드 유지 ...
  /** 헬스 유형 ID (구: variantId — 하위 호환 필드명 유지) */
  variantId: PixelVariantId;
  /** 성별 변형 — 이미지/콘텐츠 선택에 사용 (신규) */
  genderVariant: FitnessTypeGenderVariant;
  archetypeId: CharacterArchetypeId;
}
```

---

## 4. 파일별 구현 명세

### 4.1 `src/lib/pixel-character-config.ts` (전면 재작성)

**유지**:
- `CharacterLevelId` 타입 (10단계, 변경 없음)
- `CharacterArchetypeId` 타입 (AI 플랜 연동, 변경 없음 — `mass_builder`/`lean_body`/`dieter` 값 그대로)
- `CHARACTER_LEVELS` 배열 (assetNum 필드만 제거)
- `ARCHETYPE_META` (기존값 유지)
- `DEFAULT_PIXEL_VARIANT = 'wellness'`

**삭제**:
- `PIXEL_IMAGE_MAP`
- `LEVEL_TO_ASSET_NUM`
- `CharacterLevelMeta.assetNum` 필드
- `PixelVariantMeta` 인터페이스 → `FitnessTypeContent`로 대체
- `PIXEL_VARIANT_META` → `FITNESS_TYPE_CONTENT`로 대체

**신규 추가**:
- `FitnessTypeGenderVariant` 타입
- `FitnessTypeCelebrity` 인터페이스
- `FitnessTypeContent` 인터페이스
- `FitnessTypeImageVariants` 타입
- `FITNESS_TYPE_IMAGE_MAP` (정적 require 12개)
- `FITNESS_TYPE_CONTENT` (6유형 × 2성별 = 12개 celebrity 데이터)
- `LEGACY_VARIANT_ID_MAP`
- `getFitnessTypeImage()` 헬퍼
- `getFitnessTypeContent()` 헬퍼
- `normalizeLegacyVariantId()` 헬퍼

**`FITNESS_TYPE_CONTENT` 전체 데이터**:

```typescript
export const FITNESS_TYPE_CONTENT: Record<PixelVariantId, FitnessTypeContent> = {
  powerlifter: {
    id: 'powerlifter',
    label: '파워리프터형',
    male: {
      name: '에디 홀', nameEn: 'Eddie Hall',
      headline: '당신은 에디 홀형이에요.',
      celebIntro: '에디 홀은 2017년 세계 최강자 대회(World\'s Strongest Man)에서 우승했고, 인류 최초로 데드리프트 500kg에 성공한 선수입니다. 훈련 중 혈관이 터져 실신한 적도 있을 만큼 한계를 무시하는 훈련으로 유명해요. 별명은 "The Beast".',
      typeStory: '숫자가 곧 실력입니다. 오늘 스쿼트 PR은 얼마인지, 데드리프트가 지난주보다 올랐는지가 훈련의 이유가 되는 타입이에요. 볼륨보다 강도, 많이 하는 것보다 무겁게 — 3대 운동이 삶의 중심입니다.',
      traits: ['헬스장에서 기록을 깨는 날이 최고의 날', '보조 운동보다 메인 리프트에 집중', '회복이 훈련만큼 진지한 루틴'],
      trainingTip: '스쿼트·벤치·데드리프트 3대 운동 중심. 세트당 1~5회, 고중량 저반복. 보조 운동은 필요한 것만 선택적으로. 주 3~4회, 회복 포함.',
      dietTip: '칼로리는 유지 또는 소폭 흑자. 단백질 체중 × 2g 이상 필수. 극단적인 감량은 금물 — 힘이 빠지면 기록도 떨어집니다.',
    },
    female: {
      name: '스테피 코헨', nameEn: 'Stefi Cohen',
      headline: '당신은 스테피 코헨형이에요.',
      celebIntro: '스테피 코헨은 베네수엘라 출신 파워리프터로, 18개 이상의 세계기록을 가지고 있으면서 동시에 카이로프랙틱 의사입니다. 52kg 체급에서 스쿼트 201kg을 소화하는, 체중 대비 세계 최강의 리프터예요.',
      typeStory: '체급이나 외모가 아니라 숫자로 증명합니다. 작아 보여도 무거운 걸 드는 순간, 모두가 다시 보게 되는 타입이에요. 지식과 기술을 더해 훈련을 정밀하게 설계하는 걸 즐깁니다.',
      traits: ['체급 대비 근력이 강점', '기록과 데이터로 진행 상황을 추적', '훈련 프로그램을 깊이 이해하고 따름'],
      trainingTip: '3대 운동 중심, 1~5회 저반복. 테크닉과 폼을 먼저 완성하고 중량 진행. 보조 운동은 약점 부위 보완 중심.',
      dietTip: '칼로리 유지 또는 소폭 흑자. 단백질 체중 × 2g. 훈련 전 탄수화물로 퍼포먼스 확보.',
    },
  },
  bodybuilder: {
    id: 'bodybuilder',
    label: '보디빌더형',
    male: {
      name: 'CBum', nameEn: 'Chris Bumstead',
      headline: '당신은 CBum형이에요.',
      celebIntro: '크리스 범스테드(CBum)는 2019년부터 6회 연속 클래식 피지크 미스터 올림피아 챔피언입니다. 아놀드 시대의 넓은 어깨와 좁은 허리를 현대적으로 재해석한 체형으로, 현재 보디빌딩 인플루언서 중 전 세계 팔로워 수 1위예요.',
      typeStory: '근육이 자라는 과정 자체가 재미있는 타입입니다. 어깨 너비가 넓어지고, 팔이 두꺼워지고, 등이 넓어지는 거울 속 변화가 훈련의 이유가 돼요. 벌크와 컷을 의도적으로 반복하며 체형을 조각합니다.',
      traits: ['부위별 성장을 꼼꼼하게 체크하는 타입', '보디빌딩 분할 루틴에 자연스럽게 맞음', '식단도 훈련만큼 진지하게 관리'],
      trainingTip: '부위별 분할 훈련(PPL, 4~6분할). 8~12회 근비대 범위. 컴파운드 운동으로 기반 만들고, 아이솔레이션으로 마무리. 주 4~6회.',
      dietTip: '벌크 시기엔 칼로리 소폭 흑자(200~500kcal). 단백질 체중 × 2~2.5g. 탄수화물은 운동 전후 집중 배치.',
    },
    female: {
      name: '아이리스 카일', nameEn: 'Iris Kyle',
      headline: '당신은 아이리스 카일형이에요.',
      celebIntro: '아이리스 카일은 미스 올림피아를 10번 수상한, 여성 보디빌딩 역사상 가장 많은 타이틀을 보유한 선수입니다. 30년 가까이 꾸준히 무대에 서며 "흔들리지 않는 일관성"으로 업계의 기준이 된 레전드예요.',
      typeStory: '몸을 만드는 과정을 프로젝트처럼 접근합니다. 부위별로 목표를 세우고, 그 성장을 기록하며, 체계적으로 완성도를 높여가는 타입이에요. 꾸준함이 곧 최고의 전략입니다.',
      traits: ['장기적인 계획으로 체형을 설계', '분할 훈련에 친숙하고 부위별 집중 가능', '식단 관리를 루틴의 일부로 자연스럽게 받아들임'],
      trainingTip: '부위별 분할. 8~12회 근비대 범위 중심. 전신 균형 발달에 주의하며, 취약 부위는 추가 볼륨. 주 4~5회.',
      dietTip: '시즌별 벌크/컷 전략. 단백질 체중 × 2g 기준 유지. 식이섬유 충분히 챙기면 포만감과 회복 모두 잡을 수 있어요.',
    },
  },
  lean_athlete: {
    id: 'lean_athlete',
    label: '린 애슬릿형',
    male: {
      name: '잭 에프론', nameEn: 'Zac Efron',
      headline: '당신은 잭 에프론형이에요.',
      celebIntro: '잭 에프론은 베이워치·가장 위대한 쇼맨·아이언 클로 준비 과정에서 매번 완전히 다른 체형으로 변신하며 화제가 됐습니다. 과도한 bulk 없이 기능적이고 선명한 체형 — 린 애슬릿형의 교과서예요.',
      typeStory: '크기보다 밀도, 무게보다 선명함이 목표입니다. 근육은 있지만 무겁지 않고, 보기 좋으면서도 움직임이 자유로운 체형을 지향해요. 운동과 식단을 정교하게 조율하는 걸 즐기는 타입입니다.',
      traits: ['체지방 관리와 근육 유지를 동시에 신경 씀', '기능적 움직임과 미적 완성도 모두 중시', '훈련 일관성과 식단 정밀도가 강점'],
      trainingTip: '복합 동작 중심, 중간 반복(8~12회). 유산소와 저항 훈련 균형 있게. 서킷 스타일 병행으로 체지방 연소 최적화. 주 4~5회.',
      dietTip: '칼로리 유지 또는 소폭 적자. 단백질 체중 × 2g. 채소와 통곡물로 포만감 유지. 탄수화물은 운동 전후 중심.',
    },
    female: {
      name: '카일라 이트사인스', nameEn: 'Kayla Itsines',
      headline: '당신은 카일라 이트사인스형이에요.',
      celebIntro: '카일라 이트사인스는 BBG(Bikini Body Guide) 프로그램을 만들어 전 세계 수백만 명의 운동 방식을 바꾼 호주 출신 피트니스 코치입니다. "특정 체형이 목표가 아니라, 건강하고 강한 몸이 목표"라는 메시지로 유명해요.',
      typeStory: '운동을 삶의 일부로 자연스럽게 녹여내는 타입입니다. 극단적인 방법보다 꾸준히 유지할 수 있는 방식으로, 체형과 체력을 함께 끌어올려요. 서킷 트레이닝과 저항 운동의 조합이 잘 맞습니다.',
      traits: ['체중보다 체성분과 체력에 집중', '일상에서 지속 가능한 루틴을 선호', '운동과 식단의 균형감이 자연스러움'],
      trainingTip: '저항 운동 + 유산소 서킷. 전신 위주 또는 상/하체 분할. 체중 운동과 웨이트 병행. 주 3~5회.',
      dietTip: '칼로리 집착보다 식품 품질이 먼저. 단백질 충분히, 채소 풍부하게. 지속 가능한 패턴이 단기 다이어트보다 훨씬 효과적입니다.',
    },
  },
  transformer: {
    id: 'transformer',
    label: '트랜스포머형',
    male: {
      name: '크리스 프랫', nameEn: 'Chris Pratt',
      headline: '당신은 크리스 프랫형이에요.',
      celebIntro: '크리스 프랫은 파크스 앤 레크리에이션에서 통통 캐릭터로 사랑받다가, 가디언즈 오브 갤럭시 주연을 맡기 위해 6개월 만에 28kg을 감량하고 근육을 동시에 붙이는 전설적인 변신을 해냈습니다. "불가능은 없다"를 몸소 증명한 사람이에요.',
      typeStory: '결심이 서면 해내는 타입입니다. 지금 체형이 어떻든, 목표를 정하면 그 방향으로 움직이기 시작해요. 빠른 결과보다 확실한 변화를 만들겠다는 의지가 가장 큰 자원입니다.',
      traits: ['강한 동기 부여가 있을 때 변화가 빠름', '체중 감량과 근육 유지를 동시에 원함', '루틴이 잡히면 꾸준해지는 타입'],
      trainingTip: '저항 운동 + 유산소 조합. 체중 감량 시 근육 손실 최소화가 핵심. 전신 서킷 또는 상/하체 분할. 주 3~5회.',
      dietTip: '칼로리 적자(-300~500kcal)가 핵심. 단백질 체중 × 1.8~2g으로 근육 보호. 단식보다 균형 잡힌 식단이 지속성이 훨씬 높아요.',
    },
    female: {
      name: '아델', nameEn: 'Adele',
      headline: '당신은 아델형이에요.',
      celebIntro: '아델은 전 세계에서 가장 많이 팔린 앨범을 보유한 팝 아티스트이자, 동시에 가장 유명한 체형 변화 스토리의 주인공입니다. 2020년 이후 드라마틱하게 달라진 모습으로 모두를 놀라게 했지만, 그녀가 강조한 건 다이어트가 아닌 건강이었어요.',
      typeStory: '남들의 시선보다 자신의 건강과 에너지를 위해 움직이는 타입입니다. 외부 압박이 아닌 내적 동기로 시작한 변화는 훨씬 오래갑니다. 꾸준함과 자기 결정이 가장 강한 무기예요.',
      traits: ['건강과 에너지 수준 향상이 진짜 동기', '극단적 방법보다 지속 가능한 변화를 선호', '과정을 즐기면 결과가 따라옴을 알고 있음'],
      trainingTip: '즐길 수 있는 운동에서 시작. 걷기, 수영, 요가, 웨이트 어느 것이든 OK. 주 3~4회. 무리하지 않고 꾸준히 쌓는 것이 핵심.',
      dietTip: '엄격한 다이어트 식단보다 좋은 식품으로 채우는 접근법이 맞아요. 칼로리 소폭 적자, 단백질 충분히, 설탕·초가공식품 줄이기.',
    },
  },
  calisthenics: {
    id: 'calisthenics',
    label: '케리스테닉스형',
    male: {
      name: '크리스 헤리아', nameEn: 'Chris Heria',
      headline: '당신은 크리스 헤리아형이에요.',
      celebIntro: '크리스 헤리아는 THENX의 설립자이자 유튜브 구독자 900만 이상의 케리스테닉스 1인자입니다. 헬스장 한 번 없이 철봉 하나로 보디빌더 부럽지 않은 체형을 만들었어요. "장비가 없어도 강해질 수 있다"를 전 세계에 증명한 사람이에요.',
      typeStory: '기구가 아닌 몸 자체를 컨트롤하는 것이 진짜 실력입니다. 머슬업, 플란체, 핸드스탠드 — 스킬 무브 하나를 완성할 때의 성취감이 최고의 동기부여가 되는 타입이에요.',
      traits: ['기구 없이도 충분히 강해질 수 있다는 철학', '기술적 움직임과 신체 컨트롤에 관심이 높음', '어디서든 운동할 수 있는 자유로운 훈련 스타일'],
      trainingTip: '맨몸 기본기(풀업·딥스·푸시업) 완성 → 머슬업·플란체·L-sit 등 고난도 스킬로 발전. 반복과 꾸준한 스킬 연습이 핵심.',
      dietTip: '체중 대비 근력이 핵심이므로 과도한 벌크는 비효율적. 칼로리 유지 또는 소폭 흑자. 단백질 체중 × 1.8~2g.',
    },
    female: {
      name: '클로이 팅', nameEn: 'Chloe Ting',
      headline: '당신은 클로이 팅형이에요.',
      celebIntro: '클로이 팅은 유튜브 구독자 2,500만을 넘는 바디웨이트 피트니스의 아이콘입니다. 기구 없이, 좁은 공간에서, 누구나 따라 할 수 있는 케리스테닉스 루틴으로 전 세계에 홈 트레이닝 붐을 만들어낸 인물이에요.',
      typeStory: '장비도, 넓은 공간도 필요 없어요. 내 몸 하나면 충분합니다. 처음엔 어렵게만 느껴지던 동작이 어느 순간 자연스러워지는 그 감각 — 몸이 조금씩 달라진다는 걸 느끼는 게 가장 큰 보람이 되는 타입이에요.',
      traits: ['꾸준한 루틴과 성취감으로 동기를 유지', '복잡한 도구 없이 집 또는 야외에서 훈련', '체력과 유연성이 함께 느는 훈련 방식을 선호'],
      trainingTip: '푸시업·스쿼트·코어 기본기부터 시작. 점진적 강도 업 → 버피·플랭크 변형·점프 스쿼트 등으로 루틴 다양화. 주 4~5회.',
      dietTip: '체중 부담 없이 기능을 키우는 게 목표. 탄수화물+단백질 균형 잡힌 식단, 폭식이나 극단적 제한 없이 일관된 식습관 유지.',
    },
  },
  wellness: {
    id: 'wellness',
    label: '웰니스형',
    male: {
      name: '다니엘 크레이그', nameEn: 'Daniel Craig',
      headline: '당신은 다니엘 크레이그형이에요.',
      celebIntro: '다니엘 크레이그는 제임스 본드 역을 맡기 위해 40대 중반에 완벽한 체형을 만들었고, 50대까지도 과도하지 않은 균형 잡힌 훈련으로 꾸준히 유지했습니다. 극단적인 bulk나 cut 없이 기능적이고 건강한 체형을 오래 유지하는 것 — 웰니스형의 정석이에요.',
      typeStory: '오래 건강한 것이 목표입니다. 단기 변화보다 10년 후에도 활동적인 몸을 유지하는 것이 진짜 성공이에요. 운동은 스트레스 해소와 컨디션 관리의 수단이 되고, 삶의 질이 올라가는 걸 느낍니다.',
      traits: ['지속 가능한 루틴을 선호', '극단적 방법보다 균형 잡힌 접근', '운동이 스트레스 해소와 에너지 충전의 역할'],
      trainingTip: '주 3~4회, 즐길 수 있는 활동 중심. 가벼운 웨이트, 수영, 조깅, 요가 어느 것이든. 꾸준함이 강도보다 훨씬 중요합니다.',
      dietTip: '칼로리 집착보다 식품 품질이 우선. 채소·과일·단백질·통곡물의 균형. 지속 가능하게 먹을 수 있는 패턴이 핵심이에요.',
    },
    female: {
      name: '제니퍼 애니스턴', nameEn: 'Jennifer Aniston',
      headline: '당신은 제니퍼 애니스턴형이에요.',
      celebIntro: '제니퍼 애니스턴은 수십 년째 건강하고 꾸준한 체형을 유지하는 할리우드 스타입니다. 요가, 러닝, 필라테스를 꾸준히 병행하며 나이와 관계없이 활동적인 라이프스타일을 유지하는 것으로 유명해요.',
      typeStory: '건강은 이벤트가 아니라 라이프스타일입니다. 트렌드에 흔들리지 않고, 자신에게 맞는 루틴을 꾸준히 이어가는 타입이에요. 몸도 마음도 좋은 상태를 오래 유지하는 것이 최고의 목표입니다.',
      traits: ['운동과 식단을 라이프스타일로 접근', '극단적인 방법보다 습관과 꾸준함이 강점', '나이와 관계없이 건강하게 유지하는 것이 가장 큰 동기'],
      trainingTip: '요가, 필라테스, 조깅, 가벼운 웨이트 조합. 유연성과 심폐, 근력을 고루 챙기는 접근. 주 3~5회, 부담 없이.',
      dietTip: '자연 식품 중심, 과도한 가공식품 줄이기. 식사 타이밍보다 음식의 질이 우선. 세끼 균형 식단이 지속성이 높아요.',
    },
  },
};
```

---

### 4.2 `src/lib/ai-level-classifier.ts`

**변경 내용**:

1. import 추가: `FitnessTypeGenderVariant`, `getFitnessTypeContent`
2. `assignPixelVariant()` → `assignFitnessType()` 리네임
3. `assignFitnessType()` 반환값 변경: `PixelVariantId` → `{ typeId: PixelVariantId; genderVariant: FitnessTypeGenderVariant }`
4. `SurveyLevelResult` 인터페이스에 `genderVariant: FitnessTypeGenderVariant` 추가
5. `classifySurveyLevel()` 내 호출부 수정

```typescript
// 변경 전
export function assignPixelVariant(
  gender: AIGender,
  goal: OnboardingData['goal'],
  gymType: GymType,
): PixelVariantId { ... }

// 변경 후 — 내부 로직 동일, 반환값 확장
export function assignFitnessType(
  gender: AIGender,
  goal: OnboardingData['goal'],
  gymType: GymType,
): { typeId: PixelVariantId; genderVariant: FitnessTypeGenderVariant } {
  const genderVariant: FitnessTypeGenderVariant =
    gender === 'female' ? 'female' : 'male';

  // 기존 분기 로직 그대로 (반환값만 typeId로 변경)
  if (gymType === 'bodyweight') return { typeId: 'calisthenics', genderVariant };
  if (goal === 'strength_gain' && POWER_GYM_TYPES.has(gymType)) return { typeId: 'powerlifter', genderVariant };
  if (goal === 'muscle_gain' && gymType === 'full_gym') return { typeId: 'bodybuilder', genderVariant };
  if (goal === 'lean_bulk') return { typeId: 'lean_athlete', genderVariant };
  if (goal === 'muscle_gain') return { typeId: 'lean_athlete', genderVariant };
  if (goal === 'weight_loss') return { typeId: 'transformer', genderVariant };
  if (goal === 'maintenance') return { typeId: 'wellness', genderVariant };
  return { typeId: 'wellness', genderVariant };
}
```

**`classifySurveyLevel()` 수정**:

```typescript
// 변경 전
const variantId = assignPixelVariant(data.gender, data.goal, data.gymType);
const variantMeta = PIXEL_VARIANT_META[variantId];
return { ..., variantId, typeName: variantMeta.label };

// 변경 후
const { typeId, genderVariant } = assignFitnessType(data.gender, data.goal, data.gymType);
const celebContent = getFitnessTypeContent(typeId, genderVariant);
return {
  ...,
  variantId: typeId,      // 필드명 유지 (하위 호환)
  genderVariant,          // 신규
  typeName: celebContent.headline,  // "당신은 에디 홀형이에요."
};
```

---

### 4.3 `src/screens/ai/ai-level-result-screen.tsx` (레이아웃 교체)

**유지하는 것**:
- 컴포넌트 함수명, navigation 구조, route params
- AI 플랜 생성 로직 (`handleCreatePlan`)
- 공유 로직 (`handleShare`, `shareCardRef`, `ViewShot`)
- 익명 사용자 분기 (`isAnonymousUser`)
- CTA 버튼 구조 (레이블/액션 동일)

**제거하는 것**:
- `PIXEL_IMAGE_MAP` import → `getFitnessTypeImage`, `getFitnessTypeContent` import로 교체
- `PIXEL_VARIANT_META` import 제거
- `variantMeta` useMemo → `celebContent` useMemo로 교체
- 기존 `variantCard` 섹션 (shortReason/detailReason)

**이미지/콘텐츠 계산**:

```typescript
import { getFitnessTypeImage, getFitnessTypeContent, DEFAULT_PIXEL_VARIANT } from '../../lib/pixel-character-config';

const imageSource = useMemo(() => {
  if (!surveyLevelResult) return null;
  return getFitnessTypeImage(
    surveyLevelResult.variantId ?? DEFAULT_PIXEL_VARIANT,
    surveyLevelResult.genderVariant ?? 'male',
  );
}, [surveyLevelResult]);

const celebContent = useMemo(() => {
  if (!surveyLevelResult) return null;
  return getFitnessTypeContent(
    surveyLevelResult.variantId ?? DEFAULT_PIXEL_VARIANT,
    surveyLevelResult.genderVariant ?? 'male',
  );
}, [surveyLevelResult]);
```

**새 콘텐츠 섹션 렌더링 (기존 `variantCard` 대체)**:

```tsx
{/* 유형 헤드라인 */}
<Text style={styles.title}>{celebContent?.headline}</Text>

{/* 레벨 배지 (헤드라인 아래로 이동) */}
<View style={styles.levelBadge}>
  <Text style={styles.levelBadgeText}>{surveyLevelResult.levelName}</Text>
</View>

{/* 유명인 소개 */}
<View style={styles.sectionCard}>
  <Text style={styles.sectionLabel}>이런 분이에요</Text>
  <Text style={styles.sectionBody}>{celebContent?.celebIntro}</Text>
</View>

{/* 이 유형의 이야기 */}
<View style={styles.sectionCard}>
  <Text style={styles.sectionLabel}>이 유형의 이야기</Text>
  <Text style={styles.sectionBody}>{celebContent?.typeStory}</Text>
</View>

{/* 특징 3개 */}
<View style={styles.sectionCard}>
  <Text style={styles.sectionLabel}>이런 특징이 있어요</Text>
  {celebContent?.traits.map((trait, i) => (
    <Text key={i} style={styles.traitText}>✓ {trait}</Text>
  ))}
</View>

{/* 운동/식단 방향 */}
<View style={styles.tipsRow}>
  <View style={[styles.tipCard, { flex: 1 }]}>
    <Text style={styles.tipLabel}>운동 방향</Text>
    <Text style={styles.tipBody}>{celebContent?.trainingTip}</Text>
  </View>
  <View style={[styles.tipCard, { flex: 1 }]}>
    <Text style={styles.tipLabel}>식단 방향</Text>
    <Text style={styles.tipBody}>{celebContent?.dietTip}</Text>
  </View>
</View>
```

**공유 카드 텍스트 업데이트**:

```tsx
// 공유 메시지: levelName 대신 headline 사용
buildShareMessage({
  levelName: celebContent?.headline,   // "당신은 에디 홀형이에요."
  typeName: null,
  summary: celebContent?.typeStory?.split('.')[0] ?? '',
  shareUrl,
})
```

---

### 4.4 `src/components/home/pixel-evolution-card.tsx` (단순화)

**제거할 코드 블록**:

1. `PixelLevelViewer` 함수 컴포넌트 전체 (line ~139~270)
2. `Image`, `Modal`, `Pressable`, `FlatList`, `useWindowDimensions` import
3. `PIXEL_IMAGE_MAP`, `getHealthLevelContent` import
4. `viewerOpen` useState
5. "현재 단계 보기" TouchableOpacity 버튼 (line ~390~402)
6. `<PixelLevelViewer ... />` JSX (두 군데)
7. Viewer 전용 styles: `modalBackdrop`, `modalSheet`, `modalHandle`, `modalHeader`, `modalHeaderCopy`, `modalTitle`, `modalSubtitle`, `closeButton`, `slide`, `slideCard`, `slideHeader`, `slideTitleWrap`, `slideLevel`, `slideNickname`, `currentBadge`, `currentBadgeText`, `slideImageWrap`, `slideImage`, `slideDescriptionScroll`, `slideDescriptionContent`, `slideDescription`, `slideTipTitle`, `slideTipBody`

**유지할 것**: 메인 카드 구조 (`emptyState`, `headerRow`, `InfoBlock` 3개, `ctaButton`) 그대로 유지. `archetypeId` prop과 `archetypeMeta` 배지도 제거 (Plan: 레벨 배지+이름만).

---

### 4.5 `src/screens/ai/fitness-type-test-screen.tsx` (신규)

**5문항 옵션 매핑**:

```typescript
// goal 매핑
const GOAL_OPTIONS = [
  { label: '체중 감량', value: 'weight_loss' as const },
  { label: '근비대 (크게)', value: 'muscle_gain' as const },
  { label: '근력 향상 (강하게)', value: 'strength_gain' as const },
  { label: '린매스 (선명하게)', value: 'lean_bulk' as const },
  { label: '건강 유지', value: 'maintenance' as const },
  { label: '맨몸 기술', value: 'maintenance' as const },  // bodyweight gymType으로 보완
];

// gymType 매핑
const GYM_OPTIONS = [
  { label: '풀 헬스장', value: 'full_gym' as const },
  { label: '홈짐 / 파워랙', value: 'garage_gym' as const },
  { label: '덤벨만', value: 'dumbbell_only' as const },
  { label: '기구 없이 (맨몸)', value: 'bodyweight' as const },
];

// experience 매핑
const EXPERIENCE_OPTIONS = [
  { label: '이제 막 시작', value: 'beginner' as const },
  { label: '조금 해봤어요', value: 'novice' as const },
  { label: '어느 정도 돼요', value: 'intermediate' as const },
  { label: '꽤 됐어요', value: 'upper_intermediate' as const },
  { label: '오래됐어요', value: 'advanced' as const },
];

// workoutDaysPerWeek 매핑
const FREQUENCY_OPTIONS = [
  { label: '주 1~2일', value: 1 },
  { label: '주 3일', value: 3 },
  { label: '주 4~5일', value: 4 },
  { label: '주 6일 이상', value: 6 },
];

// gender 매핑
const GENDER_OPTIONS = [
  { label: '남성', value: 'male' as const },
  { label: '여성', value: 'female' as const },
  { label: '선택 안 함', value: 'prefer_not_to_say' as const },
];
```

**완료 시 처리**:

```typescript
import { classifySurveyLevel } from '../../lib/ai-level-classifier';
import { useAIPlanStore } from '../../stores/ai-plan-store';

const handleComplete = () => {
  const fullData: OnboardingData = {
    goal: answers.goal,
    gymType: answers.gymType,
    experience: answers.experience,
    workoutDaysPerWeek: answers.frequency,
    gender: answers.gender,
    // AI 플랜용 기본값 (나중에 온보딩에서 보완)
    recoveryLevel: 'normal',
    sleepQuality: 'average',
    plateauHistory: null,
    strengthProfile: [],
    primaryStrengthFocus: null,
  };

  const result = classifySurveyLevel(fullData);
  const store = useAIPlanStore.getState();
  store.setOnboardingData(fullData);
  store.setSurveyLevelResult(result);

  navigation.replace('AILevelResult', { entry: 'direct' });
};
```

---

### 4.6 `src/types/navigation.ts`

```typescript
// RootStackParamList 양쪽 모두에 추가
FitnessTypeTest: undefined;
```

---

### 4.7 `src/navigation/root-navigator.tsx`

```typescript
import FitnessTypeTestScreen from '../screens/ai/fitness-type-test-screen';

// Stack.Navigator 내부에 추가 (AIConsent, AIOnboarding과 같은 그룹)
<Stack.Screen
  name="FitnessTypeTest"
  component={FitnessTypeTestScreen}
  options={{ presentation: 'modal', headerShown: false }}
/>
```

---

### 4.8 레거시 마이그레이션 위치

**`src/stores/ai-plan-store.ts`** — `setSurveyLevelResult()` 또는 rehydrate 시 구버전 variantId 자동 교체:

```typescript
import { normalizeLegacyVariantId } from '../lib/pixel-character-config';

// setSurveyLevelResult 내부 또는 persist migrate에 추가
if (result?.variantId) {
  result.variantId = normalizeLegacyVariantId(result.variantId);
}
```

---

## 5. 연결 검증 포인트

구현 완료 후 grep으로 확인:

```bash
# 구버전 PixelVariantId 참조 (0이어야 함)
grep -r "'mass_builder'\|'lean_body'\|'dieter'" src/ --include="*.ts" --include="*.tsx"

# PIXEL_IMAGE_MAP 참조 (0이어야 함)
grep -r "PIXEL_IMAGE_MAP" src/ --include="*.ts" --include="*.tsx"

# assignPixelVariant 참조 (0이어야 함)
grep -r "assignPixelVariant" src/ --include="*.ts" --include="*.tsx"

# PIXEL_VARIANT_META 참조 (0이어야 함)
grep -r "PIXEL_VARIANT_META" src/ --include="*.ts" --include="*.tsx"
```

---

## 6. 성공 기준

| 기준 | 확인 방법 |
|------|-----------|
| `npx tsc --noEmit` 통과 | CLI 실행 |
| 홈 레벨 카드에 이미지·모달 없음 | 시뮬레이터 확인 |
| 유형 결과 화면에 유명인 헤드라인 표시 | `celebContent.headline` 렌더링 |
| 독립 유형 테스트 5문항 진입 가능 | `FitnessTypeTest` 라우트 동작 |
| 기존 `mass_builder` → `bodybuilder` 자동 변환 | 마이그레이션 함수 |
| 구버전 `PixelVariantId` 참조 0개 | grep 검증 |

---

## 7. 구현 가이드

### 7.1 Module Map

| 모듈 | 파일 | 작업 내용 | 예상 규모 |
|------|------|-----------|-----------|
| Module 1 | `pixel-character-config.ts` | 전면 재작성 (Celebrity 데이터 + 이미지맵 + 헬퍼) | ~350줄 |
| Module 2 | `ai-level-classifier.ts` | assignFitnessType 리네임 + genderVariant 추가 | ~30줄 변경 |
| Module 3 | `ai-level-result-screen.tsx` | 유명인 레이아웃으로 교체 | ~150줄 변경 |
| Module 4 | `pixel-evolution-card.tsx` | PixelLevelViewer 제거 + 단순화 | ~250줄 제거 |
| Module 5 | `fitness-type-test-screen.tsx` + navigation | 5문항 플로우 신규 + 라우트 등록 | ~200줄 신규 |

### 7.2 구현 순서

```
Module 1 (데이터 레이어 기반)
  → Module 2 (분류 로직, Module 1 의존)
  → Module 3 + Module 4 병렬 가능 (UI, Module 1+2 의존)
  → Module 5 (신규 플로우, Module 1+2 의존)
```

### 7.3 Session Guide

| 세션 | 모듈 | 목표 |
|------|------|------|
| Session 1 | Module 1 + 2 | 데이터 레이어 완성. `npx tsc --noEmit` 통과 확인 |
| Session 2 | Module 3 + 4 | 유형 결과 화면 + 홈 카드 UI 전환 |
| Session 3 | Module 5 | 독립 유형 테스트 플로우 + 내비게이션 등록 |
