BEGIN;

WITH overrides(name_ko, name_en_override, template_group, targets_ko, targets_en) AS (
  VALUES
    ('쓰러스터', 'Thruster', 'conditioning_power', '하체 구동, 어깨 안정성, 전신 협응', 'leg drive, shoulder stability, and full-body coordination'),
    ('덤벨 쓰러스터', 'Dumbbell Thruster', 'conditioning_power', '하체 구동, 어깨 안정성, 전신 협응', 'leg drive, shoulder stability, and full-body coordination'),
    ('월볼 샷', 'Wall Ball Shot', 'conditioning_power', '하체 구동, 리듬, 전신 협응', 'leg drive, rhythm, and full-body coordination'),
    ('케틀벨 스윙', 'Kettlebell Swing', 'conditioning_power', '엉덩이 폭발력, 코어 안정성, 전신 리듬', 'hip power, trunk stability, and full-body rhythm'),
    ('스모 데드리프트 하이풀', 'Sumo Deadlift High Pull', 'conditioning_power', '하체 폭발력, 상체 당기기, 전신 협응', 'leg power, upper-body pulling, and total-body coordination'),
    ('케틀벨 스모 하이풀', 'Kettlebell Sumo High Pull', 'conditioning_power', '하체 폭발력, 상체 당기기, 전신 협응', 'leg power, upper-body pulling, and total-body coordination'),
    ('파머스 워크', 'Farmer''s Walk', 'conditioning_power', '그립, 코어 안정성, 전신 지지력', 'grip strength, trunk stability, and full-body support'),

    ('버피', 'Burpee', 'conditioning_bodyweight', '심폐 지구력, 민첩성, 전신 협응', 'cardiorespiratory endurance, agility, and full-body coordination'),
    ('덤벨 버피', 'Dumbbell Burpee', 'conditioning_bodyweight', '심폐 지구력, 민첩성, 전신 협응', 'cardiorespiratory endurance, agility, and full-body coordination'),
    ('마운틴 클라이머', 'Mountain Climber', 'conditioning_bodyweight', '심폐 지구력, 코어 안정성, 리듬', 'cardiorespiratory endurance, trunk stability, and rhythm'),
    ('인치웜', 'Inchworm', 'conditioning_bodyweight', '코어 안정성, 어깨 지지, 전신 리듬', 'trunk stability, shoulder support, and full-body rhythm'),
    ('박스 점프', 'Box Jump', 'conditioning_bodyweight', '하체 폭발력, 착지 제어, 전신 협응', 'lower-body power, landing control, and full-body coordination'),
    ('점핑 잭', 'Jumping Jack', 'conditioning_bodyweight', '심폐 지구력, 리듬, 전신 협응', 'cardiorespiratory endurance, rhythm, and full-body coordination'),

    ('바 머슬업', 'Bar Muscle-up', 'skill_upper_body', '상체 당기기, 밀기 전환, 전신 협응', 'upper-body pulling, pressing transition, and full-body coordination'),
    ('링 머슬업', 'Ring Muscle-up', 'skill_upper_body', '상체 당기기, 밀기 전환, 전신 협응', 'upper-body pulling, pressing transition, and full-body coordination'),
    ('핸드스탠드', 'Handstand', 'skill_upper_body', '어깨 지지력, 코어 긴장, 균형 감각', 'shoulder support, trunk tension, and balance'),
    ('핸드스탠드 푸시업', 'Handstand Push-up', 'skill_upper_body', '어깨 지지력, 코어 긴장, 수직 프레스 힘', 'shoulder support, trunk tension, and vertical pressing strength'),

    ('로우 풀리 케이블 플라이', 'Low Pulley Cable Fly', 'chest_fly', '가슴 수축, 전면 어깨, 가동 범위 제어', 'chest contraction, front delts, and range-of-motion control'),
    ('디클라인 덤벨 플라이', 'Decline Dumbbell Fly', 'chest_fly', '가슴 수축, 전면 어깨, 가동 범위 제어', 'chest contraction, front delts, and range-of-motion control'),
    ('인클라인 케이블 플라이', 'Incline Cable Fly', 'chest_fly', '가슴 수축, 전면 어깨, 가동 범위 제어', 'chest contraction, front delts, and range-of-motion control'),
    ('인클라인 덤벨 플라이', 'Incline Dumbbell Fly', 'chest_fly', '가슴 수축, 전면 어깨, 가동 범위 제어', 'chest contraction, front delts, and range-of-motion control'),

    ('오버헤드프레스', 'Overhead Press', 'press_name_fix', '전면, 측면 어깨와 삼두', 'the front and side delts with the triceps'),
    ('푸쉬업 (무릎 대고 또는 벽 푸쉬업)', 'Modified Push-up', 'press_name_fix', '가슴, 전면 어깨, 삼두', 'the chest, front delts, and triceps'),
    ('버피 테스트 (낮은 강도)', 'Low-Intensity Burpee Test', 'conditioning_bodyweight', '심폐 지구력, 리듬, 전신 협응', 'cardiorespiratory endurance, rhythm, and full-body coordination')
),
generated AS (
  SELECT
    o.name_ko,
    CASE o.template_group
      WHEN 'conditioning_power' THEN format('%s는 %s을 함께 요구하는 파워 컨디셔닝 운동입니다. 단순히 심박수만 올리는 것이 아니라 폭발적인 힘 전달과 반복 리듬을 함께 다루는 데 적합합니다.', o.name_ko, o.targets_ko)
      WHEN 'conditioning_bodyweight' THEN format('%s는 %s 향상에 초점을 둔 체중 기반 컨디셔닝 운동입니다. 지속적인 리듬 속에서도 자세 기준을 유지하는 능력을 키우는 데 도움이 됩니다.', o.name_ko, o.targets_ko)
      WHEN 'skill_upper_body' THEN format('%s는 %s을 요구하는 상체 기술 운동입니다. 단순 근력뿐 아니라 균형, 전환 타이밍, 몸통 긴장을 함께 조절해야 하는 패턴입니다.', o.name_ko, o.targets_ko)
      WHEN 'chest_fly' THEN format('%s는 %s에 집중 자극을 주는 가슴 보조 운동입니다. 가슴이 모이는 구간의 수축을 선명하게 느끼고, 프레스 운동에서 놓치기 쉬운 수평 모음 자극을 보완하는 데 좋습니다.', o.name_ko, o.targets_ko)
      WHEN 'press_name_fix' THEN format('%s는 %s 중심의 미는 동작 계열 운동입니다. 상체 전면의 힘을 키우고 프레스 패턴의 안정성과 반복 완성도를 높이는 데 유용합니다.', o.name_ko, o.targets_ko)
      ELSE format('%s는 %s 중심의 운동입니다. 반복 품질과 목표 자극을 함께 관리하는 데 활용할 수 있습니다.', o.name_ko, o.targets_ko)
    END AS overview_ko,
    CASE o.template_group
      WHEN 'conditioning_power' THEN format('%s is a power-oriented conditioning exercise for %s. It trains explosive force transfer, sustainable effort, and repeatable movement rhythm rather than just raising heart rate.', o.name_en_override, o.targets_en)
      WHEN 'conditioning_bodyweight' THEN format('%s is a bodyweight-based conditioning exercise for %s. It helps develop repeatable movement quality under fatigue while keeping the heart rate elevated.', o.name_en_override, o.targets_en)
      WHEN 'skill_upper_body' THEN format('%s is an upper-body skill exercise for %s. It demands strength, balance, transition timing, and organized trunk tension at the same time.', o.name_en_override, o.targets_en)
      WHEN 'chest_fly' THEN format('%s is a chest accessory exercise for %s. It is useful for refining chest contraction and adding horizontal adduction volume without relying on heavy pressing loads.', o.name_en_override, o.targets_en)
      WHEN 'press_name_fix' THEN format('%s is a pressing exercise for %s. It is useful for developing pressing strength, shoulder stability, and repeatable upper-body mechanics.', o.name_en_override, o.targets_en)
      ELSE format('%s is a resistance-training exercise for %s. It can be used to improve movement quality and muscular development within a broader program.', o.name_en_override, o.targets_en)
    END AS overview_en,
    CASE o.template_group
      WHEN 'conditioning_power' THEN '폭발적인 하체 구동과 상체 연결이 동시에 필요해 전신 파워와 작업 수행 능력을 함께 높일 수 있습니다. 크로스 트레이닝이나 서킷 구성에서 강도와 기술을 모두 챙기기 좋습니다.'
      WHEN 'conditioning_bodyweight' THEN '심폐 지구력과 민첩성을 높이면서도 장비 없이 반복하기 좋아 워밍업, 컨디셔닝, 체력 보강에 모두 활용할 수 있습니다. 피로 속에서도 자세를 유지하는 훈련 효과가 큽니다.'
      WHEN 'skill_upper_body' THEN '상체 힘과 기술 숙련도가 함께 필요하기 때문에 운동 숙련도를 끌어올리는 데 큰 도움이 됩니다. 몸통 긴장과 어깨 안정성을 함께 강화할 수 있다는 점도 장점입니다.'
      WHEN 'chest_fly' THEN '프레스 운동만으로 부족할 수 있는 가슴 수축 감각을 보완하고, 가벼운 중량으로도 목표 부위 긴장을 길게 유지하기 좋습니다. 근비대 볼륨을 추가할 때도 효율적입니다.'
      WHEN 'press_name_fix' THEN '가슴과 어깨, 삼두의 협응을 강화하고 프레스 패턴의 기본기를 다지는 데 도움이 됩니다. 초보자부터 중급자까지 반복 품질을 익히기 좋은 선택입니다.'
      ELSE '적절한 강도와 반복 수를 조절하면 근력, 지구력, 움직임 완성도를 함께 높일 수 있습니다.'
    END AS why_ko,
    CASE o.template_group
      WHEN 'conditioning_power' THEN 'These movements improve power output, work capacity, and coordination under fatigue, making them valuable when you want both athletic transfer and conditioning effect.'
      WHEN 'conditioning_bodyweight' THEN 'They are practical for improving endurance, rhythm, and repeatable movement quality with minimal setup, which makes them easy to use in warm-ups or conditioning blocks.'
      WHEN 'skill_upper_body' THEN 'These drills are useful for building upper-body skill, organized tension, and movement confidence while also exposing gaps in control and timing.'
      WHEN 'chest_fly' THEN 'They are effective for improving chest contraction, adding hypertrophy-focused volume, and filling in the stimulus that pressing patterns sometimes miss.'
      WHEN 'press_name_fix' THEN 'They help reinforce foundational pressing mechanics while building strength and control through the chest, shoulders, and triceps.'
      ELSE 'With appropriate loading and repetition schemes, this movement can improve strength, endurance, and technical consistency.'
    END AS why_en,
    CASE o.template_group
      WHEN 'conditioning_power' THEN E'시작 전에 호흡과 발 압력을 정리하고, 반복 내내 힘 전달 순서를 일정하게 가져갑니다.\n하체 구동으로 먼저 힘을 만들고 상체는 그 힘을 자연스럽게 이어받도록 움직입니다.\n속도가 올라가도 동작 범위와 마무리 자세를 무너뜨리지 말고, 반복마다 같은 리듬을 유지합니다.'
      WHEN 'conditioning_bodyweight' THEN E'현재 체력 수준에 맞는 속도로 시작하고, 처음부터 과하게 서두르지 않습니다.\n반복이 이어져도 자세 기준과 가동 범위를 유지하며 반동에만 의존하지 않습니다.\n호흡이 무너지기 시작하면 잠깐 리듬을 조절해 자세를 다시 정리하고 이어갑니다.'
      WHEN 'skill_upper_body' THEN E'시작 자세에서 손, 어깨, 몸통 정렬을 먼저 만들고 불필요한 흔들림을 줄입니다.\n당기기와 밀기 전환 구간에서는 반동보다 타이밍과 몸통 긴장 유지에 집중합니다.\n반복마다 같은 경로와 균형을 유지하며, 무너지기 시작하면 횟수보다 품질을 우선합니다.'
      WHEN 'chest_fly' THEN E'가슴을 편 상태에서 어깨를 과하게 말지 않고 시작 자세를 안정적으로 잡습니다.\n팔꿈치 각도를 크게 바꾸지 않으면서 가슴이 모이는 경로로 천천히 움직입니다.\n수축 지점에서 잠깐 멈춘 뒤 천천히 돌아오며 가슴 긴장이 완전히 풀리지 않게 유지합니다.'
      WHEN 'press_name_fix' THEN E'견갑과 코어를 먼저 안정적으로 고정하고 손목, 팔꿈치, 어깨 라인을 편안하게 맞춥니다.\n내려가거나 밀어내는 구간 모두 반동 없이 통제하며 목표 경로를 유지합니다.\n반복이 끝날 때까지 몸통 긴장과 어깨 위치를 무너지지 않게 유지합니다.'
      ELSE E'시작 자세를 안정적으로 만든 뒤 코어와 호흡을 먼저 정리합니다.\n가동 범위 안에서 반동 없이 목표 부위 힘으로 움직입니다.\n마무리 자세까지 통제한 뒤 같은 패턴으로 반복합니다.'
    END AS how_ko,
    CASE o.template_group
      WHEN 'conditioning_power' THEN E'Organize your breathing and foot pressure before the set so the force transfer pattern stays consistent.\nDrive first with the legs and let the upper body receive and finish that force rather than muscling every rep.\nEven as the pace rises, keep the full movement standard and finish position intact on every repetition.'
      WHEN 'conditioning_bodyweight' THEN E'Start at a pace that matches your current conditioning instead of rushing the opening reps.\nAs fatigue builds, keep the intended range and movement standard rather than relying only on momentum.\nIf your breathing breaks down, briefly reset the rhythm and posture before continuing.'
      WHEN 'skill_upper_body' THEN E'Create a stable hand, shoulder, and trunk position first so the body stays organized from the start.\nDuring the transition, focus on timing and tension rather than throwing yourself through the movement.\nKeep the same path and balance on every rep, and prioritize quality over extra repetitions once the pattern starts to break.'
      WHEN 'chest_fly' THEN E'Set the chest open and avoid letting the shoulders roll excessively forward before each rep.\nMove through the arc with a steady elbow angle so the chest, not momentum, drives the motion.\nPause briefly in the shortened position and return slowly while keeping tension on the chest.'
      WHEN 'press_name_fix' THEN E'Set the shoulders and trunk first, then line up the wrists, elbows, and pressing path in a comfortable position.\nControl both the lowering and pressing phases without bouncing or losing alignment.\nFinish each rep without letting the trunk collapse or the shoulder position drift.'
      ELSE E'Set up in a stable position and organize your breathing before the rep begins.\nMove through the intended range without relying on momentum.\nFinish under control and repeat with the same technique on every rep.'
    END AS how_en
  FROM overrides o
),
formatted AS (
  SELECT
    g.name_ko,
    g.overview_ko,
    g.overview_en,
    g.why_ko,
    g.why_en,
    g.how_ko,
    g.how_en,
    format(
      E'개요\n%s\n\n왜 하나요?\n%s\n\n수행 방법\n1. %s\n2. %s\n3. %s',
      g.overview_ko,
      g.why_ko,
      split_part(g.how_ko, E'\n', 1),
      split_part(g.how_ko, E'\n', 2),
      split_part(g.how_ko, E'\n', 3)
    ) AS description_ko,
    format(
      E'Overview\n%s\n\nWhy do this exercise?\n%s\n\nHow to do it\n1. %s\n2. %s\n3. %s',
      g.overview_en,
      g.why_en,
      split_part(g.how_en, E'\n', 1),
      split_part(g.how_en, E'\n', 2),
      split_part(g.how_en, E'\n', 3)
    ) AS description_en
  FROM generated g
)
UPDATE exercises e
SET
  overview_ko = f.overview_ko,
  overview_en = f.overview_en,
  why_ko = f.why_ko,
  why_en = f.why_en,
  how_ko = f.how_ko,
  how_en = f.how_en,
  description_ko = f.description_ko,
  description_en = f.description_en
FROM formatted f
WHERE e.name_ko = f.name_ko
  AND e.is_custom = false;

COMMIT;
