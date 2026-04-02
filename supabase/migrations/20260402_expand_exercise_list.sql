BEGIN;

-- 1. Rename existing exercises
UPDATE exercises SET name_ko = '바벨 백스쿼트', name_en = 'Barbell Back Squat', category = '하체', default_rest_seconds = 180 WHERE name_ko = '바벨 스쿼트' AND is_custom = false;
UPDATE exercises SET name_ko = '아놀드 덤벨 프레스', name_en = 'Arnold Dumbbell Press', category = '어깨', default_rest_seconds = 120 WHERE name_ko = '아놀드 프레스' AND is_custom = false;
UPDATE exercises SET name_ko = '덤벨 레터럴 레이즈', name_en = 'Dumbbell Lateral Raise', category = '어깨', default_rest_seconds = 90 WHERE name_ko = '사이드 레터럴 레이즈' AND is_custom = false;
UPDATE exercises SET name_ko = '바벨 컬', name_en = 'Barbell Curl', category = '팔', default_rest_seconds = 90 WHERE name_ko = '바이셉스 컬' AND is_custom = false;
UPDATE exercises SET name_ko = '덤벨 해머 컬', name_en = 'Dumbbell Hammer Curl', category = '팔', default_rest_seconds = 90 WHERE name_ko = '해머 컬' AND is_custom = false;
UPDATE exercises SET name_ko = '케이블 푸시 다운', name_en = 'Cable Push Down', category = '팔', default_rest_seconds = 90 WHERE name_ko = '트라이셉스 푸시다운' AND is_custom = false;
UPDATE exercises SET name_ko = '스컬 크러셔', name_en = 'Skull Crusher', category = '팔', default_rest_seconds = 90 WHERE name_ko = '스컬크러셔' AND is_custom = false;
UPDATE exercises SET name_ko = '복근 롤아웃', name_en = 'Ab Rollout', category = '복근', default_rest_seconds = 90 WHERE name_ko = '애브 롤아웃' AND is_custom = false;
UPDATE exercises SET name_ko = '벤치프레스', name_en = 'Bench Press', category = '가슴', default_rest_seconds = 180 WHERE name_ko = '벤치 프레스' AND is_custom = false;
UPDATE exercises SET name_ko = '인클라인 벤치프레스', name_en = 'Incline Bench Press', category = '가슴', default_rest_seconds = 150 WHERE name_ko = '인클라인 벤치 프레스' AND is_custom = false;
UPDATE exercises SET name_ko = '디클라인 벤치프레스', name_en = 'Decline Bench Press', category = '가슴', default_rest_seconds = 150 WHERE name_ko = '디클라인 벤치 프레스' AND is_custom = false;
UPDATE exercises SET name_ko = '덤벨 벤치프레스', name_en = 'Dumbbell Bench Press', category = '가슴', default_rest_seconds = 120 WHERE name_ko = '덤벨 벤치 프레스' AND is_custom = false;
UPDATE exercises SET name_ko = '인클라인 덤벨 벤치프레스', name_en = 'Incline Dumbbell Bench Press', category = '가슴', default_rest_seconds = 120 WHERE name_ko = '인클라인 덤벨 프레스' AND is_custom = false;
UPDATE exercises SET name_ko = '스탠딩 케이블 플라이', name_en = 'Standing Cable Fly', category = '가슴', default_rest_seconds = 90 WHERE name_ko = '케이블 플라이' AND is_custom = false;
UPDATE exercises SET name_ko = '펙덱 플라이 머신', name_en = 'Pec Deck Fly Machine', category = '가슴', default_rest_seconds = 90 WHERE name_ko = '펙덱 플라이' AND is_custom = false;
UPDATE exercises SET name_ko = '티바 로우 머신', name_en = 'T-Bar Row Machine', category = '등', default_rest_seconds = 120 WHERE name_ko = 'T바 로우' AND is_custom = false;
UPDATE exercises SET name_ko = '랫풀다운', name_en = 'Lat Pulldown', category = '등', default_rest_seconds = 120 WHERE name_ko = '랫 풀다운' AND is_custom = false;
UPDATE exercises SET name_ko = '굿모닝 엑서사이즈', name_en = 'Good Morning Exercise', category = '등', default_rest_seconds = 120 WHERE name_ko = '굿모닝' AND is_custom = false;
UPDATE exercises SET name_ko = '클로즈 그립 벤치프레스', name_en = 'Close Grip Bench Press', category = '팔', default_rest_seconds = 150 WHERE name_ko = '클로즈그립 벤치 프레스' AND is_custom = false;


