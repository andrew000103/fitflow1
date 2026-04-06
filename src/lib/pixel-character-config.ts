// ─── 핵심 타입 ────────────────────────────────────────────────────────────────

/**
 * 픽셀 캐릭터 레벨 ID (10단계)
 * lv1~6: 설문으로 배정 (beginner~veteran)
 * lv7~10: 앱 활동으로 달성 (artisan~god)
 */
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

/**
 * 픽셀 캐릭터 변형 ID
 * 성별 + 목표 기반으로 자동 배정
 */
export type PixelVariantId =
  | 'male-lightblue'
  | 'male-black'
  | 'female-pink'
  | 'female-white';

/**
 * 운동 아키타입 (분류 유형)
 * 목표 + 운동 환경 + 경험 기반으로 분류
 */
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
  /** 에셋 파일명 번호 (lb_lv{assetNum}.png 등) */
  assetNum: number;
  /** 사용자 노출용 보조 레벨명 */
  nickname: string;
  /** 공식 단계명 (예: 초심자, 초급자) */
  name: string;
  /** 단계 분위기 한 줄 설명 */
  vibe: string;
  /** 단계 상세 설명 */
  description: string;
  /** 설문으로 도달 가능한 최고 레벨 여부 */
  surveyMax: boolean;
}

export const CHARACTER_LEVELS: CharacterLevelMeta[] = [
  {
    id: 'beginner',
    assetNum: 1,
    nickname: '입문 단계',
    name: '초심자',
    surveyMax: false,
    vibe: '기본 루틴을 막 만들기 시작한 단계예요.',
    description:
      '운동 루틴을 막 만들기 시작한 단계예요. 지금은 익숙해지는 속도보다 꾸준히 이어가는 흐름을 만드는 것이 더 중요해요.',
  },
  {
    id: 'novice',
    assetNum: 2,
    nickname: '기초 적응 단계',
    name: '초급자',
    surveyMax: false,
    vibe: '운동 리듬이 몸에 조금씩 자리 잡고 있어요.',
    description:
      '운동 빈도와 기본 패턴이 안정되기 시작한 단계예요. 무리해서 속도를 내기보다, 좋은 자세와 반복 습관을 만드는 게 성장에 더 도움이 됩니다.',
  },
  {
    id: 'intermediate',
    assetNum: 3,
    nickname: '루틴 정착 단계',
    name: '중급자',
    surveyMax: false,
    vibe: '운동이 생활 안에 자연스럽게 들어온 단계예요.',
    description:
      '기본 루틴이 자리를 잡고 있고, 운동 감각도 점점 안정적으로 쌓이고 있어요. 지금은 꾸준함을 실력으로 바꾸기 좋은 구간입니다.',
  },
  {
    id: 'upper_intermediate',
    assetNum: 4,
    nickname: '안정 성장 단계',
    name: '중상급자',
    surveyMax: false,
    vibe: '운동 수행과 회복 리듬이 꽤 안정된 단계예요.',
    description:
      '운동 수행 능력과 루틴 운영 감각이 함께 올라온 단계예요. 작은 디테일을 다듬을수록 체감 성장이 더 선명해질 수 있어요.',
  },
  {
    id: 'advanced',
    assetNum: 5,
    nickname: '고밀도 성장 단계',
    name: '상급자',
    surveyMax: false,
    vibe: '운동과 식단을 함께 관리할 수 있는 단계예요.',
    description:
      '운동, 회복, 식단을 함께 조절하며 성장할 수 있는 단계예요. 지금은 더 많이 하는 것보다 더 정교하게 가져가는 것이 중요합니다.',
  },
  {
    id: 'veteran',
    assetNum: 6,
    nickname: '상위 성장 단계',
    name: '프로',
    surveyMax: true,
    vibe: '운동 감각과 수행 밀도가 확실히 올라온 단계예요.',
    description:
      '기본 수행 능력뿐 아니라 훈련 밀도도 높게 유지할 수 있는 단계예요. 루틴을 단순히 따라가는 수준을 넘어, 스스로 완성도를 끌어올릴 수 있습니다.',
  },
  {
    id: 'artisan',
    assetNum: 7,
    nickname: '전문 운영 단계',
    name: '전문가',
    surveyMax: false,
    vibe: '루틴의 질과 완성도를 직접 설계할 수 있는 단계예요.',
    description:
      '수행 능력뿐 아니라 루틴 운영 감각까지 숙련된 단계예요. 숫자보다 완성도와 지속 가능성을 기준으로 훈련을 조절할 수 있습니다.',
  },
  {
    id: 'master',
    assetNum: 8,
    nickname: '상위 경쟁 단계',
    name: '컨텐더',
    surveyMax: false,
    vibe: '훈련 완성도와 존재감이 한 단계 더 올라온 상태예요.',
    description:
      '오랜 시간 쌓인 경험을 바탕으로 운동 흐름과 강도를 높은 수준에서 유지할 수 있는 단계예요. 루틴의 완성도와 집중력이 분명하게 드러납니다.',
  },
  {
    id: 'grandmaster',
    assetNum: 9,
    nickname: '최정예 단계',
    name: '엘리트',
    surveyMax: false,
    vibe: '기록, 수행, 루틴 운영이 모두 매우 높은 수준에 가까워요.',
    description:
      '축적된 기록과 높은 수행 안정성이 함께 보이는 단계예요. 루틴의 밀도와 지속성을 모두 높은 수준으로 유지할 수 있습니다.',
  },
  {
    id: 'god',
    assetNum: 10,
    nickname: '최종 완성 단계',
    name: '챔피언',
    surveyMax: false,
    vibe: '루틴의 완성도와 존재감이 최상위권에 도달한 상태예요.',
    description:
      '수행 능력, 루틴 운영, 지속성이 모두 매우 높은 수준으로 올라온 단계예요. 전체적인 운동 완성도가 분명하게 드러나는 최상위 구간입니다.',
  },
];

