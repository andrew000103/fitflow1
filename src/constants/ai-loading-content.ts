// AI 플랜 로딩 화면 콘텐츠 데이터

export interface LoadingStep {
  icon: string;
  message: string;
  startAt: number; // 초 단위
}

export interface LoadingCard {
  type: 'feature' | 'tip';
  icon: string;
  title: string;
  body: string;
  category?: string; // tip 전용: '운동' | '식단' | '멘탈'
}

export const LOADING_STEPS: LoadingStep[] = [
  { icon: 'magnify', message: '신체 정보 분석 중...', startAt: 0 },
  { icon: 'silverware-fork-knife', message: '식단 구성 중...', startAt: 5 },
  { icon: 'arm-flex', message: '운동 계획 수립 중...', startAt: 10 },
  { icon: 'creation', message: '플랜 최적화 중...', startAt: 16 },
  { icon: 'target', message: '마무리 중...', startAt: 22 },
];

export const LOADING_CARDS: LoadingCard[] = [
  // 앱 기능 소개 (4장)
  {
    type: 'feature',
    icon: 'arm-flex',
    title: '운동 기록',
    body: '세트·반복·중량을 한 번에.\n휴식 타이머 자동 시작',
  },
  {
    type: 'feature',
    icon: 'silverware-fork-knife',
    title: '식단 검색',
    body: '국내외 식품 DB + 직접 입력.\n매크로 자동 계산',
  },
  {
    type: 'feature',
    icon: 'chart-bar',
    title: '홈 대시보드',
    body: '칼로리·운동·체중 변화를\n한눈에 확인',
  },
  {
    type: 'feature',
    icon: 'robot-outline',
    title: 'AI 주간 플랜',
    body: '매주 월요일 새 플랜.\n지난 주와 비교해서 진화',
  },
  // 운동·식단 팁 (10장)
  {
    type: 'tip',
    icon: 'lightbulb-on-outline',
    category: '운동',
    title: '단백질 최소 기준',
    body: '근성장을 위한 최소 단백질:\n체중(kg) × 1.6g/일',
  },
  {
    type: 'tip',
    icon: 'water-outline',
    category: '식단',
    title: '수분 섭취',
    body: '하루 체중(kg) × 30ml.\n공복감의 30%는 갈증',
  },
  {
    type: 'tip',
    icon: 'chart-line',
    category: '운동',
    title: '점진적 과부하',
    body: '매주 중량 2.5~5% 증가가\n성장의 핵심',
  },
  {
    type: 'tip',
    icon: 'food-steak',
    category: '식단',
    title: '포만감 차이',
    body: '단백질은 포만감 지속 시간이\n탄수화물의 2배',
  },
  {
    type: 'tip',
    icon: 'sleep',
    category: '운동',
    title: '수면과 근성장',
    body: '수면 7시간 이상이\n테스토스테론 생성의 기본 조건',
  },
  {
    type: 'tip',
    icon: 'bowl-mix-outline',
    category: '식단',
    title: '혈당 관리',
    body: '식사 직전 채소 섭취 →\n혈당 스파이크 20~30% 감소',
  },
  {
    type: 'tip',
    icon: 'weight-lifter',
    category: '운동',
    title: '다관절 운동',
    body: '데드리프트·스쿼트 같은\n다관절 운동이 단시간 효율 최고',
  },
  {
    type: 'tip',
    icon: 'rice',
    category: '식단',
    title: '현미 vs 백미',
    body: '혈당지수 55 vs 72.\n현미가 포만감 2배',
  },
  {
    type: 'tip',
    icon: 'arm-flex',
    category: '운동',
    title: '근육통 오해',
    body: 'DOMS는 성장 신호가 아님.\n회복이 잘 되고 있다는 신호',
  },
  {
    type: 'tip',
    icon: 'brain',
    category: '멘탈',
    title: '21일 법칙',
    body: '3주 지속 시 습관 형성 시작.\n처음 21일이 가장 중요',
  },
];
