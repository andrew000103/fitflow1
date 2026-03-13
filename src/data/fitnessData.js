export const categoryLabels = {
  chest: '가슴',
  shoulders: '어깨',
  back: '등',
  legs: '하체',
  abs: '복근',
  arms: '팔',
}

export const workoutCatalog = {
  chest: ['Bench Press', 'Incline Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Chest Press Machine'],
  shoulders: ['Overhead Press', 'Seated Dumbbell Press', 'Lateral Raise', 'Rear Delt Fly', 'Face Pull'],
  back: ['Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'One Arm Dumbbell Row', 'Pull Up'],
  legs: ['Back Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift', 'Bulgarian Split Squat'],
  abs: ['Cable Crunch', 'Hanging Leg Raise', 'Ab Wheel Rollout', 'Plank', 'Reverse Crunch'],
  arms: ['Barbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher', 'Close Grip Bench Press'],
}

export const exerciseDetails = {
  'Bench Press': {
    focus: '가슴, 전면 어깨, 삼두',
    description: '가슴 전체와 삼두의 힘을 함께 끌어올리는 대표적인 수평 프레스 운동입니다.',
    cues: ['어깨를 뒤로 고정', '가슴 하단으로 컨트롤하며 내리기', '발로 바닥을 밀며 수직으로 밀기'],
  },
  'Incline Bench Press': {
    focus: '상부 가슴, 전면 어깨',
    description: '벤치 각도를 올려 상부 가슴 자극 비중을 높이는 프레스 변형입니다.',
    cues: ['벤치 각도를 과하게 높이지 않기', '쇄골 아래로 내리기', '팔꿈치를 과하게 벌리지 않기'],
  },
  'Incline Dumbbell Press': {
    focus: '상부 가슴',
    description: '좌우 밸런스를 맞추며 상부 가슴의 가동범위를 넓게 쓰기 좋은 덤벨 프레스입니다.',
    cues: ['덤벨을 가슴 옆까지 내리기', '손목을 곧게 유지', '위에서 덤벨을 부드럽게 모으기'],
  },
  'Cable Fly': {
    focus: '가슴',
    description: '가슴 수축을 끝범위까지 가져가기 좋은 고립 운동입니다.',
    cues: ['팔꿈치 각도 유지', '가슴을 열고 시작', '손보다 팔꿈치로 모은다는 느낌'],
  },
  'Chest Press Machine': {
    focus: '가슴, 삼두',
    description: '안정적인 머신 환경에서 프레스 볼륨을 쌓기 좋습니다.',
    cues: ['손잡이를 가슴 높이에 맞추기', '팔 완전 잠금 피하기', '내릴 때도 통제'],
  },
  'Overhead Press': {
    focus: '어깨, 삼두',
    description: '머리 위로 미는 패턴으로 어깨 전반과 상체 안정성을 강화합니다.',
    cues: ['복부와 둔근 긴장', '바 경로를 얼굴 가까이 유지', '귀 옆에서 마무리'],
  },
  'Seated Dumbbell Press': {
    focus: '어깨, 삼두',
    description: '앉은 자세에서 상체 반동을 줄이고 어깨에 집중하는 프레스입니다.',
    cues: ['허리를 과하게 꺾지 않기', '덤벨을 귀 옆에서 시작', '정수리 위로 밀어올리기'],
  },
  'Lateral Raise': {
    focus: '측면 어깨',
    description: '측면 삼각근 볼륨을 키우는 대표 고립 운동입니다.',
    cues: ['손보다 팔꿈치를 먼저 들기', '승모근 과개입 주의', '어깨 높이까지만 올리기'],
  },
  'Rear Delt Fly': {
    focus: '후면 어깨',
    description: '후면 삼각근과 견갑 안정성 보완에 좋은 운동입니다.',
    cues: ['상체 각도 고정', '팔꿈치로 벌리기', '승모근으로 끌어올리지 않기'],
  },
  'Face Pull': {
    focus: '후면 어깨, 상부 등',
    description: '후면 어깨와 상부 등을 함께 쓰는 밸런스용 케이블 운동입니다.',
    cues: ['로프를 눈 쪽으로 당기기', '팔꿈치를 바깥으로 열기', '끝에서 견갑을 모으기'],
  },
  'Lat Pulldown': {
    focus: '광배, 상부 등',
    description: '수직 당기기 패턴의 기본 운동으로 광배 사용을 익히기 좋습니다.',
    cues: ['가슴을 세우고 시작', '팔보다 팔꿈치를 아래로 끌기', '당길 때 반동 줄이기'],
  },
  'Barbell Row': {
    focus: '등 중부, 광배',
    description: '등 두께를 만드는 대표적인 수평 당기기 운동입니다.',
    cues: ['상체 각도 유지', '복압 유지', '명치 쪽으로 당기기'],
  },
  'Seated Cable Row': {
    focus: '등 중부, 광배',
    description: '안정적으로 등 수축을 느끼기 좋은 케이블 로우입니다.',
    cues: ['가슴을 열고 앉기', '팔꿈치를 뒤로 보내기', '끝에서 견갑을 모으기'],
  },
  'One Arm Dumbbell Row': {
    focus: '광배, 후면 어깨',
    description: '한쪽씩 집중해 좌우 밸런스를 보완하기 좋은 로우입니다.',
    cues: ['허리 회전 방지', '덤벨을 골반 쪽으로 당기기', '수축 후 천천히 내리기'],
  },
  'Pull Up': {
    focus: '광배, 상부 등, 이두',
    description: '자기 체중으로 수행하는 고난도 수직 당기기 운동입니다.',
    cues: ['어깨를 먼저 내리기', '가슴을 바 쪽으로 당기기', '반동 최소화'],
  },
  'Back Squat': {
    focus: '대퇴사두, 둔근, 코어',
    description: '하체 전반의 힘과 안정성을 동시에 키우는 대표 스쿼트입니다.',
    cues: ['발 전체로 바닥 누르기', '무릎과 발끝 방향 맞추기', '상체 긴장 유지'],
  },
  'Front Squat': {
    focus: '대퇴사두, 코어',
    description: '전면 하중으로 코어와 대퇴사두 비중이 커지는 스쿼트입니다.',
    cues: ['팔꿈치를 높게 유지', '가슴을 세우기', '수직에 가까운 상체 유지'],
  },
  'Leg Press': {
    focus: '대퇴사두, 둔근',
    description: '안정적인 머신 환경에서 하체 볼륨을 쌓기 좋은 운동입니다.',
    cues: ['허리 말림 주의', '무릎 잠금 피하기', '하강도 제어'],
  },
  'Romanian Deadlift': {
    focus: '햄스트링, 둔근',
    description: '햄스트링 신장성 자극에 강한 힙힌지 운동입니다.',
    cues: ['무릎은 살짝만 굽히기', '엉덩이를 뒤로 빼기', '바를 몸 가까이 유지'],
  },
  'Bulgarian Split Squat': {
    focus: '대퇴사두, 둔근',
    description: '한쪽 다리씩 자극하는 단측성 하체 운동입니다.',
    cues: ['앞발 중심 유지', '상체 각도 일정하게', '무릎 방향 정렬'],
  },
  'Cable Crunch': {
    focus: '복직근',
    description: '척추 굴곡 패턴으로 복직근 수축을 직접 느끼기 좋은 운동입니다.',
    cues: ['팔로 당기지 않기', '상체를 말아내리기', '짧게 수축 멈춤'],
  },
  'Hanging Leg Raise': {
    focus: '하복부',
    description: '매달린 상태에서 하복부와 코어 제어를 요구하는 운동입니다.',
    cues: ['반동 줄이기', '복부 긴장 유지', '천천히 내리기'],
  },
  'Ab Wheel Rollout': {
    focus: '복부, 코어 전반',
    description: '코어의 anti-extension 능력을 강하게 요구하는 운동입니다.',
    cues: ['허리가 꺾이지 않게', '가능한 범위까지만 전진', '복부로 복귀'],
  },
  Plank: {
    focus: '코어 전반',
    description: '정적인 자세 유지로 코어 안정성을 높이는 기본 운동입니다.',
    cues: ['머리부터 발끝까지 일직선', '엉덩이 처짐 방지', '복부와 둔근 동시 긴장'],
  },
  'Reverse Crunch': {
    focus: '하복부',
    description: '골반을 말아 올리며 하복부 자극을 느끼는 운동입니다.',
    cues: ['골반 말기에 집중', '허리를 바닥에 붙이기', '천천히 복귀'],
  },
  'Barbell Curl': {
    focus: '이두',
    description: '이두의 기본 굴곡 패턴을 만드는 대표 운동입니다.',
    cues: ['팔꿈치 고정', '상체 반동 최소화', '내릴 때 천천히'],
  },
  'Hammer Curl': {
    focus: '상완근, 전완',
    description: '중립 그립으로 상완근과 전완 개입을 높이는 컬입니다.',
    cues: ['덤벨을 몸통 가까이', '팔꿈치 고정', '탑에서 잠깐 멈춤'],
  },
  'Tricep Pushdown': {
    focus: '삼두',
    description: '삼두를 직접적으로 자극하는 가장 기본적인 케이블 운동입니다.',
    cues: ['팔꿈치를 몸 옆에 고정', '끝에서 삼두 수축', '반동 최소화'],
  },
  'Skull Crusher': {
    focus: '삼두',
    description: '누운 자세에서 수행하는 삼두 고립 운동입니다.',
    cues: ['상완 위치 고정', '이마 뒤쪽으로 내리기', '팔꿈치 과벌어짐 방지'],
  },
  'Close Grip Bench Press': {
    focus: '삼두, 가슴',
    description: '좁은 그립으로 삼두 비중을 높인 프레스 변형입니다.',
    cues: ['손 간격은 어깨너비 안팎', '팔꿈치를 몸 가까이', '손목-팔꿈치 정렬'],
  },
}

export const initialSets = [
  { id: 1, category: 'chest', exercise: 'Bench Press', reps: 8, weight: 60, volume: 480, calories: 38, createdAt: 'Today 18:20' },
  { id: 2, category: 'back', exercise: 'Lat Pulldown', reps: 12, weight: 45, volume: 540, calories: 43, createdAt: 'Today 17:40' },
  { id: 3, category: 'legs', exercise: 'Back Squat', reps: 6, weight: 90, volume: 540, calories: 43, createdAt: 'Yesterday 19:10' },
]

export const initialMeals = [
  { id: 1, name: 'Greek Yogurt Bowl', calories: 320, protein: 24, createdAt: '08:10' },
  { id: 2, name: 'Chicken Poke', calories: 520, protein: 38, createdAt: '13:10' },
]

export const initialPosts = [
  { id: 1, category: 'diet', title: '오늘의 오운완 인증', author: 'Mina', body: 'Push day 완료. 벤치 60kg 4세트 기록했고 저녁은 고단백으로 마무리할 예정입니다.', likes: 128, comments: 18 },
  { id: 2, category: 'bulk', title: '벌크업 저녁 메뉴 공유', author: 'Joon', body: '연어 덮밥과 계란 추가 조합이 생각보다 포만감도 좋고 칼로리 맞추기 편했습니다.', likes: 94, comments: 11 },
  { id: 3, category: 'maintain', title: '휴식 타이머 중 볼만한 숏폼', author: 'Sora', body: '다음 세트 전 60초 안에 볼 수 있는 흉추 가동성 루틴을 공유합니다.', likes: 76, comments: 9 },
]

export const weeklyData = [
  { day: 'Mon', workout: 54, intake: 2120, steps: 9120 },
  { day: 'Tue', workout: 62, intake: 1980, steps: 10840 },
  { day: 'Wed', workout: 38, intake: 2240, steps: 8420 },
  { day: 'Thu', workout: 71, intake: 2050, steps: 12610 },
  { day: 'Fri', workout: 66, intake: 2310, steps: 11840 },
  { day: 'Sat', workout: 49, intake: 2460, steps: 9540 },
  { day: 'Sun', workout: 28, intake: 1890, steps: 13210 },
]

export const quickTemplates = [
  { id: 'upper', label: '상체', exercises: ['Bench Press', 'Seated Cable Row', 'Overhead Press'] },
  { id: 'lower', label: '하체', exercises: ['Back Squat', 'Leg Press', 'Romanian Deadlift'] },
  { id: 'back', label: '등', exercises: ['Lat Pulldown', 'Barbell Row', 'Pull Up'] },
  { id: 'chest', label: '가슴', exercises: ['Bench Press', 'Incline Bench Press', 'Cable Fly'] },
  { id: 'shoulders', label: '어깨', exercises: ['Overhead Press', 'Lateral Raise', 'Face Pull'] },
  { id: 'arms', label: '팔', exercises: ['Barbell Curl', 'Hammer Curl', 'Tricep Pushdown'] },
]

export const programs = [
  {
    id: 'hypertrophy-a',
    name: 'Upper Hypertrophy Builder',
    week: 3,
    day: 2,
    streakWeeks: 5,
    exercises: [
      { category: 'chest', name: 'Bench Press', sets: 4, topSet: '60kg x 8' },
      { category: 'back', name: 'Seated Cable Row', sets: 4, topSet: '52kg x 10' },
      { category: 'shoulders', name: 'Lateral Raise', sets: 3, topSet: '8kg x 14' },
    ],
  },
  {
    id: 'lean-cut',
    name: 'Lean Cut Push Pull',
    week: 1,
    day: 4,
    streakWeeks: 2,
    exercises: [
      { category: 'legs', name: 'Back Squat', sets: 4, topSet: '90kg x 6' },
      { category: 'abs', name: 'Cable Crunch', sets: 3, topSet: '35kg x 15' },
    ],
  },
]

export const foodSuggestions = [
  { name: 'Chicken Poke', calories: 520, protein: 38 },
  { name: 'Greek Yogurt Bowl', calories: 320, protein: 24 },
  { name: 'Salmon Rice Bowl', calories: 610, protein: 36 },
  { name: 'Protein Shake', calories: 210, protein: 27 },
  { name: 'Egg Sandwich', calories: 430, protein: 22 },
]

export const muscleGroupOptions = [
  'All',
  'Chest',
  'Front Delts',
  'Middle Delts',
  'Rear Delts',
  'Biceps',
  'Triceps',
  'Forearms',
  'Lats',
  'Upper Back',
  'Lower Back',
  'Neck',
  'Abs',
  'Glutes',
  'Hamstrings',
  'Quadriceps',
]

export const equipmentOptions = [
  'All',
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Smith Machine',
  'Bodyweight',
  'EZ Bar',
  'Kettlebell',
  'Resistance Band',
]

export const exerciseDatabaseSeed = [
  { name: 'Bench Press', category: 'chest', target: 'Chest', secondary: 'Triceps', equipment: 'Barbell', icon: 'BP', note: '기본 가슴 프레스' },
  { name: 'Incline Bench Press', category: 'chest', target: 'Chest', secondary: 'Front Delts', equipment: 'Barbell', icon: 'IB', note: '상부 가슴 비중' },
  { name: 'Incline Dumbbell Press', category: 'chest', target: 'Chest', secondary: 'Front Delts', equipment: 'Dumbbell', icon: 'ID', note: '가동범위 확보' },
  { name: 'Cable Fly', category: 'chest', target: 'Chest', secondary: 'Front Delts', equipment: 'Cable', icon: 'CF', note: '수축 자극' },
  { name: 'Chest Press Machine', category: 'chest', target: 'Chest', secondary: 'Triceps', equipment: 'Machine', icon: 'CM', note: '안정적인 프레스' },
  { name: 'Overhead Press', category: 'shoulders', target: 'Front Delts', secondary: 'Triceps', equipment: 'Barbell', icon: 'OP', note: '전면 어깨 프레스' },
  { name: 'Seated Dumbbell Press', category: 'shoulders', target: 'Front Delts', secondary: 'Middle Delts', equipment: 'Dumbbell', icon: 'SD', note: '앉아서 수행' },
  { name: 'Lateral Raise', category: 'shoulders', target: 'Middle Delts', secondary: 'Forearms', equipment: 'Dumbbell', icon: 'LR', note: '측면 어깨 고립' },
  { name: 'Rear Delt Fly', category: 'shoulders', target: 'Rear Delts', secondary: 'Upper Back', equipment: 'Dumbbell', icon: 'RD', note: '후면 어깨 보완' },
  { name: 'Face Pull', category: 'shoulders', target: 'Rear Delts', secondary: 'Upper Back', equipment: 'Cable', icon: 'FP', note: '밸런스용' },
  { name: 'Lat Pulldown', category: 'back', target: 'Lats', secondary: 'Biceps', equipment: 'Cable', icon: 'LP', note: '광배 기본기' },
  { name: 'Barbell Row', category: 'back', target: 'Upper Back', secondary: 'Lats', equipment: 'Barbell', icon: 'BR', note: '등 두께' },
  { name: 'Seated Cable Row', category: 'back', target: 'Upper Back', secondary: 'Lats', equipment: 'Cable', icon: 'SR', note: '견갑 수축' },
  { name: 'One Arm Dumbbell Row', category: 'back', target: 'Lats', secondary: 'Upper Back', equipment: 'Dumbbell', icon: 'OR', note: '좌우 밸런스' },
  { name: 'Pull Up', category: 'back', target: 'Lats', secondary: 'Biceps', equipment: 'Bodyweight', icon: 'PU', note: '체중 기반' },
  { name: 'Back Squat', category: 'legs', target: 'Quadriceps', secondary: 'Glutes', equipment: 'Barbell', icon: 'SQ', note: '하체 기본기' },
  { name: 'Front Squat', category: 'legs', target: 'Quadriceps', secondary: 'Abs', equipment: 'Barbell', icon: 'FS', note: '전면 코어 강화' },
  { name: 'Leg Press', category: 'legs', target: 'Quadriceps', secondary: 'Glutes', equipment: 'Machine', icon: 'LP', note: '하체 볼륨용' },
  { name: 'Romanian Deadlift', category: 'legs', target: 'Hamstrings', secondary: 'Glutes', equipment: 'Barbell', icon: 'RD', note: '힙힌지' },
  { name: 'Bulgarian Split Squat', category: 'legs', target: 'Quadriceps', secondary: 'Glutes', equipment: 'Dumbbell', icon: 'BS', note: '단측성 하체' },
  { name: 'Cable Crunch', category: 'abs', target: 'Abs', secondary: 'Neck', equipment: 'Cable', icon: 'CC', note: '복직근 수축' },
  { name: 'Hanging Leg Raise', category: 'abs', target: 'Abs', secondary: 'Lats', equipment: 'Bodyweight', icon: 'HL', note: '하복부' },
  { name: 'Ab Wheel Rollout', category: 'abs', target: 'Abs', secondary: 'Lower Back', equipment: 'Bodyweight', icon: 'AW', note: '코어 anti-extension' },
  { name: 'Barbell Curl', category: 'arms', target: 'Biceps', secondary: 'Forearms', equipment: 'Barbell', icon: 'BC', note: '이두 기본기' },
  { name: 'Hammer Curl', category: 'arms', target: 'Biceps', secondary: 'Forearms', equipment: 'Dumbbell', icon: 'HC', note: '상완근 개입' },
  { name: 'Tricep Pushdown', category: 'arms', target: 'Triceps', secondary: 'Forearms', equipment: 'Cable', icon: 'TP', note: '삼두 기본기' },
  { name: 'Skull Crusher', category: 'arms', target: 'Triceps', secondary: 'Forearms', equipment: 'EZ Bar', icon: 'SC', note: '장두 자극' },
  { name: 'Close Grip Bench Press', category: 'arms', target: 'Triceps', secondary: 'Chest', equipment: 'Barbell', icon: 'CG', note: '삼두 중심 프레스' },
]

export const initialSessions = [
  {
    id: 'session-1',
    date: '2026-03-13',
    title: 'Push Day Volume',
    durationMinutes: 64,
    totalVolume: 4860,
    prCount: 1,
    calories: 388,
    condition: 'Good',
    rpe: 8,
    note: '벤치 탑셋이 잘 올라왔고 어깨 상태도 안정적이었다.',
    exercises: [
      {
        name: 'Bench Press',
        category: 'chest',
        setCount: 4,
        bestSet: '60kg x 8',
        maxWeight: 60,
        maxVolume: 480,
        estimated1RM: 76,
        timeline: [
          { previous: '57.5kg x 8', weight: 60, reps: 8 },
          { previous: '57.5kg x 8', weight: 60, reps: 8 },
        ],
      },
      {
        name: 'Overhead Press',
        category: 'shoulders',
        setCount: 3,
        bestSet: '35kg x 8',
        maxWeight: 35,
        maxVolume: 280,
        estimated1RM: 44,
        timeline: [
          { previous: '32.5kg x 8', weight: 35, reps: 8 },
        ],
      },
    ],
  },
  {
    id: 'session-2',
    date: '2026-03-11',
    title: 'Pull Day Strength',
    durationMinutes: 58,
    totalVolume: 4520,
    prCount: 0,
    calories: 342,
    condition: 'Normal',
    rpe: 7,
    note: '광배 자극은 좋았지만 후반 그립이 조금 빨리 지쳤다.',
    exercises: [
      {
        name: 'Lat Pulldown',
        category: 'back',
        setCount: 4,
        bestSet: '45kg x 12',
        maxWeight: 45,
        maxVolume: 540,
        estimated1RM: 63,
        timeline: [
          { previous: '42.5kg x 12', weight: 45, reps: 12 },
        ],
      },
      {
        name: 'Barbell Row',
        category: 'back',
        setCount: 4,
        bestSet: '55kg x 10',
        maxWeight: 55,
        maxVolume: 550,
        estimated1RM: 73,
        timeline: [
          { previous: '50kg x 10', weight: 55, reps: 10 },
        ],
      },
    ],
  },
]
