# Design: pixel-character-system

**작성일**: 2026-04-02  
**아키텍처**: Option C — 실용적 균형  
**상태**: Design 완료

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 햄식이 에셋 삭제로 인한 크래시 해결 + 성별·목표 기반 개인화 픽셀 캐릭터 시스템으로 업그레이드 |
| **WHO** | 신규/기존 사용자 모두. AI 온보딩 완료 사용자는 자동 배정, 미완료 사용자는 Quick Setup에서 gender 추가 선택 |
| **RISK** | HamsterLevelId 타입 교체 누락, AsyncStorage의 legacy levelId(challenger/ranker), require() 정적 경로 제약 |
| **SUCCESS** | hamster 경로 참조 0건, tsc 통과, 4 변형 올바른 노출, lv1~10 이미지 40개 정상 로드 |
| **SCOPE** | pixel-character-config.ts 신규 + persona-engine/classifier/store/component 교체. AI 플랜 생성 로직 무변경 |

---

## 1. 아키텍처 개요 (Option C)

```
pixel-character-config.ts (단일 설정 허브)
  ├── CharacterLevelId 타입 (10개)
  ├── PixelVariantId 타입 (4개)
  ├── CharacterArchetypeId 타입 (6개)
  ├── CHARACTER_LEVELS 배열 (레벨 메타)
  └── PIXEL_IMAGE_MAP (40개 정적 require)

ai-level-classifier.ts (배정 로직 통합)
  ├── assignPixelVariant(gender, goal, gymType) → PixelVariantId
  ├── classifyArchetype(goal, gymType, experience) → CharacterArchetypeId
  └── classifySurveyLevel() 반환값에 variantId + archetypeId 포함

persona-engine.ts (타입 교체)
  ├── HamsterLevelId → CharacterLevelId (import from config)
  ├── HAMSTER_LEVEL_META → CHARACTER_LEVEL_META
  └── LEVELS 배열: challenger·ranker 제거 (10개)

persona-store.ts (상태 확장)
  ├── variantId: PixelVariantId | null 추가
  ├── archetypeId: CharacterArchetypeId | null 추가
  └── persist version bump + legacy migrate (challenger→grandmaster, ranker→god)

pixel-evolution-card.tsx (신규 UI 컴포넌트)
  └── hamster-evolution-card.tsx 대체, variantId 기반 이미지 선택
```

---

## 2. 타입 정의

### 2.1 `src/lib/pixel-character-config.ts` (신규)

