-- ================================================================
-- nSuns LP Programs Seed SQL
-- Supabase SQL Editor에서 실행 (RLS 우회)
--
-- 포함 프로그램:
--   1. nSuns 4-Day LP
--   2. nSuns 5-Day LP
--   3. nSuns 6-Day LP (스쿼트 특화)
--   4. nSuns 6-Day LP (데드리프트 특화)
--
-- 세트 구성 설명:
--   메인 리프트 (Volume 패턴, 9세트):
--     65%×8, 75%×6, 85%×4, 85%×4, 85%×4, 80%×5, 75%×6, 70%×7, 65%×AMRAP
--   메인 리프트 (5/3/1+ 패턴, 9세트):
--     75%×5, 85%×3, 95%×1+, 90%×3, 85%×3, 80%×3, 75%×5, 70%×5, 65%×AMRAP
--   보조 리프트 (8세트):
--     65%×6, 75%×5, 85%×3, 85%×5, 85%×7, 85%×4, 85%×6, 85%×8
--
-- Training Max(TM) = 1RM × 90%
-- 무게는 TM 기준 % 계산 필요 (target_weight_kg=0 으로 저장)
-- ================================================================

DO $$
DECLARE
  -- Exercise IDs
  bench_id        UUID;
  ohp_id          UUID;
  squat_id        UUID;
  deadlift_id     UUID;
  sumo_dl_id      UUID;
  front_squat_id  UUID;
  cg_bench_id     UUID;
  incline_bench_id UUID;

  -- Program IDs
  prog_4day_id       UUID;
  prog_5day_id       UUID;
  prog_6day_sq_id    UUID;
  prog_6day_dl_id    UUID;

  -- Temp day ID
  d UUID;

