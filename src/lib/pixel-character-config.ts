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
  /** 친근한 별명 (예: 헬린이, 루키, 고인물) */
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
    nickname: '헬린이',
    name: '초심자',
    surveyMax: false,
    vibe: '첫 루틴을 시작한 픽셀',
    description:
      '오늘 처음으로 운동화 끈을 묶었습니다. 러닝머신 버튼이 어디 있는지도 모르고, 덤벨은 왜 이렇게 종류가 많은지도 모르겠어요. 근데 있잖아요, 모르면서도 여기까지 온 것 자체가 이미 대단한 거예요. 분명히 뭔가 됩니다.',
  },
  {
    id: 'novice',
    assetNum: 2,
    nickname: '루키',
    name: '초급자',
    surveyMax: false,
    vibe: '몸이 운동 리듬을 익히는 픽셀',
    description:
      '헬스장 가는 길이 이제 조금 익숙해졌어요. 줄넘기가 가끔 발에 걸리고, 다음 날 계단이 무서워지는 날도 있지만, 그게 다 성장통이라는 걸 이미 알고 있어요. 포기 안 하는 것, 그게 제일 어려운 스킬인데 이미 장착 완료입니다.',
  },
  {
    id: 'intermediate',
    assetNum: 3,
    nickname: '단련 중',
    name: '중급자',
    surveyMax: false,
    vibe: '운동이 일상에 들어온 픽셀',
    description:
      '슬슬 보입니다. 3개월 전 나랑 지금 나 사이의 차이가. 거울 속 모습이 달라졌고, 들고 있는 무게도 달라졌어요. 남들한테 보여주려고 시작했든, 건강 때문에 시작했든, 이제는 그냥 하고 싶어서 하게 됩니다. 이게 진짜 운동러의 시작이에요.',
  },
  {
    id: 'upper_intermediate',
    assetNum: 4,
    nickname: '준전문가',
    name: '중상급자',
    surveyMax: false,
    vibe: '루틴이 꽤 안정된 픽셀',
    description:
      '루틴이 생겼습니다. 어떤 날은 하기 싫어도 몸이 먼저 헬스장 방향으로 걸어가고 있어요. 기구 세팅도 척척, 세트 사이 쉬는 시간도 대충 맞아 들어가는 수준. 이미 다음 동작으로 넘어가고 있습니다.',
  },
  {
    id: 'advanced',
    assetNum: 5,
    nickname: '강철인',
    name: '상급자',
    surveyMax: false,
    vibe: '운동과 식단을 함께 챙기는 픽셀',
    description:
      '운동이 숙제에서 언어가 된 단계입니다. 몸으로 대화하고, 무게로 표현하고, 루틴으로 하루를 설계해요. 쉬는 날도 스트레칭은 하고 있고, 밥 먹을 때도 단백질 계산이 자동으로 돌아가는 뇌 구조. 이쯤 되면 삶 자체가 운동 중심으로 재편된 겁니다.',
  },
  {
    id: 'veteran',
    assetNum: 6,
    nickname: '고인물',
    name: '고인물',
    surveyMax: true,
    vibe: '운동 냄새만 맡아도 몸이 반응하는 픽셀',
    description:
      '몇 년째 같은 자리, 같은 시간, 같은 기구. 근데 몸은 매년 달라지고 있어요. 변화 없어 보이는 루틴 안에서 조금씩, 꾸준히, 묵묵히 쌓아온 것들이 있거든요. 헬스장 직원보다 이 공간을 더 잘 아는 존재. 전설은 갑자기 나타나는 게 아니라 이렇게 만들어집니다.',
  },
  {
    id: 'artisan',
    assetNum: 7,
    nickname: '달인',
    name: '달인',
    surveyMax: false,
    vibe: '꾸준함이 묵직해진 픽셀',
    description:
      '더 이상 무게가 목표가 아니에요. 완성도가 목표입니다. 1kg 차이도 폼이 무너지면 의미 없다는 걸 몸으로 아는 경지예요. 기록보다 감각을 믿고, 숫자보다 질을 쫓습니다. 옆에서 보면 조용한데, 자세히 보면 모든 동작이 정교하게 설계되어 있어요.',
  },
  {
    id: 'master',
    assetNum: 8,
    nickname: '마스터',
    name: '마스터',
    surveyMax: false,
    vibe: '루틴을 통제하는 픽셀',
    description:
      '헬스장에서 운동을 시작하면, 주변 소음이 줄어드는 것 같은 느낌이 납니다. 실제로는 아무것도 안 바뀌었는데, 분위기가 바뀌어요. 오랜 시간이 만들어낸 집중력과 무게감이 공간을 채우는 거예요. 말 한마디 없어도 존경받는 것, 마스터는 그런 존재입니다.',
  },
  {
    id: 'grandmaster',
    assetNum: 9,
    nickname: '전설',
    name: '그랜드마스터',
    surveyMax: false,
    vibe: '기록이 쌓여 존재감이 생긴 픽셀',
    description:
      '이미 증명할 게 없는 단계예요. 남한테 보여줄 필요도, 기록을 자랑할 필요도 없어요. 그냥 하면 됩니다. 오늘도 어제처럼, 내일도 오늘처럼. 그 반복이 쌓여서 이 경지까지 온 거니까요. 누가 쳐다봐도, 안 쳐다봐도 똑같은 루틴. 그게 그랜드마스터의 힘입니다.',
  },
  {
    id: 'god',
    assetNum: 10,
    nickname: '신의 경지',
    name: '신',
    surveyMax: false,
    vibe: '루틴의 끝에 도달한 픽셀',
    description:
      '시간을 초월한 존재입니다. 무게를 드는 게 아니라 중력이 협조하는 거예요. 말이 필요 없고, 설명이 필요 없고, 그냥 빛납니다. 그게 다예요.',
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

// ─── 아키타입 메타 ────────────────────────────────────────────────────────────

export interface ArchetypeMeta {
  id: CharacterArchetypeId;
  name: string;
  description: string;
  /** 변형 힌트: power → black/white, lean → lightblue/pink */
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