```typescript
// ─── 핵심 타입 ────────────────────────────────────────────────────────────────

export type CharacterLevelId =
  | 'beginner'
  | 'novice'
  | 'intermediate'
  | 'upper_intermediate'
  | 'advanced'
  | 'veteran'
  | 'artisan'
  | 'master'
  | 'grandmaster'
  | 'god';

export type PixelVariantId =
  | 'male-lightblue'
  | 'male-black'
  | 'female-pink'
  | 'female-white';

export type CharacterArchetypeId =
  | 'powerlifter'
  | 'mass_builder'
  | 'lean_body'
  | 'dieter'
  | 'wellness'
  | 'all_rounder';

// ─── 레벨 메타 ────────────────────────────────────────────────────────────────

export interface CharacterLevelMeta {
  id: CharacterLevelId;
  assetNum: number;       // 1~10 (파일명 매핑용)
  nickname: string;       // 예: '헬린이', '루키', '고인물'
  name: string;           // 예: '초심자', '초급자'
  vibe: string;
  description: string;
  surveyMax: boolean;     // lv6(veteran)까지만 true
}

export const CHARACTER_LEVELS: CharacterLevelMeta[] = [
  { id: 'beginner',          assetNum: 1,  nickname: '헬린이',    name: '초심자',   surveyMax: false, vibe: '첫 루틴을 시작한 픽셀', description: '...' },
  { id: 'novice',            assetNum: 2,  nickname: '루키',      name: '초급자',   surveyMax: false, vibe: '몸이 운동 리듬을 익히는 픽셀', description: '...' },
  { id: 'intermediate',      assetNum: 3,  nickname: '단련 중',   name: '중급자',   surveyMax: false, vibe: '운동이 일상에 들어온 픽셀', description: '...' },
  { id: 'upper_intermediate',assetNum: 4,  nickname: '준전문가',  name: '중상급자', surveyMax: false, vibe: '루틴이 꽤 안정된 픽셀', description: '...' },
  { id: 'advanced',          assetNum: 5,  nickname: '강철인',    name: '상급자',   surveyMax: false, vibe: '운동과 식단을 함께 챙기는 픽셀', description: '...' },
  { id: 'veteran',           assetNum: 6,  nickname: '고인물',    name: '고인물',   surveyMax: true,  vibe: '운동 냄새만 맡아도 몸이 반응하는 픽셀', description: '...' },
  { id: 'artisan',           assetNum: 7,  nickname: '달인',      name: '달인',     surveyMax: false, vibe: '꾸준함이 묵직해진 픽셀', description: '...' },
  { id: 'master',            assetNum: 8,  nickname: '마스터',    name: '마스터',   surveyMax: false, vibe: '루틴을 통제하는 픽셀', description: '...' },
  { id: 'grandmaster',       assetNum: 9,  nickname: '전설',      name: '그랜드마스터', surveyMax: false, vibe: '기록이 쌓여 존재감이 생긴 픽셀', description: '...' },
  { id: 'god',               assetNum: 10, nickname: '신의 경지', name: '신',       surveyMax: false, vibe: '루틴의 끝에 도달한 픽셀', description: '...' },
];

// ─── 에셋 맵 (40개 정적 require) ─────────────────────────────────────────────

export const PIXEL_IMAGE_MAP: Record<PixelVariantId, Record<CharacterLevelId, any>> = {
  'male-lightblue': {
    beginner:          require('../../assets/pixel/male/light-blue/lb_lv1.png'),
    novice:            require('../../assets/pixel/male/light-blue/lb_lv2.png'),
    intermediate:      require('../../assets/pixel/male/light-blue/lb_lv3.png'),
    upper_intermediate:require('../../assets/pixel/male/light-blue/lb_lv4.png'),
    advanced:          require('../../assets/pixel/male/light-blue/lb_lv5.png'),
    veteran:           require('../../assets/pixel/male/light-blue/lb_lv6.png'),
    artisan:           require('../../assets/pixel/male/light-blue/lb_lv7.png'),
    master:            require('../../assets/pixel/male/light-blue/lb_lv8.png'),
    grandmaster:       require('../../assets/pixel/male/light-blue/lb_lv9.png'),
    god:               require('../../assets/pixel/male/light-blue/lb_lv10.png'),
  },
  'male-black': {
    beginner:          require('../../assets/pixel/male/black/b_lv1.png'),
    novice:            require('../../assets/pixel/male/black/b_lv2.png'),
    intermediate:      require('../../assets/pixel/male/black/b_lv3.png'),
    upper_intermediate:require('../../assets/pixel/male/black/b_lv4.png'),
    advanced:          require('../../assets/pixel/male/black/b_lv5.png'),
    veteran:           require('../../assets/pixel/male/black/b_lv6.png'),
    artisan:           require('../../assets/pixel/male/black/b_lv7.png'),
    master:            require('../../assets/pixel/male/black/b_lv8.png'),
    grandmaster:       require('../../assets/pixel/male/black/b_lv9.png'),
    god:               require('../../assets/pixel/male/black/b_lv10.png'),
  },
  'female-pink': {
    beginner:          require('../../assets/pixel/female/pink/p_lv1.png'),
    novice:            require('../../assets/pixel/female/pink/p_lv2.png'),
    intermediate:      require('../../assets/pixel/female/pink/p_lv3.png'),
    upper_intermediate:require('../../assets/pixel/female/pink/p_lv4.png'),
    advanced:          require('../../assets/pixel/female/pink/p_lv5.png'),
    veteran:           require('../../assets/pixel/female/pink/p_lv6.png'),
    artisan:           require('../../assets/pixel/female/pink/p_lv7.png'),
    master:            require('../../assets/pixel/female/pink/p_lv8.png'),
    grandmaster:       require('../../assets/pixel/female/pink/p_lv9.png'),
    god:               require('../../assets/pixel/female/pink/p_lv10.png'),
  },
  'female-white': {
    beginner:          require('../../assets/pixel/female/white/w_lv1.png'),
    novice:            require('../../assets/pixel/female/white/w_lv2.png'),
    intermediate:      require('../../assets/pixel/female/white/w_lv3.png'),
    upper_intermediate:require('../../assets/pixel/female/white/w_lv4.png'),
    advanced:          require('../../assets/pixel/female/white/w_lv5.png'),
    veteran:           require('../../assets/pixel/female/white/w_lv6.png'),
    artisan:           require('../../assets/pixel/female/white/w_lv7.png'),
    master:            require('../../assets/pixel/female/white/w_lv8.png'),
    grandmaster:       require('../../assets/pixel/female/white/w_lv9.png'),
    god:               require('../../assets/pixel/female/white/w_lv10.png'),
  },
};

// ─── 아키타입 메타 ────────────────────────────────────────────────────────────

export interface ArchetypeMeta {
  id: CharacterArchetypeId;
  name: string;
  description: string;
  variantHint: 'power' | 'lean';   // power→black/white, lean→lightblue/pink
}

export const ARCHETYPE_META: Record<CharacterArchetypeId, ArchetypeMeta> = {
  powerlifter: { id: 'powerlifter', name: '파워리프터', description: '중량과 힘이 전부인 타입', variantHint: 'power' },
  mass_builder: { id: 'mass_builder', name: '매스 빌더', description: '몸을 키우는 게 목표인 타입', variantHint: 'power' },
  lean_body:   { id: 'lean_body',   name: '린 바디',   description: '단단하고 슬림한 체형 추구', variantHint: 'lean' },
  dieter:      { id: 'dieter',      name: '다이어터',  description: '체중 감량이 현재 목표', variantHint: 'lean' },
  wellness:    { id: 'wellness',    name: '웰니스형',  description: '건강과 균형을 중시', variantHint: 'lean' },
  all_rounder: { id: 'all_rounder', name: '올라운더',  description: '균형 잡힌 루틴 추구', variantHint: 'lean' },
};
```