/** 레벨 ID → 에셋 번호 맵 */
export const LEVEL_TO_ASSET_NUM: Record<CharacterLevelId, number> = Object.fromEntries(
  CHARACTER_LEVELS.map((level) => [level.id, level.assetNum]),
) as Record<CharacterLevelId, number>;

// ─── 픽셀 에셋 맵 (40개 정적 require) ─────────────────────────────────────────
// React Native Metro bundler는 require() 경로를 빌드 타임에 결정하므로
// 동적 경로 사용 불가 → 40개 모두 정적 require

export const PIXEL_IMAGE_MAP: Record<PixelVariantId, Record<CharacterLevelId, any>> = {
  'male-lightblue': {
    beginner:           require('../../assets/pixel/male/light-blue/lb_lv1.png'),
    novice:             require('../../assets/pixel/male/light-blue/lb_lv2.png'),
    intermediate:       require('../../assets/pixel/male/light-blue/lb_lv3.png'),
    upper_intermediate: require('../../assets/pixel/male/light-blue/lb_lv4.png'),
    advanced:           require('../../assets/pixel/male/light-blue/lb_lv5.png'),
    veteran:            require('../../assets/pixel/male/light-blue/lb_lv6.png'),
    artisan:            require('../../assets/pixel/male/light-blue/lb_lv7.png'),
    master:             require('../../assets/pixel/male/light-blue/lb_lv8.png'),
    grandmaster:        require('../../assets/pixel/male/light-blue/lb_lv9.png'),
    god:                require('../../assets/pixel/male/light-blue/lb_lv10.png'),
  },
  'male-black': {
    beginner:           require('../../assets/pixel/male/black/b_lv1.png'),
    novice:             require('../../assets/pixel/male/black/b_lv2.png'),
    intermediate:       require('../../assets/pixel/male/black/b_lv3.png'),
    upper_intermediate: require('../../assets/pixel/male/black/b_lv4.png'),
    advanced:           require('../../assets/pixel/male/black/b_lv5.png'),
    veteran:            require('../../assets/pixel/male/black/b_lv6.png'),
    artisan:            require('../../assets/pixel/male/black/b_lv7.png'),
    master:             require('../../assets/pixel/male/black/b_lv8.png'),
    grandmaster:        require('../../assets/pixel/male/black/b_lv9.png'),
    god:                require('../../assets/pixel/male/black/b_lv10.png'),
  },
  'female-pink': {
    beginner:           require('../../assets/pixel/female/pink/p_lv1.png'),
    novice:             require('../../assets/pixel/female/pink/p_lv2.png'),
    intermediate:       require('../../assets/pixel/female/pink/p_lv3.png'),
    upper_intermediate: require('../../assets/pixel/female/pink/p_lv4.png'),
    advanced:           require('../../assets/pixel/female/pink/p_lv5.png'),
    veteran:            require('../../assets/pixel/female/pink/p_lv6.png'),
    artisan:            require('../../assets/pixel/female/pink/p_lv7.png'),
    master:             require('../../assets/pixel/female/pink/p_lv8.png'),
    grandmaster:        require('../../assets/pixel/female/pink/p_lv9.png'),
    god:                require('../../assets/pixel/female/pink/p_lv10.png'),
  },
  'female-white': {
    beginner:           require('../../assets/pixel/female/white/w_lv1.png'),
    novice:             require('../../assets/pixel/female/white/w_lv2.png'),
    intermediate:       require('../../assets/pixel/female/white/w_lv3.png'),
    upper_intermediate: require('../../assets/pixel/female/white/w_lv4.png'),
    advanced:           require('../../assets/pixel/female/white/w_lv5.png'),
    veteran:            require('../../assets/pixel/female/white/w_lv6.png'),
    artisan:            require('../../assets/pixel/female/white/w_lv7.png'),
    master:             require('../../assets/pixel/female/white/w_lv8.png'),
    grandmaster:        require('../../assets/pixel/female/white/w_lv9.png'),
    god:                require('../../assets/pixel/female/white/w_lv10.png'),
  },
};

