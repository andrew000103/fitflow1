BEGIN;

UPDATE exercises
SET
  name_ko = '바벨 스쿼트',
  name_en = 'Barbell Squat'
WHERE name_ko = '스쿼트' AND is_custom = false;

UPDATE exercises
SET
  name_ko = '컨벤셔널 데드리프트',
  name_en = 'Conventional Deadlift'
WHERE name_ko = '데드리프트' AND is_custom = false;

UPDATE ai_plans
SET
  plan_json = replace(
    replace(plan_json::text, '"name":"데드리프트"', '"name":"컨벤셔널 데드리프트"'),
    '"name":"스쿼트"',
    '"name":"바벨 스쿼트"'
  )::jsonb,
  generation_context = replace(
    replace(generation_context::text, '"exercise":"데드리프트"', '"exercise":"컨벤셔널 데드리프트"'),
    '"exercise":"스쿼트"',
    '"exercise":"바벨 스쿼트"'
  )::jsonb
WHERE plan_json::text LIKE '%"name":"데드리프트"%'
   OR plan_json::text LIKE '%"name":"스쿼트"%'
   OR generation_context::text LIKE '%"exercise":"데드리프트"%'
   OR generation_context::text LIKE '%"exercise":"스쿼트"%';

COMMIT;