---

## 3. 배정 로직 (ai-level-classifier.ts 추가)

### 3.1 `assignPixelVariant()`

```typescript
import type { AIGender, GymType, OnboardingData } from '../stores/ai-plan-store';
import type { PixelVariantId, CharacterArchetypeId } from './pixel-character-config';

type GoalType = OnboardingData['goal'];
type PowerGoal = 'strength_gain' | 'muscle_gain' | 'lean_bulk';
const POWER_GOALS: Set<GoalType> = new Set(['strength_gain', 'muscle_gain', 'lean_bulk']);
const POWER_GYM_TYPES: Set<GymType> = new Set(['full_gym', 'garage_gym']);

export function assignPixelVariant(
  gender: AIGender,
  goal: GoalType,
  gymType: GymType,
): PixelVariantId {
  const isPowerGoal = POWER_GOALS.has(goal);
  const isPowerGym  = POWER_GYM_TYPES.has(gymType);
  const isPower     = isPowerGoal && isPowerGym;

  if (gender === 'male')   return isPower ? 'male-black'    : 'male-lightblue';
  if (gender === 'female') return isPower ? 'female-white'  : 'female-pink';
  return 'male-lightblue'; // undisclosed 기본값
}
```

### 3.2 `classifyArchetype()`

```typescript
export function classifyArchetype(
  goal: GoalType,
  gymType: GymType,
  experience: OnboardingData['experience'],
): CharacterArchetypeId {
  if (goal === 'strength_gain' && POWER_GYM_TYPES.has(gymType)) return 'powerlifter';
  if ((goal === 'muscle_gain' || goal === 'lean_bulk') && gymType === 'full_gym') return 'mass_builder';
  if (goal === 'lean_bulk') return 'lean_body';
  if (goal === 'weight_loss') return 'dieter';
  if (goal === 'health' || goal === 'maintenance') return 'wellness';
  return 'all_rounder';
}
```