-- 2. Update ai_plans JSON for renamed exercises
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"바벨 스쿼트"', '"name":"바벨 백스쿼트"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"바벨 스쿼트"', '"exercise":"바벨 백스쿼트"')::jsonb WHERE plan_json::text LIKE '%"name":"바벨 스쿼트"%' OR generation_context::text LIKE '%"exercise":"바벨 스쿼트"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"아놀드 프레스"', '"name":"아놀드 덤벨 프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"아놀드 프레스"', '"exercise":"아놀드 덤벨 프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"아놀드 프레스"%' OR generation_context::text LIKE '%"exercise":"아놀드 프레스"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"사이드 레터럴 레이즈"', '"name":"덤벨 레터럴 레이즈"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"사이드 레터럴 레이즈"', '"exercise":"덤벨 레터럴 레이즈"')::jsonb WHERE plan_json::text LIKE '%"name":"사이드 레터럴 레이즈"%' OR generation_context::text LIKE '%"exercise":"사이드 레터럴 레이즈"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"바이셉스 컬"', '"name":"바벨 컬"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"바이셉스 컬"', '"exercise":"바벨 컬"')::jsonb WHERE plan_json::text LIKE '%"name":"바이셉스 컬"%' OR generation_context::text LIKE '%"exercise":"바이셉스 컬"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"해머 컬"', '"name":"덤벨 해머 컬"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"해머 컬"', '"exercise":"덤벨 해머 컬"')::jsonb WHERE plan_json::text LIKE '%"name":"해머 컬"%' OR generation_context::text LIKE '%"exercise":"해머 컬"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"트라이셉스 푸시다운"', '"name":"케이블 푸시 다운"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"트라이셉스 푸시다운"', '"exercise":"케이블 푸시 다운"')::jsonb WHERE plan_json::text LIKE '%"name":"트라이셉스 푸시다운"%' OR generation_context::text LIKE '%"exercise":"트라이셉스 푸시다운"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"스컬크러셔"', '"name":"스컬 크러셔"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"스컬크러셔"', '"exercise":"스컬 크러셔"')::jsonb WHERE plan_json::text LIKE '%"name":"스컬크러셔"%' OR generation_context::text LIKE '%"exercise":"스컬크러셔"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"애브 롤아웃"', '"name":"복근 롤아웃"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"애브 롤아웃"', '"exercise":"복근 롤아웃"')::jsonb WHERE plan_json::text LIKE '%"name":"애브 롤아웃"%' OR generation_context::text LIKE '%"exercise":"애브 롤아웃"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"벤치 프레스"', '"name":"벤치프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"벤치 프레스"', '"exercise":"벤치프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"벤치 프레스"%' OR generation_context::text LIKE '%"exercise":"벤치 프레스"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"인클라인 벤치 프레스"', '"name":"인클라인 벤치프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"인클라인 벤치 프레스"', '"exercise":"인클라인 벤치프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"인클라인 벤치 프레스"%' OR generation_context::text LIKE '%"exercise":"인클라인 벤치 프레스"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"디클라인 벤치 프레스"', '"name":"디클라인 벤치프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"디클라인 벤치 프레스"', '"exercise":"디클라인 벤치프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"디클라인 벤치 프레스"%' OR generation_context::text LIKE '%"exercise":"디클라인 벤치 프레스"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"덤벨 벤치 프레스"', '"name":"덤벨 벤치프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"덤벨 벤치 프레스"', '"exercise":"덤벨 벤치프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"덤벨 벤치 프레스"%' OR generation_context::text LIKE '%"exercise":"덤벨 벤치 프레스"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"인클라인 덤벨 프레스"', '"name":"인클라인 덤벨 벤치프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"인클라인 덤벨 프레스"', '"exercise":"인클라인 덤벨 벤치프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"인클라인 덤벨 프레스"%' OR generation_context::text LIKE '%"exercise":"인클라인 덤벨 프레스"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"케이블 플라이"', '"name":"스탠딩 케이블 플라이"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"케이블 플라이"', '"exercise":"스탠딩 케이블 플라이"')::jsonb WHERE plan_json::text LIKE '%"name":"케이블 플라이"%' OR generation_context::text LIKE '%"exercise":"케이블 플라이"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"펙덱 플라이"', '"name":"펙덱 플라이 머신"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"펙덱 플라이"', '"exercise":"펙덱 플라이 머신"')::jsonb WHERE plan_json::text LIKE '%"name":"펙덱 플라이"%' OR generation_context::text LIKE '%"exercise":"펙덱 플라이"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"T바 로우"', '"name":"티바 로우 머신"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"T바 로우"', '"exercise":"티바 로우 머신"')::jsonb WHERE plan_json::text LIKE '%"name":"T바 로우"%' OR generation_context::text LIKE '%"exercise":"T바 로우"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"랫 풀다운"', '"name":"랫풀다운"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"랫 풀다운"', '"exercise":"랫풀다운"')::jsonb WHERE plan_json::text LIKE '%"name":"랫 풀다운"%' OR generation_context::text LIKE '%"exercise":"랫 풀다운"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"굿모닝"', '"name":"굿모닝 엑서사이즈"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"굿모닝"', '"exercise":"굿모닝 엑서사이즈"')::jsonb WHERE plan_json::text LIKE '%"name":"굿모닝"%' OR generation_context::text LIKE '%"exercise":"굿모닝"%';
UPDATE ai_plans SET plan_json = replace(plan_json::text, '"name":"클로즈그립 벤치 프레스"', '"name":"클로즈 그립 벤치프레스"')::jsonb, generation_context = replace(generation_context::text, '"exercise":"클로즈그립 벤치 프레스"', '"exercise":"클로즈 그립 벤치프레스"')::jsonb WHERE plan_json::text LIKE '%"name":"클로즈그립 벤치 프레스"%' OR generation_context::text LIKE '%"exercise":"클로즈그립 벤치 프레스"%';


