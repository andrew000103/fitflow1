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
 * 헬스 유형 ID — Phase 1 (6종)
 * Phase 2에 'endurance' | 'fighter' 추가 예정
 */
export type PixelVariantId =
  | 'powerlifter'    // 파워리프터형
  | 'bodybuilder'    // 보디빌더형 (구: mass_builder)
  | 'lean_athlete'   // 린 애슬릿형 (구: lean_body)
  | 'transformer'    // 트랜스포머형 (구: dieter)
  | 'calisthenics'   // 케리스테닉스형
  | 'wellness';      // 웰니스형

/**
 * 성별 변형 — assignFitnessType()이 반환, 이미지/콘텐츠 선택에 사용
 */
export type FitnessTypeGenderVariant = 'male' | 'female' | 'neutral';

/**
 * 운동 아키타입 (분류 유형)
 * 목표 + 운동 환경 + 경험 기반으로 분류
 * AI 플랜과 연동되므로 값을 변경하지 말 것 (mass_builder/lean_body/dieter 그대로)
 */
export type CharacterArchetypeId =
  | 'powerlifter'
  | 'mass_builder'
  | 'lean_body'
  | 'dieter'
  | 'calisthenics'
  | 'wellness'
  | 'all_rounder';

// ─── 레벨 메타 ────────────────────────────────────────────────────────────────

export interface CharacterLevelMeta {
  id: CharacterLevelId;
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
    nickname: '입문 단계',
    name: '초심자',
    surveyMax: false,
    vibe: '기본 루틴을 막 만들기 시작한 단계예요.',
    description:
      '운동 루틴을 막 만들기 시작한 단계예요. 지금은 익숙해지는 속도보다 꾸준히 이어가는 흐름을 만드는 것이 더 중요해요.',
  },
  {
    id: 'novice',
    nickname: '기초 적응 단계',
    name: '초급자',
    surveyMax: false,
    vibe: '운동 리듬이 몸에 조금씩 자리 잡고 있어요.',
    description:
      '운동 빈도와 기본 패턴이 안정되기 시작한 단계예요. 무리해서 속도를 내기보다, 좋은 자세와 반복 습관을 만드는 게 성장에 더 도움이 됩니다.',
  },
  {
    id: 'intermediate',
    nickname: '루틴 정착 단계',
    name: '중급자',
    surveyMax: false,
    vibe: '운동이 생활 안에 자연스럽게 들어온 단계예요.',
    description:
      '기본 루틴이 자리를 잡고 있고, 운동 감각도 점점 안정적으로 쌓이고 있어요. 지금은 꾸준함을 실력으로 바꾸기 좋은 구간입니다.',
  },
  {
    id: 'upper_intermediate',
    nickname: '안정 성장 단계',
    name: '중상급자',
    surveyMax: false,
    vibe: '운동 수행과 회복 리듬이 꽤 안정된 단계예요.',
    description:
      '운동 수행 능력과 루틴 운영 감각이 함께 올라온 단계예요. 작은 디테일을 다듬을수록 체감 성장이 더 선명해질 수 있어요.',
  },
  {
    id: 'advanced',
    nickname: '고밀도 성장 단계',
    name: '상급자',
    surveyMax: false,
    vibe: '운동과 식단을 함께 관리할 수 있는 단계예요.',
    description:
      '운동, 회복, 식단을 함께 조절하며 성장할 수 있는 단계예요. 지금은 더 많이 하는 것보다 더 정교하게 가져가는 것이 중요합니다.',
  },
  {
    id: 'veteran',
    nickname: '상위 성장 단계',
    name: '프로',
    surveyMax: true,
    vibe: '운동 감각과 수행 밀도가 확실히 올라온 단계예요.',
    description:
      '기본 수행 능력뿐 아니라 훈련 밀도도 높게 유지할 수 있는 단계예요. 루틴을 단순히 따라가는 수준을 넘어, 스스로 완성도를 끌어올릴 수 있습니다.',
  },
  {
    id: 'artisan',
    nickname: '전문 운영 단계',
    name: '전문가',
    surveyMax: false,
    vibe: '루틴의 질과 완성도를 직접 설계할 수 있는 단계예요.',
    description:
      '수행 능력뿐 아니라 루틴 운영 감각까지 숙련된 단계예요. 숫자보다 완성도와 지속 가능성을 기준으로 훈련을 조절할 수 있습니다.',
  },
  {
    id: 'master',
    nickname: '상위 경쟁 단계',
    name: '컨텐더',
    surveyMax: false,
    vibe: '훈련 완성도와 존재감이 한 단계 더 올라온 상태예요.',
    description:
      '오랜 시간 쌓인 경험을 바탕으로 운동 흐름과 강도를 높은 수준에서 유지할 수 있는 단계예요. 루틴의 완성도와 집중력이 분명하게 드러납니다.',
  },
  {
    id: 'grandmaster',
    nickname: '최정예 단계',
    name: '엘리트',
    surveyMax: false,
    vibe: '기록, 수행, 루틴 운영이 모두 매우 높은 수준에 가까워요.',
    description:
      '축적된 기록과 높은 수행 안정성이 함께 보이는 단계예요. 루틴의 밀도와 지속성을 모두 높은 수준으로 유지할 수 있습니다.',
  },
  {
    id: 'god',
    nickname: '최종 완성 단계',
    name: '챔피언',
    surveyMax: false,
    vibe: '루틴의 완성도와 존재감이 최상위권에 도달한 상태예요.',
    description:
      '수행 능력, 루틴 운영, 지속성이 모두 매우 높은 수준으로 올라온 단계예요. 전체적인 운동 완성도가 분명하게 드러나는 최상위 구간입니다.',
  },
];