BEGIN

  -- ============================================================
  -- STEP 1: 기존 nSuns 프로그램 전체 삭제
  -- ============================================================
  DELETE FROM programs WHERE name LIKE 'nSuns%';


  -- ============================================================
  -- STEP 2: 운동 종목 확보 (없으면 생성)
  -- ============================================================

  -- 벤치프레스
  SELECT id INTO bench_id FROM exercises
    WHERE name_en = 'Bench Press' AND is_custom = FALSE LIMIT 1;
  IF bench_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('벤치프레스', 'Bench Press', '가슴', 180, FALSE)
    RETURNING id INTO bench_id;
  END IF;

  -- 오버헤드프레스
  SELECT id INTO ohp_id FROM exercises
    WHERE name_en = 'Overhead Press' AND is_custom = FALSE LIMIT 1;
  IF ohp_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('오버헤드프레스', 'Overhead Press', '어깨', 150, FALSE)
    RETURNING id INTO ohp_id;
  END IF;

  -- 스쿼트
  SELECT id INTO squat_id FROM exercises
    WHERE name_en = 'Squat' AND is_custom = FALSE LIMIT 1;
  IF squat_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('스쿼트', 'Squat', '하체', 180, FALSE)
    RETURNING id INTO squat_id;
  END IF;

  -- 데드리프트
  SELECT id INTO deadlift_id FROM exercises
    WHERE name_en = 'Deadlift' AND is_custom = FALSE LIMIT 1;
  IF deadlift_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('데드리프트', 'Deadlift', '등', 180, FALSE)
    RETURNING id INTO deadlift_id;
  END IF;

  -- 스모 데드리프트
  SELECT id INTO sumo_dl_id FROM exercises
    WHERE name_en = 'Sumo Deadlift' AND is_custom = FALSE LIMIT 1;
  IF sumo_dl_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('스모 데드리프트', 'Sumo Deadlift', '하체', 180, FALSE)
    RETURNING id INTO sumo_dl_id;
  END IF;

  -- 프론트 스쿼트
  SELECT id INTO front_squat_id FROM exercises
    WHERE name_en = 'Front Squat' AND is_custom = FALSE LIMIT 1;
  IF front_squat_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('프론트 스쿼트', 'Front Squat', '하체', 150, FALSE)
    RETURNING id INTO front_squat_id;
  END IF;

  -- 클로즈그립 벤치프레스
  SELECT id INTO cg_bench_id FROM exercises
    WHERE name_en = 'Close-Grip Bench Press' AND is_custom = FALSE LIMIT 1;
  IF cg_bench_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('클로즈그립 벤치프레스', 'Close-Grip Bench Press', '삼두', 150, FALSE)
    RETURNING id INTO cg_bench_id;
  END IF;

  -- 인클라인 벤치프레스
  SELECT id INTO incline_bench_id FROM exercises
    WHERE name_en = 'Incline Bench Press' AND is_custom = FALSE LIMIT 1;
  IF incline_bench_id IS NULL THEN
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    VALUES ('인클라인 벤치프레스', 'Incline Bench Press', '가슴', 150, FALSE)
    RETURNING id INTO incline_bench_id;
  END IF;


  -- ============================================================
  -- STEP 3: nSuns 4-Day LP
  -- ============================================================
  -- 구성: 월(벤치 Volume+OHP), 화(스쿼트 531+스모DL), 목(벤치 531+CG벤치), 금(데드 531+프론트스쿼트)
  INSERT INTO programs (
    user_id, creator_name, name, description,
    is_public, duration_weeks, days_per_week
  ) VALUES (
    NULL,
    'nSuns',
    'nSuns 4-Day LP',
    E'Reddit에서 유래한 고볼륨 선형 점진 파워리프팅 프로그램. 벤치·스쿼트·데드리프트·OHP 4대 리프트를 중심으로 매주 Training Max를 올려가며 꾸준히 강해지는 구조입니다.\n\n'
    '【대상】 중급자 이상 (빅4 동작에 익숙한 분). 주 4일 훈련 가능한 분.\n\n'
    '【Training Max(TM) 설정】\n'
    '  TM = 실제 1RM × 90%\n'
    '  예) 벤치 1RM 100kg → TM 90kg\n'
    '  모든 세트 무게는 이 TM을 기준으로 계산합니다.\n\n'
    '【주간 TM 증가 규칙】 — 매일 마지막 AMRAP(+) 세트 결과 기준\n'
    '  0~1개: TM 동결\n'
    '  2~3개: +2.5kg (상체) / +5kg (하체·데드)\n'
    '  4~5개: +2.5~5kg\n'
    '  6개 이상: +5~7.5kg\n\n'
    '【메인 리프트 세트 구성】\n'
    '  ▶ Volume 패턴 (월요일 벤치, 9세트)\n'
    '  65%×8 / 75%×6 / 85%×4 / 85%×4 / 85%×4\n'
    '  80%×5 / 75%×6 / 70%×7 / 65%×AMRAP\n\n'
    '  ▶ 5/3/1+ 패턴 (화 스쿼트·목 벤치·금 데드, 9세트)\n'
    '  75%×5 / 85%×3 / 95%×1+ / 90%×3 / 85%×3\n'
    '  80%×3 / 75%×5 / 70%×5 / 65%×AMRAP\n\n'
    '【보조 리프트 세트 구성】 (8세트, 보조 TM 기준)\n'
    '  65%×6 / 75%×5 / 85%×3 / 85%×5 / 85%×7\n'
    '  85%×4 / 85%×6 / 85%×8\n\n'
    '【일별 구성】\n'
    '  월: 벤치 (Volume) + OHP (보조)\n'
    '  화: 스쿼트 (5/3/1+) + 스모 데드리프트 (보조)\n'
    '  목: 벤치 (5/3/1+) + 클로즈그립 벤치 (보조)\n'
    '  금: 데드리프트 (5/3/1+) + 프론트 스쿼트 (보조)\n\n'
    '【보조 운동(Assistance)】 세션 후 가슴·등·어깨·팔·복근 중심으로 자유롭게 추가.',
    TRUE, 16, 4
  ) RETURNING id INTO prog_4day_id;

  -- Day 1: 월요일 - 벤치 Volume + OHP
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_4day_id, 1, '월요일 - 벤치 (Volume) + OHP')
  RETURNING id INTO d;

  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id,  0, 9, 8, 0),  -- 벤치 Volume: 65%×8 → 65%×AMRAP
    (d, ohp_id,    1, 8, 5, 0);  -- OHP 보조: 65%×6 → 85%×8

  -- Day 2: 화요일 - 스쿼트 5/3/1+ + 스모 데드리프트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_4day_id, 2, '화요일 - 스쿼트 (5/3/1+) + 스모 데드리프트')
  RETURNING id INTO d;

  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, squat_id,   0, 9, 5, 0),  -- 스쿼트 531: 75%×5 → 65%×AMRAP
    (d, sumo_dl_id, 1, 8, 5, 0);  -- 스모DL 보조

  -- Day 3: 목요일 - 벤치 5/3/1+ + 클로즈그립 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_4day_id, 3, '목요일 - 벤치 (5/3/1+) + 클로즈그립 벤치')
  RETURNING id INTO d;

  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id,    0, 9, 5, 0),  -- 벤치 531: 75%×5 → 65%×AMRAP
    (d, cg_bench_id, 1, 8, 5, 0);  -- CG 벤치 보조

  -- Day 4: 금요일 - 데드리프트 5/3/1+ + 프론트 스쿼트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_4day_id, 4, '금요일 - 데드리프트 (5/3/1+) + 프론트 스쿼트')
  RETURNING id INTO d;

  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, deadlift_id,    0, 9, 5, 0),  -- 데드 531: 75%×5 → 65%×AMRAP
    (d, front_squat_id, 1, 8, 5, 0);  -- 프론트스쿼트 보조


  -- ============================================================
  -- STEP 4: nSuns 5-Day LP
  -- ============================================================
  -- 구성: 월(벤치V+OHP), 화(스쿼트+스모DL), 수(OHP+인클라인), 목(데드+프론트스쿼트), 금(벤치+CG)
  INSERT INTO programs (
    user_id, creator_name, name, description,
    is_public, duration_weeks, days_per_week
  ) VALUES (
    NULL,
    'nSuns',
    'nSuns 5-Day LP',
    E'4-Day LP에서 수요일 OHP 전용 세션을 추가한 버전. OHP를 독립 메인 리프트로 다루기 때문에 상체(어깨·가슴·삼두) 발달에 더 유리합니다.\n\n'
    '【대상】 중급자 이상. 주 5일 훈련 가능하며 OHP 성장에 집중하고 싶은 분.\n\n'
    '【Training Max(TM) 설정】\n'
    '  TM = 실제 1RM × 90%\n'
    '  벤치·스쿼트·데드·OHP 4가지 TM을 각각 설정합니다.\n\n'
    '【주간 TM 증가 규칙】 — AMRAP 세트 결과 기준\n'
    '  0~1개: 동결 / 2~3개: +2.5kg / 4~5개: +2.5~5kg / 6개↑: +5~7.5kg\n\n'
    '【메인 리프트 세트 구성】\n'
    '  ▶ Volume 패턴 (월요일 벤치, 9세트)\n'
    '  65%×8 / 75%×6 / 85%×4 / 85%×4 / 85%×4\n'
    '  80%×5 / 75%×6 / 70%×7 / 65%×AMRAP\n\n'
    '  ▶ 5/3/1+ 패턴 (화·수·목·금, 9세트)\n'
    '  75%×5 / 85%×3 / 95%×1+ / 90%×3 / 85%×3\n'
    '  80%×3 / 75%×5 / 70%×5 / 65%×AMRAP\n\n'
    '【보조 리프트 세트 구성】 (8세트)\n'
    '  65%×6 / 75%×5 / 85%×3,5,7,4,6,8\n\n'
    '【일별 구성】\n'
    '  월: 벤치 (Volume) + OHP (보조)\n'
    '  화: 스쿼트 (5/3/1+) + 스모 데드리프트 (보조)\n'
    '  수: OHP (5/3/1+) + 인클라인 벤치 (보조)\n'
    '  목: 데드리프트 (5/3/1+) + 프론트 스쿼트 (보조)\n'
    '  금: 벤치 (5/3/1+) + 클로즈그립 벤치 (보조)\n\n'
    '【보조 운동(Assistance)】 세션 후 가슴·등·어깨·팔·복근 중심으로 자유롭게 추가.',
    TRUE, 16, 5
  ) RETURNING id INTO prog_5day_id;

  -- Day 1: 월요일 - 벤치 Volume + OHP
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_5day_id, 1, '월요일 - 벤치 (Volume) + OHP')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id, 0, 9, 8, 0),
    (d, ohp_id,   1, 8, 5, 0);

  -- Day 2: 화요일 - 스쿼트 + 스모 데드리프트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_5day_id, 2, '화요일 - 스쿼트 (5/3/1+) + 스모 데드리프트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, squat_id,   0, 9, 5, 0),
    (d, sumo_dl_id, 1, 8, 5, 0);

  -- Day 3: 수요일 - OHP + 인클라인 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_5day_id, 3, '수요일 - OHP (5/3/1+) + 인클라인 벤치')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, ohp_id,          0, 9, 5, 0),
    (d, incline_bench_id, 1, 8, 5, 0);

  -- Day 4: 목요일 - 데드리프트 + 프론트 스쿼트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_5day_id, 4, '목요일 - 데드리프트 (5/3/1+) + 프론트 스쿼트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, deadlift_id,    0, 9, 5, 0),
    (d, front_squat_id, 1, 8, 5, 0);

  -- Day 5: 금요일 - 벤치 5/3/1+ + 클로즈그립 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_5day_id, 5, '금요일 - 벤치 (5/3/1+) + 클로즈그립 벤치')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id,    0, 9, 5, 0),
    (d, cg_bench_id, 1, 8, 5, 0);


  -- ============================================================
  -- STEP 5: nSuns 6-Day LP (스쿼트 특화)
  -- ============================================================
  -- 구성: 5일 동일 + 토(스쿼트 추가볼륨+데드 보조)
  INSERT INTO programs (
    user_id, creator_name, name, description,
    is_public, duration_weeks, days_per_week
  ) VALUES (
    NULL,
    'nSuns',
    'nSuns 6-Day LP (스쿼트 특화)',
    E'5-Day LP에 토요일 스쿼트 전용 추가 볼륨 세션을 더한 버전. 스쿼트를 빠르게 올리고 싶거나 하체 볼륨을 극대화하려는 분에게 적합합니다.\n\n'
    '【대상】 중급~고급자. 주 6일 훈련 가능하며 스쿼트 성장을 최우선으로 하는 분.\n'
    '⚠ 주 6회는 피로 관리가 매우 중요합니다. 수면·영양에 충분히 신경 쓰세요.\n\n'
    '【Training Max(TM) 설정】\n'
    '  TM = 실제 1RM × 90%\n'
    '  벤치·스쿼트·데드·OHP 각각 별도 TM 설정.\n\n'
    '【주간 TM 증가 규칙】 — AMRAP 세트 결과 기준\n'
    '  0~1개: 동결 / 2~3개: +2.5kg / 4~5개: +2.5~5kg / 6개↑: +5~7.5kg\n\n'
    '【메인 리프트 세트 구성】\n'
    '  ▶ Volume 패턴 (월요일 벤치, 9세트)\n'
    '  65%×8 / 75%×6 / 85%×4 / 85%×4 / 85%×4\n'
    '  80%×5 / 75%×6 / 70%×7 / 65%×AMRAP\n\n'
    '  ▶ 5/3/1+ 패턴 (화~금, 9세트)\n'
    '  75%×5 / 85%×3 / 95%×1+ / 90%×3 / 85%×3\n'
    '  80%×3 / 75%×5 / 70%×5 / 65%×AMRAP\n\n'
    '【보조 리프트 세트 구성】 (8세트)\n'
    '  65%×6 / 75%×5 / 85%×3,5,7,4,6,8\n\n'
    '【일별 구성】\n'
    '  월: 벤치 (Volume) + OHP (보조)\n'
    '  화: 스쿼트 (5/3/1+) + 스모 데드리프트 (보조)\n'
    '  수: OHP (5/3/1+) + 인클라인 벤치 (보조)\n'
    '  목: 데드리프트 (5/3/1+) + 프론트 스쿼트 (보조)\n'
    '  금: 벤치 (5/3/1+) + 클로즈그립 벤치 (보조)\n'
    '  토: 스쿼트 추가 볼륨 (7세트×3회) + 데드리프트 보조 (7세트×3회)\n'
    '  ※ 토요일 무게: 스쿼트 TM의 약 80%, 데드 TM의 약 75% 고정\n\n'
    '【보조 운동(Assistance)】 세션 후 목표 부위에 맞게 자유롭게 추가.',
    TRUE, 16, 6
  ) RETURNING id INTO prog_6day_sq_id;

  -- Day 1: 월요일 - 벤치 Volume + OHP
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_sq_id, 1, '월요일 - 벤치 (Volume) + OHP')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id, 0, 9, 8, 0),
    (d, ohp_id,   1, 8, 5, 0);

  -- Day 2: 화요일 - 스쿼트 + 스모 데드리프트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_sq_id, 2, '화요일 - 스쿼트 (5/3/1+) + 스모 데드리프트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, squat_id,   0, 9, 5, 0),
    (d, sumo_dl_id, 1, 8, 5, 0);

  -- Day 3: 수요일 - OHP + 인클라인 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_sq_id, 3, '수요일 - OHP (5/3/1+) + 인클라인 벤치')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, ohp_id,           0, 9, 5, 0),
    (d, incline_bench_id, 1, 8, 5, 0);

  -- Day 4: 목요일 - 데드리프트 + 프론트 스쿼트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_sq_id, 4, '목요일 - 데드리프트 (5/3/1+) + 프론트 스쿼트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, deadlift_id,    0, 9, 5, 0),
    (d, front_squat_id, 1, 8, 5, 0);

  -- Day 5: 금요일 - 벤치 5/3/1+ + 클로즈그립 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_sq_id, 5, '금요일 - 벤치 (5/3/1+) + 클로즈그립 벤치')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id,    0, 9, 5, 0),
    (d, cg_bench_id, 1, 8, 5, 0);

  -- Day 6: 토요일 - 스쿼트 추가볼륨 + 데드 보조
  -- 원본 PDF: 스쿼트 7세트 × 3회, 데드리프트 7세트 × 3회 (고정 무게 볼륨 훈련)
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_sq_id, 6, '토요일 - 스쿼트 추가볼륨 + 데드리프트 보조')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, squat_id,    0, 7, 3, 0),  -- 스쿼트 7×3 (약 80% TM 고정)
    (d, deadlift_id, 1, 7, 3, 0);  -- 데드 7×3 (약 75% TM 고정)


  -- ============================================================
  -- STEP 6: nSuns 6-Day LP (데드리프트 특화)
  -- ============================================================
  -- 구성: 월(벤치V+OHP), 화(데드+프론트스쿼트), 수(OHP+인클라인), 목(스쿼트+스모DL), 금(벤치+CG), 토(데드+프론트스쿼트 추가볼륨)
  INSERT INTO programs (
    user_id, creator_name, name, description,
    is_public, duration_weeks, days_per_week
  ) VALUES (
    NULL,
    'nSuns',
    'nSuns 6-Day LP (데드리프트 특화)',
    E'5-Day LP에 토요일 데드리프트 전용 추가 볼륨 세션을 더한 버전. 화요일에 데드리프트를 메인 리프트로 배치하고, 토요일에 고중량 데드리프트 볼륨을 한 번 더 수행합니다.\n\n'
    '【대상】 중급~고급자. 주 6일 훈련 가능하며 데드리프트 성장을 최우선으로 하는 분.\n'
    '⚠ 데드리프트를 주 2회 수행하므로 허리 피로 관리에 유의하세요.\n\n'
    '【Training Max(TM) 설정】\n'
    '  TM = 실제 1RM × 90%\n'
    '  벤치·스쿼트·데드·OHP 각각 별도 TM 설정.\n\n'
    '【주간 TM 증가 규칙】 — AMRAP 세트 결과 기준\n'
    '  0~1개: 동결 / 2~3개: +2.5kg / 4~5개: +2.5~5kg / 6개↑: +5~7.5kg\n\n'
    '【메인 리프트 세트 구성】\n'
    '  ▶ Volume 패턴 (월요일 벤치, 9세트)\n'
    '  65%×8 / 75%×6 / 85%×4 / 85%×4 / 85%×4\n'
    '  80%×5 / 75%×6 / 70%×7 / 65%×AMRAP\n\n'
    '  ▶ 5/3/1+ 패턴 (화~금, 9세트)\n'
    '  75%×5 / 85%×3 / 95%×1+ / 90%×3 / 85%×3\n'
    '  80%×3 / 75%×5 / 70%×5 / 65%×AMRAP\n\n'
    '【보조 리프트 세트 구성】 (8세트)\n'
    '  65%×6 / 75%×5 / 85%×3,5,7,4,6,8\n\n'
    '【일별 구성】\n'
    '  월: 벤치 (Volume) + OHP (보조)\n'
    '  화: 데드리프트 (5/3/1+) + 프론트 스쿼트 (보조)\n'
    '  수: OHP (5/3/1+) + 인클라인 벤치 (보조)\n'
    '  목: 스쿼트 (5/3/1+) + 스모 데드리프트 (보조)\n'
    '  금: 벤치 (5/3/1+) + 클로즈그립 벤치 (보조)\n'
    '  토: 데드리프트 추가 볼륨 (8세트×3회) + 프론트 스쿼트 (6세트×3회)\n'
    '  ※ 토요일 무게: 데드 TM의 약 95%, 프론트스쿼트 TM의 약 65% 고정\n\n'
    '【보조 운동(Assistance)】 세션 후 목표 부위에 맞게 자유롭게 추가.',
    TRUE, 16, 6
  ) RETURNING id INTO prog_6day_dl_id;

  -- Day 1: 월요일 - 벤치 Volume + OHP
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_dl_id, 1, '월요일 - 벤치 (Volume) + OHP')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id, 0, 9, 8, 0),
    (d, ohp_id,   1, 8, 5, 0);

  -- Day 2: 화요일 - 데드리프트 + 프론트 스쿼트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_dl_id, 2, '화요일 - 데드리프트 (5/3/1+) + 프론트 스쿼트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, deadlift_id,    0, 9, 5, 0),
    (d, front_squat_id, 1, 8, 5, 0);

  -- Day 3: 수요일 - OHP + 인클라인 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_dl_id, 3, '수요일 - OHP (5/3/1+) + 인클라인 벤치')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, ohp_id,           0, 9, 5, 0),
    (d, incline_bench_id, 1, 8, 5, 0);

  -- Day 4: 목요일 - 스쿼트 + 스모 데드리프트
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_dl_id, 4, '목요일 - 스쿼트 (5/3/1+) + 스모 데드리프트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, squat_id,   0, 9, 5, 0),
    (d, sumo_dl_id, 1, 8, 5, 0);

  -- Day 5: 금요일 - 벤치 5/3/1+ + 클로즈그립 벤치
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_dl_id, 5, '금요일 - 벤치 (5/3/1+) + 클로즈그립 벤치')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, bench_id,    0, 9, 5, 0),
    (d, cg_bench_id, 1, 8, 5, 0);

  -- Day 6: 토요일 - 데드리프트 추가볼륨 + 프론트 스쿼트
  -- 원본 PDF: 데드 8세트×3회, 프론트스쿼트 6세트×3회 (고정 무게 볼륨 훈련)
  INSERT INTO program_days (program_id, day_number, name)
  VALUES (prog_6day_dl_id, 6, '토요일 - 데드리프트 추가볼륨 + 프론트 스쿼트')
  RETURNING id INTO d;
  INSERT INTO program_exercises (program_day_id, exercise_id, order_index, target_sets, target_reps, target_weight_kg)
  VALUES
    (d, deadlift_id,    0, 8, 3, 0),  -- 데드 8×3 (약 95% TM 고정)
    (d, front_squat_id, 1, 6, 3, 0);  -- 프론트스쿼트 6×3

  RAISE NOTICE 'nSuns 4개 프로그램 삽입 완료';
  RAISE NOTICE '  - nSuns 4-Day LP (id: %)', prog_4day_id;
  RAISE NOTICE '  - nSuns 5-Day LP (id: %)', prog_5day_id;
  RAISE NOTICE '  - nSuns 6-Day LP 스쿼트 특화 (id: %)', prog_6day_sq_id;
  RAISE NOTICE '  - nSuns 6-Day LP 데드리프트 특화 (id: %)', prog_6day_dl_id;

END $$;