### 3.3 `SurveyLevelResult` 변경

```typescript
// 기존
export interface SurveyLevelResult {
  levelId: SurveyLevelId;
  levelName: string;
  title: string;          // "초심자 햄식이" → 제거
  ...
}

// 변경 후
export interface SurveyLevelResult {
  levelId: SurveyLevelId;
  levelName: string;
  nickname: string;        // "헬린이", "루키" 등 (title 대체)
  variantId: PixelVariantId;
  archetypeId: CharacterArchetypeId;
  ...
}
```

---

## 4. persona-engine.ts 변경

### 4.1 타입 교체

```typescript
// 변경 전
export type HamsterLevelId = 'beginner' | ... | 'challenger' | 'ranker' | 'god';

// 변경 후 (pixel-character-config.ts에서 import)
export type { CharacterLevelId } from './pixel-character-config';

// 호환성 alias (기존 코드 전파 최소화)
export type HamsterLevelId = CharacterLevelId;   // 1 사이클만 유지, 이후 제거
```

> **구현 전략**: M1에서 `HamsterLevelId = CharacterLevelId` alias를 만들어 타입 오류를 막고,  
> M4 완료 후 alias를 제거해 완전 교체. tsc가 alias 단계에서도 challenger/ranker 사용을 잡아줌.

### 4.2 LEVELS 배열 변경

```typescript
// 제거: challenger, ranker 항목
// 유지: beginner ~ veteran (6) + artisan ~ god (4) = 총 10개
// CHARACTER_LEVELS에서 메타를 임포트해서 동기화
```

### 4.3 PersonaCalculationResult 변경 없음

`PersonaCalculationResult.levelId`는 `HamsterLevelId` alias를 통해 자동 호환.  
추후 M3에서 `variantId`, `archetypeId`를 별도로 persona-store에서 계산.

---

## 5. persona-store.ts 변경

### 5.1 상태 확장

```typescript
interface PersonaStoreState {
  ...기존...
  variantId: PixelVariantId | null;       // 신규
  archetypeId: CharacterArchetypeId | null; // 신규
}
```

### 5.2 variantId 계산 위치

`calculatePersona()` 내부 또는 `setQuickCharacterProfile()` 직후에 계산:

```typescript
// AI 온보딩 완료 사용자: onboardingData에서 계산
const variantId = assignPixelVariant(onboarding.gender, onboarding.goal, onboarding.gymType);
const archetypeId = classifyArchetype(onboarding.goal, onboarding.gymType, onboarding.experience);

// Quick Character Setup 사용자: quickCharacterProfile.gender + trainingStyle에서 계산
const gender = quickProfile.gender ?? 'undisclosed';
const trainingStyle = quickProfile.trainingStyle;
// trainingStyle 'performance' → strength_gain 유사 처리
```

### 5.3 QuickCharacterProfile 변경

```typescript
export interface QuickCharacterProfile {
  ...기존...
  gender?: 'male' | 'female' | 'undisclosed';  // 신규 (선택값)
}
```

### 5.4 Persist Migration (legacy levelId 처리)

```typescript
// zustand persist 설정
{
  name: 'persona-store',
  version: 2,                    // 기존 버전에서 bump
  migrate(state: any, version: number) {
    if (version < 2) {
      const LEGACY_LEVEL_MAP: Record<string, CharacterLevelId> = {
        challenger: 'grandmaster',
        ranker: 'god',
      };
      if (state.levelId && LEGACY_LEVEL_MAP[state.levelId]) {
        state.levelId = LEGACY_LEVEL_MAP[state.levelId];
      }
      if (state.nextLevelId && LEGACY_LEVEL_MAP[state.nextLevelId]) {
        state.nextLevelId = LEGACY_LEVEL_MAP[state.nextLevelId];
      }
    }
    return state;
  },
}
```