// ─── 기본 변형 ─────────────────────────────────────────────────────────────────

/** variantId 미설정 또는 구 버전 variantId 폴백 시 사용하는 기본 변형 */
export const DEFAULT_PIXEL_VARIANT: PixelVariantId = 'wellness';

// ─── 유명인 콘텐츠 타입 ────────────────────────────────────────────────────────

export interface FitnessTypeCelebrity {
  name: string;          // "에디 홀"
  nameEn: string;        // "Eddie Hall"
  headline: string;      // "당신은 에디 홀형이에요."
  celebIntro: string;    // 유명인 소개 (2-3문장)
  typeStory: string;     // 이 유형의 이야기 (2-3문장)
  traits: [string, string, string]; // 이런 특징이 있어요 (정확히 3개)
  trainingTip: string;   // 운동 방향
  dietTip: string;       // 식단 방향
}

export interface FitnessTypeContent {
  id: PixelVariantId;
  label: string;              // "파워리프터형"
  male: FitnessTypeCelebrity;
  female: FitnessTypeCelebrity;
}

// ─── 이미지 맵 ────────────────────────────────────────────────────────────────

export type FitnessTypeImageVariants = {
  male?: ReturnType<typeof require>;
  female?: ReturnType<typeof require>;
  neutral?: ReturnType<typeof require>;
};

/**
 * 유형 ID → 성별 → 이미지 소스 맵
 *
 * Metro bundler는 require() 경로를 빌드 타임에 정적으로 분석하므로
 * 공백이 포함된 경로는 동적 조합 불가 — 개별 인라인 require() 필수
 */
export const FITNESS_TYPE_IMAGE_MAP: Record<PixelVariantId, FitnessTypeImageVariants> = {
  powerlifter: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    male:   require('../../assets/pixel/Eddie Hall.png'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    female: require('../../assets/pixel/Stefi Cohen.png'),
  },
  bodybuilder: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    male:   require('../../assets/pixel/Chris Bumstead.png'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    female: require('../../assets/pixel/Iris Kyle.png'),
  },
  lean_athlete: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    male:   require('../../assets/pixel/Zac Efron.png'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    female: require('../../assets/pixel/Kayla Itsines.png'),
  },
  transformer: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    male:   require('../../assets/pixel/Chris Pratt.png'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    female: require('../../assets/pixel/Adele.png'),
  },
  calisthenics: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    male:   require('../../assets/pixel/Chris Heria.png'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    female: require('../../assets/pixel/Chloe Ting.png'),
  },
  wellness: {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    male:   require('../../assets/pixel/Daniel Craig.png'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    female: require('../../assets/pixel/Jennifer Aniston.png'),
  },
};

// ─── 콘텐츠 데이터 (12명 celebrity) ──────────────────────────────────────────

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

// ─── 헬퍼 함수 ────────────────────────────────────────────────────────────────

/** 유형+성별로 이미지 소스 반환 (없으면 male 폴백) */
export function getFitnessTypeImage(
  typeId: PixelVariantId,
  genderVariant: FitnessTypeGenderVariant,
): ReturnType<typeof require> | null {
  const variants = FITNESS_TYPE_IMAGE_MAP[typeId];
  if (!variants) return null;
  return variants[genderVariant as 'male' | 'female'] ?? variants.male ?? null;
}

/** 유형+성별로 celebrity 콘텐츠 반환 (female 없으면 male 폴백) */
export function getFitnessTypeContent(
  typeId: PixelVariantId,
  genderVariant: FitnessTypeGenderVariant,
): FitnessTypeCelebrity {
  const content = FITNESS_TYPE_CONTENT[typeId];
  if (genderVariant === 'female') return content.female;
  return content.male;
}

/** 유형 label 반환 */
export function getFitnessTypeLabel(typeId: PixelVariantId): string {
  return FITNESS_TYPE_CONTENT[typeId]?.label ?? typeId;
}

// ─── 레거시 마이그레이션 맵 ────────────────────────────────────────────────────

/**
 * Supabase / AsyncStorage에 저장된 구버전 variantId → 신버전 매핑
 * rehydrate 시 자동 교체에 사용
 */
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

// ─── 아키타입 메타 ────────────────────────────────────────────────────────────

export interface ArchetypeMeta {
  id: CharacterArchetypeId;
  name: string;
  description: string;
}

export const ARCHETYPE_META: Record<CharacterArchetypeId, ArchetypeMeta> = {
  powerlifter: {
    id: 'powerlifter',
    name: '파워리프터',
    description: '중량과 힘이 전부인 타입',
  },
  mass_builder: {
    id: 'mass_builder',
    name: '매스 빌더',
    description: '몸을 키우는 게 목표인 타입',
  },
  lean_body: {
    id: 'lean_body',
    name: '린 바디',
    description: '단단하고 슬림한 체형 추구',
  },
  dieter: {
    id: 'dieter',
    name: '다이어터',
    description: '체중 감량이 현재 목표',
  },
  calisthenics: {
    id: 'calisthenics',
    name: '케리스테닉스',
    description: '맨몸 기술과 신체 컨트롤 추구',
  },
  wellness: {
    id: 'wellness',
    name: '웰니스형',
    description: '건강과 균형을 중시',
  },
  all_rounder: {
    id: 'all_rounder',
    name: '올라운더',
    description: '균형 잡힌 루틴 추구 (deprecated fallback)',
  },
};