// ─── 기본 변형 ─────────────────────────────────────────────────────────────────

/** 성별 미설정 또는 undisclosed 시 사용하는 기본 변형 */
export const DEFAULT_PIXEL_VARIANT: PixelVariantId = 'male-lightblue';

export interface PixelVariantMeta {
  id: PixelVariantId;
  label: string;
  shortReason: string;
  detailReason: string;
}

export const PIXEL_VARIANT_META: Record<PixelVariantId, PixelVariantMeta> = {
  'male-lightblue': {
    id: 'male-lightblue',
    label: '밸런스 빌더형',
    shortReason: '균형 잡힌 루틴과 안정적인 성장 흐름을 만들기 좋은 유형이에요.',
    detailReason: '컨디션, 루틴, 체형 밸런스를 함께 가져가며 전체적인 운동 완성도를 고르게 쌓아가는 편에 가까워요.',
  },
  'male-black': {
    id: 'male-black',
    label: '파워 빌더형',
    shortReason: '중량과 근력 중심으로 밀도 있게 성장해나가는 유형이에요.',
    detailReason: '강도 높은 훈련, 힘의 향상, 성장 지향 목표와 잘 맞는 편이라 파워와 밀도를 함께 끌어올리는 흐름에 가깝습니다.',
  },
  'female-pink': {
    id: 'female-pink',
    label: '퍼포먼스 빌더형',
    shortReason: '에너지와 추진력을 바탕으로 강하게 성장해나가는 유형이에요.',
    detailReason: '근력 향상과 수행 능력 쪽 성향이 분명해서, 리듬감 있게 밀어붙이며 성과를 끌어올리는 흐름에 더 가깝습니다.',
  },
  'female-white': {
    id: 'female-white',
    label: '라인 밸런스형',
    shortReason: '정돈된 루틴과 가벼운 밸런스 조절에 강점을 보이는 유형이에요.',
    detailReason: '감량, 유지, 컨디션 관리와 잘 맞는 편이라 무리하게 밀기보다 깔끔하고 정돈된 흐름으로 완성도를 높이는 방향에 가깝습니다.',
  },
};

// ─── 아키타입 메타 ────────────────────────────────────────────────────────────

export interface ArchetypeMeta {
  id: CharacterArchetypeId;
  name: string;
  description: string;
  /** 변형 힌트: 남성 power → black / lean → lightblue, 여성 power → pink / lean → white */
  variantHint: 'power' | 'lean';
}

export const ARCHETYPE_META: Record<CharacterArchetypeId, ArchetypeMeta> = {
  powerlifter: {
    id: 'powerlifter',
    name: '파워리프터',
    description: '중량과 힘이 전부인 타입',
    variantHint: 'power',
  },
  mass_builder: {
    id: 'mass_builder',
    name: '매스 빌더',
    description: '몸을 키우는 게 목표인 타입',
    variantHint: 'power',
  },
  lean_body: {
    id: 'lean_body',
    name: '린 바디',
    description: '단단하고 슬림한 체형 추구',
    variantHint: 'lean',
  },
  dieter: {
    id: 'dieter',
    name: '다이어터',
    description: '체중 감량이 현재 목표',
    variantHint: 'lean',
  },
  wellness: {
    id: 'wellness',
    name: '웰니스형',
    description: '건강과 균형을 중시',
    variantHint: 'lean',
  },
  all_rounder: {
    id: 'all_rounder',
    name: '올라운더',
    description: '균형 잡힌 루틴 추구',
    variantHint: 'lean',
  },
};