---

## 6. pixel-evolution-card.tsx (신규 컴포넌트)

### 6.1 Props 인터페이스

```typescript
// hamster-evolution-card.tsx와 거의 동일하되 variantId 추가
interface PixelEvolutionCardProps {
  levelId?: CharacterLevelId | null;
  variantId?: PixelVariantId | null;       // 신규: 어떤 픽셀 캐릭터를 보여줄지
  archetypeId?: CharacterArchetypeId | null; // 신규: 아키타입 뱃지용
  levelName?: string | null;
  nextLevelName?: string | null;
  progressToNext?: number | null;
  headline?: string | null;
  progressMessage?: string | null;
  supportingMessage?: string | null;
  checklist?: EvolutionChecklistItem[];
  dailyState?: PersonaDailyState | null;
  loading?: boolean;
  ctaLabel?: string | null;
  onPressCta?: (() => void) | null;
}
```

### 6.2 이미지 선택 로직

```typescript
// variantId가 없으면 male-lightblue 기본값
const effectiveVariant: PixelVariantId = variantId ?? 'male-lightblue';
const imageSource = levelId
  ? PIXEL_IMAGE_MAP[effectiveVariant][levelId]
  : null;
```

### 6.3 아키타입 뱃지 추가

```typescript
// 기존 stateBadge 아래에 archetypeBadge 추가
{archetypeId && (
  <View style={[styles.archetypeBadge, { backgroundColor: colors.separator }]}>
    <Text style={[styles.archetypeLabel, { color: colors.textSecondary }]}>
      {ARCHETYPE_META[archetypeId].name}
    </Text>
  </View>
)}
```

### 6.4 도감 모달 문구 변경

```
기존: "햄식이 도감" / "좌우로 넘기면서 전 단계와 다음 단계를 구경해보세요."
변경: "진화 도감"  / "좌우로 넘기면서 전 단계와 다음 단계를 확인해보세요."
```

---

## 7. ai-level-result-screen.tsx 변경

```typescript
// 변경 전
const LEVEL_IMAGE_MAP: Record<SurveyLevelId, any> = {
  beginner: require('../../../assets/hamster_1200x1200/beginner.png'),
  ...
};

// 변경 후
// PIXEL_IMAGE_MAP에서 가져옴, variantId는 surveyLevelResult에서
const imageSource = useMemo(() => {
  if (!surveyLevelResult) return null;
  const variant = surveyLevelResult.variantId ?? 'male-lightblue';
  return PIXEL_IMAGE_MAP[variant][surveyLevelResult.levelId];
}, [surveyLevelResult]);

// 텍스트 변경
// 기존: `${meta.name} 햄식이` → 변경: `${meta.nickname}` 또는 `${meta.name}`
```

---

## 8. character-setup-screen.tsx 변경

### 8.1 gender 선택지 추가

```typescript
// EXPERIENCE_OPTIONS 위에 추가
const GENDER_OPTIONS = [
  { label: '남성', value: 'male' as const },
  { label: '여성', value: 'female' as const },
  { label: '선택 안 함', value: 'undisclosed' as const },
];

// state 추가
const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'undisclosed'>('undisclosed');

// setQuickCharacterProfile 호출 시 gender 포함
setQuickCharacterProfile({
  userId: ...,
  gender: selectedGender,
  experience: ...,
  ...
});
```

---

## 9. home-screen.tsx 변경

```typescript
// import 변경
import PixelEvolutionCard from '../../components/home/pixel-evolution-card';
// (HamsterEvolutionCard import 제거)

// 사용 시 variantId, archetypeId 추가 전달
<PixelEvolutionCard
  levelId={personaStore.levelId}
  variantId={personaStore.variantId}           // 신규
  archetypeId={personaStore.archetypeId}       // 신규
  ...나머지 props 동일...
/>
```