-- 3. Insert new exercises
-- Loop through the provided list and insert if not exists
DO $$
DECLARE
    exercise_name_ko TEXT;
    exercise_name_en TEXT;
    exercise_category TEXT;
    exercise_rest INT;
BEGIN
    -- 하체
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 스플릿 스쿼트', 'Smith Machine Split Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 스플릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 데드리프트', 'Smith Machine Deadlift', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 스쿼트', 'Smith Machine Squat', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 런지', 'Dumbbell Lunge', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 고블릿 스쿼트', 'Dumbbell Goblet Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 고블릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스티프 레그 데드리프트', 'Dumbbell Stiff Leg Deadlift', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스티프 레그 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '저처 스쿼트', 'Zercher Squat', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '저처 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 불가리안 스플릿 스쿼트', 'Barbell Bulgarian Split Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 불가리안 스플릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 불가리안 스플릿 스쿼트', 'Dumbbell Bulgarian Split Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 불가리안 스플릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스플릿 스쿼트', 'Dumbbell Split Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스플릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '맨몸 스플릿 스쿼트', 'Bodyweight Split Squat', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '맨몸 스플릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '에어 스쿼트', 'Air Squat', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '에어 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '점프 스쿼트', 'Jump Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '점프 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 고블릿 스쿼트', 'Kettlebell Goblet Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 고블릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스탠딩 카프 레이즈', 'Standing Calf Raise', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스탠딩 카프 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이너 싸이 머신', 'Inner Thigh Machine', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이너 싸이 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 스텝업', 'Weighted Step-up', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 스텝업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 힙 쓰러스트', 'Barbell Hip Thrust', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 힙 쓰러스트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '브이 스쿼트', 'V-Squat', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '브이 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리버스 브이 스쿼트', 'Reverse V-Squat', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리버스 브이 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '글루트 킥백 머신', 'Glute Kickback Machine', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '글루트 킥백 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '힙 어브덕션 머신', 'Hip Abduction Machine', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '힙 어브덕션 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 카프 레이즈', 'Seated Calf Raise', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 카프 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '정지 백 스쿼트', 'Paused Back Squat', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '정지 백 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '트랩바 데드리프트', 'Trap Bar Deadlift', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '트랩바 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 힙 어브덕션', 'Cable Hip Abduction', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 힙 어브덕션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '핵 스쿼트 머신', 'Hack Squat Machine', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '핵 스쿼트 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '정지 데드리프트', 'Paused Deadlift', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '정지 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '정지 스모 데드리프트', 'Paused Sumo Deadlift', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '정지 스모 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 박스 스쿼트', 'Barbell Box Squat', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 박스 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 프론트 랙 런지', 'Barbell Front Rack Lunge', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 프론트 랙 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 점프 스쿼트', 'Barbell Jump Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 점프 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 런지', 'Barbell Lunge', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 레터럴 런지', 'Barbell Lateral Lunge', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 레터럴 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 스플릿 스쿼트', 'Barbell Split Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 스플릿 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 스탠딩 카프 레이즈', 'Barbell Standing Calf Raise', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 스탠딩 카프 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스티프 레그 데드리프트', 'Stiff Leg Deadlift', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스티프 레그 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '맨몸 오버헤드 스쿼트', 'Bodyweight Overhead Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '맨몸 오버헤드 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스모 스쿼트', 'Dumbbell Sumo Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스모 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 레그 컬', 'Dumbbell Leg Curl', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 레그 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스쿼트', 'Dumbbell Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 핵 스쿼트', 'Barbell Hack Squat', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 핵 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 레그 컬', 'Seated Leg Curl', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 레그 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '힙 쓰러스트 머신', 'Hip Thrust Machine', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '힙 쓰러스트 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '맨몸 카프 레이즈', 'Bodyweight Calf Raise', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '맨몸 카프 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '글루트 브릿지', 'Glute Bridge', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '글루트 브릿지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 루마니안 데드리프트', 'Dumbbell Romanian Deadlift', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 루마니안 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '라잉 힙 어브덕션', 'Lying Hip Abduction', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '라잉 힙 어브덕션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '싱글 레그 글루트 브릿지', 'Single Leg Glute Bridge', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '싱글 레그 글루트 브릿지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '피스톨 박스 스쿼트', 'Pistol Box Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '피스톨 박스 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '사이드 라잉 클램', 'Side Lying Clam', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '사이드 라잉 클램' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '맨몸 원레그 데드리프트', 'Bodyweight Single Leg Deadlift', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '맨몸 원레그 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 원레그 데드리프트', 'Barbell Single Leg Deadlift', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 원레그 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 원레그 데드리프트', 'Dumbbell Single Leg Deadlift', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 원레그 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 데드리프트', 'Kettlebell Deadlift', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 스모 데드리프트', 'Kettlebell Sumo Deadlift', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 스모 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스모 데드리프트', 'Dumbbell Sumo Deadlift', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스모 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 레터럴 런지', 'Dumbbell Lateral Lunge', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 레터럴 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 레터럴 런지', 'Kettlebell Lateral Lunge', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 레터럴 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '맨몸 레터럴 런지', 'Bodyweight Lateral Lunge', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '맨몸 레터럴 런지' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원레그 익스텐션', 'Single Leg Extension', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원레그 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원레그 컬', 'Single Leg Curl', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원레그 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원레그 프레스', 'Single Leg Press', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원레그 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '수평 레그 프레스', 'Horizontal Leg Press', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '수평 레그 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '수평 원레그 프레스', 'Horizontal Single Leg Press', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '수평 원레그 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 원레그 컬', 'Seated Single Leg Curl', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 원레그 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '노르딕 햄스트링 컬', 'Nordic Hamstring Curl', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '노르딕 햄스트링 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 스모 스쿼트', 'Barbell Sumo Squat', '하체', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 스모 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 스모 스쿼트', 'Kettlebell Sumo Squat', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 스모 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스모 에어 스쿼트', 'Sumo Air Squat', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스모 에어 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '피스톨 스쿼트', 'Pistol Squat', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '피스톨 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덩키 킥', 'Donkey Kick', '하체', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덩키 킥' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 덩키 킥', 'Cable Donkey Kick', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 덩키 킥' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '데피싯 데드리프트', 'Deficit Deadlift', '하체', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '데피싯 데드리프트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '런지 트위스트', 'Lunge Twist', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '런지 트위스트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 런지 트위스트', 'Kettlebell Lunge Twist', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 런지 트위스트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 풀 스루', 'Cable Pull Through', '하체', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 풀 스루' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '몬스터 글루트 머신', 'Monster Glute Machine', '하체', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '몬스터 글루트 머신' AND is_custom = false
    );

    -- 어깨
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 오버헤드 프레스', 'Smith Machine Overhead Press', '어깨', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 오버헤드 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 슈러그', 'Smith Machine Shrug', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 슈러그' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '벤트오버 덤벨 레터럴 레이즈', 'Bent-Over Dumbbell Lateral Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '벤트오버 덤벨 레터럴 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '숄더 프레스 머신', 'Shoulder Press Machine', '어깨', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '숄더 프레스 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '비하인드 넥 프레스', 'Behind the Neck Press', '어깨', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '비하인드 넥 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 프론트 레이즈', 'Dumbbell Front Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 프론트 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 슈러그', 'Dumbbell Shrug', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 슈러그' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 슈러그', 'Barbell Shrug', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 슈러그' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '핸드스탠드', 'Handstand', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '핸드스탠드' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '핸드스탠드 푸시업', 'Handstand Push-up', '어깨', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '핸드스탠드 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 리버스 플라이', 'Cable Reverse Fly', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 리버스 플라이' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 업라이트 로우', 'Barbell Upright Row', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 업라이트 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 업라이트 로우', 'Dumbbell Upright Row', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 업라이트 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이지바 업라이트 로우', 'EZ Bar Upright Row', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이지바 업라이트 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '푸시 프레스', 'Push Press', '어깨', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '푸시 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리어 델토이드 플라이 머신', 'Rear Deltoid Fly Machine', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리어 델토이드 플라이 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '레터럴 레이즈 머신', 'Lateral Raise Machine', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '레터럴 레이즈 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 레터럴 레이즈', 'Cable Lateral Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 레터럴 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 프론트 레이즈', 'Cable Front Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 프론트 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이지바 프론트 레이즈', 'EZ Bar Front Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이지바 프론트 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 덤벨 리어 레터럴 레이즈', 'Seated Dumbbell Rear Lateral Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 덤벨 리어 레터럴 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '숄더 탭', 'Shoulder Tap', '어깨', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '숄더 탭' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 바벨 숄더 프레스', 'Seated Barbell Shoulder Press', '어깨', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 바벨 숄더 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 덤벨 숄더 프레스', 'Seated Dumbbell Shoulder Press', '어깨', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 덤벨 숄더 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '플레이트 숄더 프레스', 'Plate Shoulder Press', '어깨', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '플레이트 숄더 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT 'Y 레이즈', 'Y-Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = 'Y 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 Y 레이즈', 'Dumbbell Y-Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 Y 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '슈러그 머신', 'Shrug Machine', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '슈러그 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 슈러그', 'Cable Shrug', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 슈러그' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 인터널 로테이션', 'Cable Internal Rotation', '어깨', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 인터널 로테이션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 익스터널 로테이션', 'Cable External Rotation', '어깨', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 익스터널 로테이션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 케이블 레터럴 레이즈', 'One-Arm Cable Lateral Raise', '어깨', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 케이블 레터럴 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '랜드마인 프레스', 'Landmine Press', '어깨', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '랜드마인 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 랜드마인 프레스', 'One-Arm Landmine Press', '어깨', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 랜드마인 프레스' AND is_custom = false
    );
    -- 가슴
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 벤치프레스', 'Smith Machine Bench Press', '가슴', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 벤치프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 인클라인 벤치프레스', 'Smith Machine Incline Bench Press', '가슴', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 인클라인 벤치프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스탠딩 케이블 플라이', 'Standing Cable Fly', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스탠딩 케이블 플라이' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 딥스', 'Weighted Dips', '가슴', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 딥스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 덤벨 플라이', 'Incline Dumbbell Fly', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 덤벨 플라이' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '푸시업', 'Push-up', '가슴', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 푸시업', 'Weighted Push-up', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '힌두 푸시업', 'Hindu Push-up', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '힌두 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '아처 푸시업', 'Archer Push-up', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '아처 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '클로즈그립 푸시업', 'Close-Grip Push-up', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '클로즈그립 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '체스트 프레스 머신', 'Chest Press Machine', '가슴', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '체스트 프레스 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '펙덱 플라이 머신', 'Pec Deck Fly Machine', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '펙덱 플라이 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 벤치프레스 머신', 'Incline Bench Press Machine', '가슴', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 벤치프레스 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 풀오버', 'Dumbbell Pullover', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 풀오버' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 딥스 머신', 'Seated Dips Machine', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 딥스 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '로우 풀리 케이블 플라이', 'Low Pulley Cable Fly', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '로우 풀리 케이블 플라이' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '해머 벤치프레스', 'Hammer Bench Press', '가슴', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '해머 벤치프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스포토 벤치프레스', 'Spoto Bench Press', '가슴', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스포토 벤치프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '어시스트 딥스 머신', 'Assisted Dips Machine', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '어시스트 딥스 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 플로어 프레스', 'Barbell Floor Press', '가슴', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 플로어 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '클랩 푸시업', 'Clap Push-up', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '클랩 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '디클라인 덤벨 플라이', 'Decline Dumbbell Fly', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '디클라인 덤벨 플라이' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 푸시업', 'Incline Push-up', '가슴', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '파이크 푸시업', 'Pike Push-up', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '파이크 푸시업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '디클라인 체스트 프레스 머신', 'Decline Chest Press Machine', '가슴', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '디클라인 체스트 프레스 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 덤벨 트위스트 프레스', 'Incline Dumbbell Twist Press', '가슴', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 덤벨 트위스트 프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 케이블 플라이', 'Incline Cable Fly', '가슴', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 케이블 플라이' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스퀴즈 프레스', 'Dumbbell Squeeze Press', '가슴', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스퀴즈 프레스' AND is_custom = false
    );
    -- 팔
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 트라이셉 익스텐션', 'Dumbbell Tricep Extension', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 트라이셉 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 킥백', 'Dumbbell Kickback', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 킥백' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이지바 컬', 'EZ Bar Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이지바 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '클로즈 그립 벤치프레스', 'Close Grip Bench Press', '팔', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '클로즈 그립 벤치프레스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '시티드 덤벨 트라이셉 익스텐션', 'Seated Dumbbell Tricep Extension', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '시티드 덤벨 트라이셉 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 트라이셉 익스텐션', 'Cable Tricep Extension', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 트라이셉 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 리스트 컬', 'Barbell Wrist Curl', '팔', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 리스트 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이지바 리스트 컬', 'EZ Bar Wrist Curl', '팔', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이지바 리스트 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 리스트 컬', 'Dumbbell Wrist Curl', '팔', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 리스트 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 라잉 트라이셉 익스텐션', 'Barbell Lying Tricep Extension', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 라잉 트라이셉 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 프리쳐 컬', 'Dumbbell Preacher Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 프리쳐 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 프리쳐 컬', 'Barbell Preacher Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 프리쳐 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이지바 프리쳐 컬', 'EZ Bar Preacher Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이지바 프리쳐 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '프리쳐 컬 머신', 'Preacher Curl Machine', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '프리쳐 컬 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '암 컬 머신', 'Arm Curl Machine', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '암 컬 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 해머컬', 'Cable Hammer Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 해머컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 오버헤드 트라이셉 익스텐션', 'Cable Overhead Tricep Extension', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 오버헤드 트라이셉 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 라잉 트라이셉 익스텐션', 'Cable Lying Tricep Extension', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 라잉 트라이셉 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리버스 바벨 리스트 컬', 'Reverse Barbell Wrist Curl', '팔', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리버스 바벨 리스트 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리버스 덤벨 리스트 컬', 'Reverse Dumbbell Wrist Curl', '팔', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리버스 덤벨 리스트 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 덤벨 컬', 'Incline Dumbbell Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 덤벨 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '벤치 딥스', 'Bench Dips', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '벤치 딥스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리스트 롤러', 'Wrist Roller', '팔', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리스트 롤러' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리버스 바벨 컬', 'Reverse Barbell Curl', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리버스 바벨 컬' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '트라이셉 익스텐션 머신', 'Tricep Extension Machine', '팔', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '트라이셉 익스텐션 머신' AND is_custom = false
    );
    -- 복근
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '싯업', 'Sit-up', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '싯업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '힐 터치', 'Heel Touch', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '힐 터치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '할로우 락', 'Hollow Rock', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '할로우 락' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '할로우 포지션', 'Hollow Position', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '할로우 포지션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 사이드 벤드', 'Dumbbell Side Bend', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 사이드 벤드' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '복근 에어 바이크', 'Air Bike Crunches', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '복근 에어 바이크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '행잉 니 레이즈', 'Hanging Knee Raise', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '행잉 니 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '복근 크런치 머신', 'Ab Crunch Machine', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '복근 크런치 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '행 클린', 'Hang Clean', '복근', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '행 클린' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '행 스내치', 'Hang Snatch', '복근', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '행 스내치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '필라테스 잭나이프', 'Pilates Jackknife', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '필라테스 잭나이프' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '리버스 크런치', 'Reverse Crunch', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '리버스 크런치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '사이드 플랭크', 'Side Plank', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '사이드 플랭크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '45도 사이드 벤드', '45-degree Side Bend', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '45도 사이드 벤드' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT 'RKC 플랭크', 'RKC Plank', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = 'RKC 플랭크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 사이드 벤드', 'Cable Side Bend', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 사이드 벤드' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 디클라인 크런치', 'Weighted Decline Crunch', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 디클라인 크런치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '디클라인 리버스 크런치', 'Decline Reverse Crunch', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '디클라인 리버스 크런치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '디클라인 싯업', 'Decline Sit-up', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '디클라인 싯업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 디클라인 싯업', 'Weighted Decline Sit-up', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 디클라인 싯업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '사이드 크런치', 'Side Crunch', '복근', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '사이드 크런치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 트위스트', 'Cable Twist', '복근', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 트위스트' AND is_custom = false
    );
    -- 등
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스미스머신 로우', 'Smith Machine Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스미스머신 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 덤벨 로우', 'One-Arm Dumbbell Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 덤벨 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케이블 암 풀다운', 'Cable Arm Pulldown', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케이블 암 풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '굿모닝 엑서사이즈', 'Good Morning Exercise', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '굿모닝 엑서사이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 풀업', 'Weighted Pull-up', '등', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 풀업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 친업', 'Weighted Chin-up', '등', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 친업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 바벨 로우', 'Incline Barbell Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 바벨 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인클라인 덤벨 로우', 'Incline Dumbbell Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인클라인 덤벨 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인버티드 로우', 'Inverted Row', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인버티드 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 풀오버', 'Barbell Pullover', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 풀오버' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 하이퍼 익스텐션', 'Weighted Hyperextension', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 하이퍼 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '백 익스텐션', 'Back Extension', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '백 익스텐션' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '티바 로우 머신', 'T-Bar Row Machine', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '티바 로우 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '맥그립 랫풀다운', 'MAG Grip Lat Pulldown', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '맥그립 랫풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '패러럴그립 랫풀다운', 'Parallel Grip Lat Pulldown', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '패러럴그립 랫풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '언더그립 랫풀다운', 'Underhand Grip Lat Pulldown', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '언더그립 랫풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '정지 바벨 로우', 'Paused Barbell Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '정지 바벨 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '어시스트 풀업 머신', 'Assisted Pull-up Machine', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '어시스트 풀업 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '플로어 시티드 케이블 로우', 'Floor Seated Cable Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '플로어 시티드 케이블 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '언더그립 바벨 로우', 'Underhand Grip Barbell Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '언더그립 바벨 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '라잉 바벨 로우', 'Lying Barbell Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '라잉 바벨 로우' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '비하인드 넥 풀다운', 'Behind the Neck Pulldown', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '비하인드 넥 풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 케이블 풀다운', 'One-Arm Cable Pulldown', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 케이블 풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 레터럴 와이드 풀다운', 'One-Arm Lateral Wide Pulldown', '등', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 레터럴 와이드 풀다운' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '로우 로우 머신', 'Low Row Machine', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '로우 로우 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 로우 로우 머신', 'One-Arm Low Row Machine', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 로우 로우 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '하이 로우 머신', 'High Row Machine', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '하이 로우 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '언더그립 하이 로우 머신', 'Underhand Grip High Row Machine', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '언더그립 하이 로우 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 하이 로우 머신', 'One-Arm High Row Machine', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 하이 로우 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '원암 시티드 케이블 로우', 'One-Arm Seated Cable Row', '등', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '원암 시티드 케이블 로우' AND is_custom = false
    );
    -- 역도
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '클린', 'Clean', '역도', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '클린' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '클린 & 저크', 'Clean & Jerk', '역도', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '클린 & 저크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '저크', 'Jerk', '역도', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '저크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스내치', 'Snatch', '역도', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스내치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바벨 오버헤드 스쿼트', 'Barbell Overhead Squat', '역도', 180, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바벨 오버헤드 스쿼트' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 스내치', 'Dumbbell Snatch', '역도', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 스내치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 스내치', 'Kettlebell Snatch', '역도', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 스내치' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스내치 밸런스', 'Snatch Balance', '역도', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스내치 밸런스' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '중량 행잉 니 레이즈', 'Weighted Hanging Knee Raise', '역도', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '중량 행잉 니 레이즈' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '클린 하이풀', 'Clean High Pull', '역도', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '클린 하이풀' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스내치 하이풀', 'Snatch High Pull', '역도', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스내치 하이풀' AND is_custom = false
    );
    -- 유산소
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '트레드밀', 'Treadmill', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '트레드밀' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '싸이클', 'Cycling', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '싸이클' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '로잉 머신', 'Rowing Machine', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '로잉 머신' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '계단 오르기', 'Stair Climbing', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '계단 오르기' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '줄넘기', 'Jumping Rope', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '줄넘기' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '이단 뛰기', 'Double Under', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '이단 뛰기' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '하이니 스킵', 'High Knee Skip', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '하이니 스킵' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '어썰트 바이크', 'Assault Bike', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '어썰트 바이크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스텝밀', 'StepMill', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스텝밀' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '걷기', 'Walking', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '걷기' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '달리기', 'Running', '유산소', 0, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '달리기' AND is_custom = false
    );
    -- 기타
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '쓰러스터', 'Thruster', '기타', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '쓰러스터' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '버피', 'Burpee', '기타', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '버피' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 스윙', 'Kettlebell Swing', '기타', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 스윙' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '파머스 워크', 'Farmer''s Walk', '기타', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '파머스 워크' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '월볼 샷', 'Wall Ball Shot', '기타', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '월볼 샷' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '마운틴 클라이머', 'Mountain Climber', '기타', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '마운틴 클라이머' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '박스 점프', 'Box Jump', '기타', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '박스 점프' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '점핑 잭', 'Jumping Jack', '기타', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '점핑 잭' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '바 머슬업', 'Bar Muscle-up', '기타', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '바 머슬업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '링 머슬업', 'Ring Muscle-up', '기타', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '링 머슬업' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 버피', 'Dumbbell Burpee', '기타', 90, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 버피' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '덤벨 쓰러스터', 'Dumbbell Thruster', '기타', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '덤벨 쓰러스터' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '인치웜', 'Inchworm', '기타', 60, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '인치웜' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '스모 데드리프트 하이풀', 'Sumo Deadlift High Pull', '기타', 150, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '스모 데드리프트 하이풀' AND is_custom = false
    );
    INSERT INTO exercises (name_ko, name_en, category, default_rest_seconds, is_custom)
    SELECT '케틀벨 스모 하이풀', 'Kettlebell Sumo High Pull', '기타', 120, false
    WHERE NOT EXISTS (
        SELECT 1 FROM exercises WHERE name_ko = '케틀벨 스모 하이풀' AND is_custom = false
    );
END$$;

COMMIT;
