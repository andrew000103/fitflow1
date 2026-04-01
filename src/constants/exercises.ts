import { Exercise } from '../types/workout';

export const BUILT_IN_EXERCISES: Omit<Exercise, 'id'>[] = [
  // ── 가슴 ──────────────────────────────────────────────────────────────────
  { name_ko: '벤치 프레스',          name_en: 'Bench Press',               category: '가슴', default_rest_seconds: 180, is_custom: false },
  { name_ko: '인클라인 벤치 프레스', name_en: 'Incline Bench Press',        category: '가슴', default_rest_seconds: 120, is_custom: false },
  { name_ko: '디클라인 벤치 프레스', name_en: 'Decline Bench Press',        category: '가슴', default_rest_seconds: 120, is_custom: false },
  { name_ko: '클로즈그립 벤치 프레스', name_en: 'Close-Grip Bench Press',   category: '가슴', default_rest_seconds: 120, is_custom: false },
  { name_ko: '덤벨 벤치 프레스',     name_en: 'Dumbbell Bench Press',       category: '가슴', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '인클라인 덤벨 프레스', name_en: 'Incline Dumbbell Press',     category: '가슴', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '딥스',                  name_en: 'Dips',                       category: '가슴', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '케이블 플라이',         name_en: 'Cable Fly',                  category: '가슴', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '덤벨 플라이',           name_en: 'Dumbbell Fly',               category: '가슴', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '펙덱 플라이',           name_en: 'Pec Deck Fly',               category: '가슴', default_rest_seconds: 60,  is_custom: false },

  // ── 등 ────────────────────────────────────────────────────────────────────
  { name_ko: '컨벤셔널 데드리프트',   name_en: 'Conventional Deadlift',      category: '등',   default_rest_seconds: 180, is_custom: false },
  { name_ko: '스모 데드리프트',       name_en: 'Sumo Deadlift',              category: '등',   default_rest_seconds: 180, is_custom: false },
  { name_ko: '루마니안 데드리프트',   name_en: 'Romanian Deadlift',          category: '등',   default_rest_seconds: 120, is_custom: false },
  { name_ko: '바벨 로우',             name_en: 'Barbell Row',                category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: '덤벨 로우',             name_en: 'Dumbbell Row',               category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: 'T바 로우',              name_en: 'T-Bar Row',                  category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: '시티드 케이블 로우',    name_en: 'Seated Cable Row',           category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: '랫 풀다운',             name_en: 'Lat Pulldown',               category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: '풀업',                  name_en: 'Pull-Up',                    category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: '친업',                  name_en: 'Chin-Up',                    category: '등',   default_rest_seconds: 90,  is_custom: false },
  { name_ko: '페이스 풀',             name_en: 'Face Pull',                  category: '등',   default_rest_seconds: 60,  is_custom: false },
  { name_ko: '시티드 로우 머신',      name_en: 'Seated Row Machine',         category: '등',   default_rest_seconds: 90,  is_custom: false },

  // ── 어깨 ──────────────────────────────────────────────────────────────────
  { name_ko: '오버헤드 프레스',       name_en: 'Overhead Press',             category: '어깨', default_rest_seconds: 180, is_custom: false },
  { name_ko: '덤벨 숄더 프레스',      name_en: 'Dumbbell Shoulder Press',    category: '어깨', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '아놀드 프레스',          name_en: 'Arnold Press',               category: '어깨', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '사이드 레터럴 레이즈',  name_en: 'Side Lateral Raise',         category: '어깨', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '프론트 레이즈',          name_en: 'Front Raise',                category: '어깨', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '리어 델트 플라이',       name_en: 'Rear Delt Fly',              category: '어깨', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '업라이트 로우',          name_en: 'Upright Row',                category: '어깨', default_rest_seconds: 90,  is_custom: false },

  // ── 하체 ──────────────────────────────────────────────────────────────────
  { name_ko: '바벨 스쿼트',            name_en: 'Barbell Squat',              category: '하체', default_rest_seconds: 180, is_custom: false },
  { name_ko: '프론트 스쿼트',          name_en: 'Front Squat',                category: '하체', default_rest_seconds: 180, is_custom: false },
  { name_ko: '불가리안 스플릿 스쿼트', name_en: 'Bulgarian Split Squat',      category: '하체', default_rest_seconds: 120, is_custom: false },
  { name_ko: '레그 프레스',            name_en: 'Leg Press',                  category: '하체', default_rest_seconds: 120, is_custom: false },
  { name_ko: '레그 컬',                name_en: 'Leg Curl',                   category: '하체', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '레그 익스텐션',          name_en: 'Leg Extension',              category: '하체', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '런지',                   name_en: 'Lunge',                      category: '하체', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '힙 쓰러스트',            name_en: 'Hip Thrust',                 category: '하체', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '카프 레이즈',            name_en: 'Calf Raise',                 category: '하체', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '스텝업',                 name_en: 'Step-Up',                    category: '하체', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '굿모닝',                 name_en: 'Good Morning',               category: '하체', default_rest_seconds: 90,  is_custom: false },

  // ── 이두 ──────────────────────────────────────────────────────────────────
  { name_ko: '바이셉스 컬',            name_en: 'Biceps Curl',                category: '이두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '해머 컬',                name_en: 'Hammer Curl',                category: '이두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '인클라인 덤벨 컬',       name_en: 'Incline Dumbbell Curl',      category: '이두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '프리처 컬',              name_en: 'Preacher Curl',              category: '이두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '케이블 컬',              name_en: 'Cable Curl',                 category: '이두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '역그립 컬',              name_en: 'Reverse Curl',               category: '이두', default_rest_seconds: 60,  is_custom: false },

  // ── 삼두 ──────────────────────────────────────────────────────────────────
  { name_ko: '트라이셉스 푸시다운',    name_en: 'Triceps Pushdown',           category: '삼두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '오버헤드 트라이셉스 익스텐션', name_en: 'Overhead Triceps Extension', category: '삼두', default_rest_seconds: 60, is_custom: false },
  { name_ko: '스컬크러셔',             name_en: 'Skull Crusher',              category: '삼두', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '트라이셉스 딥스',        name_en: 'Triceps Dips',               category: '삼두', default_rest_seconds: 90,  is_custom: false },
  { name_ko: '케이블 킥백',            name_en: 'Cable Kickback',             category: '삼두', default_rest_seconds: 60,  is_custom: false },

  // ── 복근 ──────────────────────────────────────────────────────────────────
  { name_ko: '플랭크',                 name_en: 'Plank',                      category: '복근', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '크런치',                 name_en: 'Crunch',                     category: '복근', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '레그 레이즈',            name_en: 'Leg Raise',                  category: '복근', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '행잉 레그 레이즈',       name_en: 'Hanging Leg Raise',          category: '복근', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '러시안 트위스트',        name_en: 'Russian Twist',              category: '복근', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '케이블 크런치',          name_en: 'Cable Crunch',               category: '복근', default_rest_seconds: 60,  is_custom: false },
  { name_ko: '애브 롤아웃',            name_en: 'Ab Rollout',                 category: '복근', default_rest_seconds: 60,  is_custom: false },
];