---

## 10. Supabase 마이그레이션 SQL

### 10.1 레거시 테이블 삭제

```sql
-- ① profiles 테이블 삭제 (코드 참조 제거 완료, DB에만 잔존)
-- 주의: CASCADE로 연관 RLS 정책/인덱스도 함께 삭제됨
DROP TABLE IF EXISTS profiles CASCADE;
```

### 10.2 user_profiles에 pixel_variant_id 추가

```sql
-- ② pixel_variant_id 컬럼 추가 (기기 간 동기화 + 관리자 확인용)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS pixel_variant_id TEXT
  CHECK (pixel_variant_id IN (
    'male-lightblue', 'male-black', 'female-pink', 'female-white'
  ));

-- ③ 기존 user_profiles.gender 값으로 pixel_variant_id 기본 세팅
--    (gender='male' → 'male-lightblue', 'female' → 'female-pink', 나머지 NULL)
UPDATE user_profiles
SET pixel_variant_id = CASE
  WHEN gender = 'male'   THEN 'male-lightblue'
  WHEN gender = 'female' THEN 'female-pink'
  ELSE NULL
END
WHERE pixel_variant_id IS NULL;
```

### 10.3 정리 확인 쿼리

```sql
-- 햄식이/hamster 관련 잔존 여부 확인
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name ILIKE '%hamster%' OR column_name ILIKE '%level_id%')
ORDER BY table_name;

-- profiles 테이블 삭제 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';
-- → 결과 0건이면 정상

-- pixel_variant_id 배포 확인
SELECT pixel_variant_id, count(*) 
FROM user_profiles 
GROUP BY pixel_variant_id;
```

> **참고**: `ai_plans.plan_json` 안의 onboardingData(gender/goal 포함)는 런타임 데이터이므로  
> 삭제 불필요. 픽셀 변형 계산에 그대로 활용.

---

## 11. 리스크 대응책

### R1. HamsterLevelId 타입 교체 누락

**위험**: M1에서 타입을 교체할 때 일부 파일에서 import 누락 → 런타임 크래시

**대응책**:
```bash
# M1 완료 직후 실행
npx tsc --noEmit 2>&1 | grep -i "hamsterlevel\|challenger\|ranker"

# 추가: grep으로 잔존 참조 확인
grep -r "HamsterLevelId\|hamster_1200x1200\|hamster-evolution-card" src/
```
- M1에서 `HamsterLevelId = CharacterLevelId` alias 유지 → 타입 오류 없이 통과
- M4 완료 후 alias 제거하고 다시 tsc 실행으로 최종 확인

---

### R2. AsyncStorage의 legacy levelId (challenger / ranker)

**위험**: 기존 사용자 앱 재시작 시 `levelId: 'challenger'` → CharacterLevelId에 없어 undefined

**대응책 (persona-store.ts)**:
```typescript
// persist migrate 함수
migrate(persistedState: any, version: number) {
  if (version < 2) {
    const LEGACY_MAP: Record<string, CharacterLevelId> = {
      challenger: 'grandmaster',  // grandmaster로 강등
      ranker:     'god',          // god으로 강등
    };
    ['levelId', 'nextLevelId'].forEach(key => {
      if (persistedState[key] && LEGACY_MAP[persistedState[key]]) {
        persistedState[key] = LEGACY_MAP[persistedState[key]];
      }
    });
    // variantId, archetypeId 초기화
    persistedState.variantId = null;
    persistedState.archetypeId = null;
  }
  return persistedState;
},
version: 2,
```

---

### R3. Quick Character Setup 사용자의 gender 누락

**위험**: 기존 Quick Setup 사용자는 gender 필드 없음 → variantId = null → 이미지 없음

**대응책**:
1. `variantId = null`일 때 `male-lightblue` 기본값 표시 (코드 fallback)
2. 홈 카드 empty state에 "캐릭터 설정하기" CTA 유지
3. `character-setup-screen.tsx`에 gender 추가 후, 기존 profile.gender(user_profiles)에서 초기값 자동 세팅:
   ```typescript
   // character-setup-screen 진입 시
   const profileGender = useProfileStore(s => s.gender);
   const [selectedGender, setSelectedGender] = useState(profileGender ?? 'undisclosed');
   ```

---

### R4. 정적 require() 40개 번들 크기 증가

**위험**: 40개 PNG 이미지가 앱 번들에 포함되어 초기 로딩 증가

**대응책**:
- `pixel-character-config.ts`의 require()는 Metro bundler가 lazy-load 처리
- 실제 렌더링된 Image만 디코딩되므로 메모리 영향 제한적
- 픽셀 아트 특성상 파일 크기가 사진보다 작음 (예상 100~300KB/파일)
- 추후 필요 시 `expo-asset`의 prefetch 제어로 최적화 가능

---

### R5. Web 빌드에서 픽셀 에셋 경로 문제

**위험**: Cloudflare Pages 배포 시 이미지 경로가 정상 처리되지 않을 수 있음

**대응책**:
- PNG 파일은 `postprocess-web-export.js`의 폰트 후처리 스크립트와 무관
- `npm run build` (expo export) 시 Metro가 PNG를 `dist/assets/` 하위로 자동 해시 복사
- 현재 아이콘 폰트 문제와 분리된 경로이므로 영향 없음
- 검증: `npm run build` 후 `dist/assets/` 내 pixel PNG 파일 존재 확인

---

## 12. 구현 가이드

### 12.1 모듈 맵

| 모듈 | 주요 파일 | 의존성 |
|------|-----------|--------|
| M1 — 타입·설정 | `pixel-character-config.ts` (신규), `persona-engine.ts` | 없음 |
| M2 — 배정 로직 | `ai-level-classifier.ts`, `persona-store.ts` (QuickCharacterProfile) | M1 완료 |
| M3 — 스토어 | `persona-store.ts` (migrate+variantId), `ai-plan-store.ts` | M1, M2 완료 |
| M4 — UI 교체 | `pixel-evolution-card.tsx` (신규), `ai-level-result-screen.tsx`, `home-screen.tsx`, `character-setup-screen.tsx` | M1~M3 완료 |

### 12.2 세션 가이드

| 세션 | 범위 | 예상 변경 규모 |
|------|------|---------------|
| Session 1 | M1: pixel-character-config.ts 신규 + persona-engine.ts 타입 교체 + tsc 확인 | 신규 1개, 수정 1개 (~120줄) |
| Session 2 | M2: ai-level-classifier.ts 배정 로직 + QuickCharacterProfile gender 추가 | 수정 2개 (~80줄) |
| Session 3 | M3: persona-store.ts migrate + variantId/archetypeId 상태 추가 | 수정 1개 (~60줄) |
| Session 4 | M4: pixel-evolution-card.tsx 신규 + 화면 3개 교체 + hamster-evolution-card 삭제 | 신규 1개, 수정 3개, 삭제 1개 (~300줄) |

### 12.3 각 세션 완료 기준

- **Session 1**: `grep -r "hamster_1200x1200" src/` 결과 0건, `npx tsc --noEmit` 통과
- **Session 2**: `classifySurveyLevel()` 반환값에 `variantId`, `archetypeId` 포함
- **Session 3**: persona-store rehydrate 시 challenger/ranker → grandmaster/god 자동 변환
- **Session 4**: 홈 탭에서 픽셀 캐릭터 이미지 정상 노출, 도감 모달 40장 확인

---

## 13. 삭제 파일

| 파일 | 삭제 시점 | 대체 파일 |
|------|-----------|-----------|
| `src/components/home/hamster-evolution-card.tsx` | Session 4 완료 후 | `pixel-evolution-card.tsx` |
