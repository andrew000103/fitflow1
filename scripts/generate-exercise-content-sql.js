/**
 * generate-exercise-content-sql.js
 *
 * BUILT_IN_EXERCISES를 기준으로
 * - visual_guide_url
 * - overview_ko / overview_en
 * - why_ko / why_en
 * - how_ko / how_en
 * - description_ko / description_en (legacy fallback)
 * 을 채우는 SQL 파일을 생성한다.
 *
 * 실행:
 *   node scripts/generate-exercise-content-sql.js
 *
 * 출력:
 *   supabase/migrations/20260401_seed_built_in_exercise_content.sql
 *
 * 정책:
 *   - 기존 visual_guide_url / description_ko / description_en 값을 덮어쓴다.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const EXERCISES_TS = path.join(ROOT, 'src/constants/exercises.ts');
const OUTPUT_SQL = path.join(
  ROOT,
  'supabase/migrations/20260401_seed_built_in_exercise_content.sql',
);

const CATEGORY_EN = {
  가슴: 'chest',
  등: 'back',
  어깨: 'shoulders',
  하체: 'lower body',
  이두: 'biceps',
  삼두: 'triceps',
  복근: 'core',
};

const CATEGORY_KO_TARGETS = {
  가슴: '가슴, 전면 어깨, 삼두',
  등: '광배, 등 상부, 후면 어깨, 이두',
  어깨: '전면, 측면, 후면 어깨와 상부 승모',
  하체: '대퇴사두, 햄스트링, 둔근, 종아리',
  이두: '이두와 전완',
  삼두: '삼두와 팔꿈치 신전 패턴',
  복근: '복직근, 복사근, 코어 안정성',
};

const CATEGORY_EN_TARGETS = {
  가슴: 'the chest, front delts, and triceps',
  등: 'the lats, upper back, rear delts, and biceps',
  어깨: 'the front, side, and rear delts with upper-trap support',
  하체: 'the quads, hamstrings, glutes, and calves',
  이두: 'the biceps and forearms',
  삼두: 'the triceps and elbow-extension pattern',
  복근: 'the rectus abdominis, obliques, and trunk stability',
};

const SEARCH_OVERRIDES = {
  '벤치 프레스': ['Bench Press'],
  '인클라인 벤치 프레스': ['Incline Bench Press - Barbell', 'Incline Bench Press'],
  '디클라인 벤치 프레스': ['Decline Bench Press Barbell', 'Decline Bench Press'],
  '클로즈그립 벤치 프레스': ['Close-Grip Bench Press', 'Bench Press Narrow Grip'],
  '덤벨 벤치 프레스': ['Dumbbell Bench Press', 'Benchpress Dumbbells'],
  '인클라인 덤벨 프레스': ['Incline Dumbbell Bench Press', 'Incline Dumbbell Press'],
  딥스: ['Dips Between Two Benches', 'Dips'],
  '케이블 플라이': ['Cable Fly', 'Cable crossover'],
  '덤벨 플라이': ['Dumbbell Fly', 'Fly With Dumbbells'],
  '펙덱 플라이': ['Pec Deck Fly', 'Pec Deck'],
  '컨벤셔널 데드리프트': ['Conventional Deadlift', 'Barbell Deadlift', 'Deadlift'],
  '스모 데드리프트': ['Sumo Deadlift'],
  '루마니안 데드리프트': ['Romanian Deadlift'],
  '바벨 로우': ['Barbell Row'],
  '덤벨 로우': ['Dumbbell Row'],
  'T바 로우': ['T-Bar Row', 'T Bar Row'],
  '시티드 케이블 로우': ['Seated Cable Row'],
  '랫 풀다운': ['Lat Pulldown'],
  풀업: ['Pull-Up', 'Pull up'],
  친업: ['Chin-Up', 'Chin up'],
  '페이스 풀': ['Face Pull'],
  '시티드 로우 머신': ['Seated Row Machine', 'Seated Row'],
  '오버헤드 프레스': ['Overhead Press', 'Shoulder Press'],
  '덤벨 숄더 프레스': ['Shoulder Press, Dumbbells', 'Shoulder Press (Dumbbell)'],
  '아놀드 프레스': ['Arnold Press'],
  '사이드 레터럴 레이즈': ['Lateral Raise', 'Side Lateral Raise'],
  '프론트 레이즈': ['Front Raise'],
  '리어 델트 플라이': ['Rear Delt Fly', 'Reverse Fly'],
  '업라이트 로우': ['Upright Row'],
  '바벨 스쿼트': ['Barbell Squat', 'Squat'],
  '프론트 스쿼트': ['Front Squat'],
  '불가리안 스플릿 스쿼트': ['Bulgarian Split Squat'],
  '레그 프레스': ['Leg Press'],
  '레그 컬': ['Leg Curl'],
  '레그 익스텐션': ['Leg Extension'],
  런지: ['Lunge'],
  '힙 쓰러스트': ['Hip Thrust'],
  '카프 레이즈': ['Calf Raise', 'Standing Calf Raise'],
  '스텝업': ['Step-Up', 'Step Up'],
  '굿모닝': ['Good Morning'],
  '바이셉스 컬': ['Biceps Curl', 'Dumbbell Curl'],
  '해머 컬': ['Hammer Curl'],
  '인클라인 덤벨 컬': ['Incline Dumbbell Curl'],
  '프리처 컬': ['Preacher Curl'],
  '케이블 컬': ['Cable Curl'],
  '역그립 컬': ['Reverse Curl'],
  '트라이셉스 푸시다운': ['Triceps Pushdown', 'Pushdown'],
  '오버헤드 트라이셉스 익스텐션': ['Overhead Triceps Extension'],
  스컬크러셔: ['Skull Crusher', 'Skullcrusher'],
  '트라이셉스 딥스': ['Triceps Dips', 'Dips Between Two Benches'],
  '케이블 킥백': ['Cable Kickback', 'Triceps Kickback'],
  플랭크: ['Plank'],
  크런치: ['Crunch'],
  '레그 레이즈': ['Leg Raise'],
  '행잉 레그 레이즈': ['Hanging Leg Raise'],
  '러시안 트위스트': ['Russian Twist'],
  '케이블 크런치': ['Cable Crunch'],
  '애브 롤아웃': ['Ab Rollout', 'Ab Wheel Rollout'],
};

const MEDIA_OVERRIDES = {
  '컨벤셔널 데드리프트': {
    url: 'https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg',
    matchName: 'Deadlifts',
    query: 'Conventional Deadlift',
  },
  '바벨 스쿼트': {
    url: 'https://wger.de/media/exercise-images/1805/f166c599-4c03-42a0-9250-47f82a1f096d.jpg',
    matchName: 'Barbell Squat',
    query: 'Barbell Squat',
  },
  스텝업: {
    url: 'https://wger.de/media/exercise-images/1830/3b6c547c-ab3d-4472-93cf-561710279eab.jpg',
    matchName: 'Barbell Step Back Lunge',
    query: 'Barbell Step Back Lunge',
  },
  '인클라인 덤벨 컬': {
    url: 'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
    matchName: 'Biceps Curls With Dumbbell',
    query: 'Biceps Curls With Dumbbell',
  },
  '역그립 컬': {
    url: 'https://wger.de/media/exercise-images/74/Bicep-curls-1.png',
    matchName: 'Biceps Curls With Barbell',
    query: 'Biceps Curls With Barbell',
  },
  '케이블 킥백': {
    url: 'https://wger.de/media/exercise-images/659/a60452f1-e2ea-43fe-baa6-c1a2208d060c.png',
    matchName: 'Triceps Extensions on Cable',
    query: 'Triceps Extensions on Cable',
  },
  '아놀드 프레스': {
    url: 'https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png',
    matchName: 'Shoulder Press, Dumbbells',
    query: 'Shoulder Press, Dumbbells',
  },
  '케이블 크런치': {
    url: 'https://wger.de/media/exercise-images/91/Crunches-1.png',
    matchName: 'Crunches',
    query: 'Crunches',
  },
  '행잉 레그 레이즈': {
    url: 'https://wger.de/media/exercise-images/1889/bc51ef67-0c12-4340-a36c-42ef722778dd.png',
    matchName: 'Decline Bench Leg Raise',
    query: 'Decline Bench Leg Raise',
  },
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toSqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function hasBatchim(word) {
  const last = String(word || '').trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function topicParticle(word) {
  return hasBatchim(word) ? '은' : '는';
}

function formatKoGuide(overview, why, steps) {
  return [
    '개요',
    overview,
    '',
    '왜 하나요?',
    why,
    '',
    '수행 방법',
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n');
}

function formatEnGuide(overview, why, steps) {
  return [
    'Overview',
    overview,
    '',
    'Why do this exercise?',
    why,
    '',
    'How to do it',
    ...steps.map((step, index) => `${index + 1}. ${step}`),
  ].join('\n');
}

function createKoGuide(overview, why, steps) {
  return {
    overview,
    why,
    how: steps.join('\n'),
    description: formatKoGuide(overview, why, steps),
  };
}

function createEnGuide(overview, why, steps) {
  return {
    overview,
    why,
    how: steps.join('\n'),
    description: formatEnGuide(overview, why, steps),
  };
}

function parseBuiltInExercises() {
  const source = fs.readFileSync(EXERCISES_TS, 'utf8');
  const regex =
    /\{\s*name_ko:\s*'([^']+)'\s*,\s*name_en:\s*'([^']+)'\s*,\s*category:\s*'([^']+)'\s*,\s*default_rest_seconds:\s*(\d+)\s*,\s*is_custom:\s*false\s*\}/g;

  const exercises = [];
  let match = regex.exec(source);
  while (match) {
    exercises.push({
      name_ko: match[1],
      name_en: match[2],
      category: match[3],
      default_rest_seconds: Number(match[4]),
    });
    match = regex.exec(source);
  }

  return exercises;
}

function scoreSuggestion(exercise, candidate, searchTerm) {
  const candidateName = normalize(candidate.name);
  const expected = normalize(searchTerm);
  const exerciseName = normalize(exercise.name_en);
  let score = 0;

  if (candidate.image) score += 30;
  if (candidateName === expected) score += 100;
  if (candidateName === exerciseName) score += 90;
  if (candidateName.includes(expected)) score += 35;
  if (expected.includes(candidateName)) score += 20;
  if (
    candidate.category &&
    normalize(candidate.category).includes(normalize(CATEGORY_EN[exercise.category]))
  ) {
    score += 15;
  }

  const expectedTokens = expected.split(' ').filter(Boolean);
  score += expectedTokens.filter((token) => candidateName.includes(token)).length * 8;

  return score;
}

async function searchWgerImage(exercise) {
  if (MEDIA_OVERRIDES[exercise.name_ko]) {
    return MEDIA_OVERRIDES[exercise.name_ko];
  }

  const queries = SEARCH_OVERRIDES[exercise.name_ko] || [exercise.name_en];

  let best = null;
  for (const query of queries) {
    const url = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(
      query,
    )}&language=english&format=json`;
    const data = await fetchJson(url);
    const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
    for (const suggestion of suggestions) {
      const candidate = suggestion?.data;
      if (!candidate?.image) continue;
      const score = scoreSuggestion(exercise, candidate, query);
      if (!best || score > best.score) {
        best = {
          score,
          url: candidate.image.startsWith('http')
            ? candidate.image
            : `https://wger.de${candidate.image}`,
          matchName: candidate.name,
          query,
        };
      }
    }
  }

  if (!best) {
    throw new Error(`No image match found for ${exercise.name_ko} / ${exercise.name_en}`);
  }

  return best;
}

function buildDescriptionKo(exercise) {
  const name = exercise.name_ko;
  const targets = CATEGORY_KO_TARGETS[exercise.category] || '주요 근육군';
  const topic = topicParticle(name);

  if (/레그 컬|레그 익스텐션|카프 레이즈/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets}에 집중 자극을 주기 좋은 하체 보조 운동입니다. 목표 근육에 긴장을 오래 유지하며 좌우 밸런스와 약점 보완에 활용하기 좋습니다.`,
      `복합 운동으로 채우기 어려운 부위를 더 선명하게 자극하고, 근비대와 움직임 완성도를 높이는 데 도움이 됩니다. 반동 없이 컨트롤하면 목표 부위 감각을 익히기 좋습니다.`,
      [
        '머신이나 기구에 몸을 안정적으로 고정하고 목표 근육에 힘을 먼저 주세요.',
        '가동 범위를 끝까지 쓰되 반동 없이 천천히 들어 올리거나 밀어냅니다.',
        '수축 지점에서 잠깐 멈춘 뒤 천천히 시작 자세로 돌아오며 긴장을 유지합니다.',
      ],
    );
  }
  if (/스쿼트|런지|레그 프레스|스텝업/.test(name)) {
    return createKoGuide(
      `${name}${topic} 하체 전반을 강화하는 대표적인 운동으로, 특히 ${targets}에 고르게 자극을 줍니다. 자세 안정성과 하체 힘, 균형 감각을 함께 키우기 좋습니다.`,
      `하체 근력과 근비대뿐 아니라 일상적인 앉기, 서기, 계단 오르기 같은 움직임에도 직접적인 도움을 줍니다. 스포츠 퍼포먼스와 부상 예방 측면에서도 효율이 높은 편입니다.`,
      [
        '발 위치를 안정적으로 세팅하고 복부에 힘을 준 뒤 상체 각도를 유지합니다.',
        '엉덩이와 무릎을 함께 굽혀 내려가며 무릎은 발끝 방향과 비슷하게 움직이게 합니다.',
        '발바닥 전체로 지면을 밀어 올라오며 상체와 골반이 동시에 일어나도록 컨트롤합니다.',
      ],
    );
  }
  if (/데드리프트|굿모닝|힙 쓰러스트/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets} 중심의 힙 힌지 패턴 운동입니다. 엉덩이와 햄스트링을 적극적으로 사용하면서 전신의 힘 전달 능력을 키워줍니다.`,
      `후면 사슬을 강하게 만들어 무게를 들어 올리는 능력, 점프와 달리기 같은 폭발적인 움직임, 허리와 골반의 안정성 향상에 도움이 됩니다.`,
      [
        '발과 도구의 거리를 맞추고 코어를 단단히 조여 척추 중립을 유지합니다.',
        '허리를 꺾지 말고 엉덩이를 뒤로 접으며 내려가 목표 위치를 잡습니다.',
        '발로 지면을 밀고 엉덩이를 앞으로 보내며 올라오되 상체와 바가 몸에서 멀어지지 않게 합니다.',
      ],
    );
  }
  if (/벤치 프레스|프레스|딥스/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets} 중심의 미는 동작 계열 운동입니다. 상체 전면의 힘을 키우고 중량을 다루는 기본기를 만드는 데 유용합니다.`,
      `가슴, 어깨, 삼두의 근력과 근비대를 함께 노릴 수 있고, 다른 프레스 계열 운동의 기반이 되는 패턴이라 프로그램 구성 가치가 높습니다.`,
      [
        '견갑을 안정적으로 고정하고 손목, 팔꿈치, 어깨 라인을 편안하게 맞춥니다.',
        '내려가는 구간은 천천히 통제하고 목표 지점에서 반동 없이 멈춥니다.',
        '지면이나 벤치에 힘을 전달하며 밀어 올리고, 마무리에서도 어깨 위치를 무너지지 않게 유지합니다.',
      ],
    );
  }
  if (/로우|풀다운|풀업|친업|페이스 풀/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets} 중심의 당기기 운동입니다. 등 근육을 두껍고 넓게 만드는 데 효과적이며 자세 안정에도 도움을 줍니다.`,
      `밀기 운동과 균형을 맞추고 어깨 건강, 자세 개선, 등과 팔의 근비대 향상에 기여합니다. 상체 전반의 힘 전달 패턴을 안정적으로 만들어줍니다.`,
      [
        '가슴을 열고 어깨를 과하게 으쓱하지 않은 상태에서 시작 자세를 잡습니다.',
        '손보다 팔꿈치를 움직인다는 느낌으로 당기며 목표 부위를 수축합니다.',
        '끝 지점에서 잠깐 멈춘 뒤 천천히 돌아오며 이완 구간도 통제합니다.',
      ],
    );
  }
  if (/레이즈|플라이/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets}에 세밀한 자극을 주는 보조 운동입니다. 상대적으로 가벼운 중량으로도 목표 부위를 선명하게 느끼기 좋습니다.`,
      `약한 부위를 보완하고 근육의 수축 감각을 높이며, 복합 운동에서 부족했던 자극을 채우는 데 도움이 됩니다. 볼륨 확보용으로도 활용도가 높습니다.`,
      [
        '시작 자세에서 코어를 가볍게 고정하고 반동을 최소화할 준비를 합니다.',
        '가동 범위 내에서 천천히 들어 올리거나 벌리며 목표 부위 수축에 집중합니다.',
        '상단에서 잠깐 멈춘 뒤 통제하며 내려오고, 긴장이 완전히 풀리기 전에 다음 반복으로 넘어갑니다.',
      ],
    );
  }
  if (/컬/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets}에 집중 자극을 주는 팔 운동입니다. 비교적 단순한 패턴이라 목표 부위 감각을 익히기 좋고 팔 볼륨 향상에도 유리합니다.`,
      `이두와 전완의 힘을 키워 당기기 운동 보조에 도움이 되고, 팔 라인 발달에도 직접적인 효과를 기대할 수 있습니다.`,
      [
        '상완이 흔들리지 않도록 팔꿈치 위치를 먼저 고정합니다.',
        '손목을 과하게 꺾지 않은 채 목표 부위 힘으로 천천히 들어 올립니다.',
        '상단 수축 후 천천히 내려오며 이완 구간에서도 텐션을 유지합니다.',
      ],
    );
  }
  if (/푸시다운|익스텐션|스컬크러셔|킥백/.test(name)) {
    return createKoGuide(
      `${name}${topic} ${targets} 중심의 삼두 운동입니다. 팔 뒤쪽 볼륨을 키우고 프레스 계열 운동의 보조 근력을 보강하는 데 좋습니다.`,
      `삼두 발달은 상완 둘레와 밀기 동작의 마무리 힘에 큰 영향을 줍니다. 보조 운동으로 넣으면 프레스 정체 구간 돌파에도 도움이 됩니다.`,
      [
        '팔꿈치 위치를 몸 가까이 고정하고 어깨가 따라 움직이지 않게 세팅합니다.',
        '팔꿈치를 축으로 사용하며 목표 부위 힘으로 밀거나 펴줍니다.',
        '수축 지점에서 잠깐 멈춘 뒤 천천히 돌아오며 텐션을 유지합니다.',
      ],
    );
  }
  if (/플랭크|크런치|레그 레이즈|트위스트|롤아웃/.test(name)) {
    return createKoGuide(
      `${name}${topic} 코어 전반을 강화하는 운동으로, 특히 ${targets}에 자극을 줍니다. 몸통 안정성과 복압 조절 능력을 키우는 데 유용합니다.`,
      `코어가 강해지면 상하체 힘 전달이 좋아지고 허리 부담을 줄이는 데 도움이 됩니다. 다른 복합 운동의 퍼포먼스를 받쳐주는 기반 역할도 큽니다.`,
      [
        '갈비뼈와 골반 간격을 과하게 벌리지 말고 복부에 힘을 먼저 줍니다.',
        '반동보다 통제에 집중하며 목표 범위에서 천천히 움직입니다.',
        '허리가 꺾이거나 목에 힘이 몰리지 않게 유지한 채 반복을 마무리합니다.',
      ],
    );
  }

  return createKoGuide(
    `${name}${topic} ${targets} 중심의 웨이트 트레이닝 운동입니다. 기본 근력과 근비대 향상에 활용할 수 있는 대표적인 패턴입니다.`,
    `적절한 중량과 반복 수를 조절하면 근력, 근비대, 움직임 숙련도를 함께 높일 수 있어 프로그램 구성 가치가 높습니다.`,
    [
      '시작 자세를 안정적으로 만든 뒤 코어와 호흡을 먼저 정리합니다.',
      '가동 범위 안에서 반동 없이 목표 부위 힘으로 움직입니다.',
      '마무리 자세까지 통제한 뒤 같은 패턴으로 반복합니다.',
    ],
  );
}

function buildDescriptionEn(exercise) {
  const name = exercise.name_en;
  const targets = CATEGORY_EN_TARGETS[exercise.category] || 'the target muscle group';

  if (/Leg Curl|Leg Extension|Calf Raise/i.test(name)) {
    return createEnGuide(
      `${name} is a lower-body isolation movement for ${targets}. It is useful for building local muscular tension and improving control in a specific weak point.`,
      `This exercise helps you bring up lagging muscle groups, increase hypertrophy-focused volume, and improve mind-muscle connection without the systemic fatigue of a big compound lift.`,
      [
        'Set your body position so the machine or implement feels stable before each rep.',
        'Move with as little momentum as possible and focus on the target muscle doing the work.',
        'Pause briefly in the shortened position, then lower under control while keeping tension.',
      ],
    );
  }
  if (/Squat|Lunge|Leg Press|Step-Up/i.test(name)) {
    return createEnGuide(
      `${name} is a foundational lower-body movement that develops ${targets}. It builds strength, coordination, and positional control through the hips, knees, and ankles.`,
      `It is valuable for lower-body strength, hypertrophy, athletic performance, and day-to-day movement capacity. It also helps improve balance and force production through the legs.`,
      [
        'Set your stance and brace your trunk before starting the descent.',
        'Lower with control while keeping the knees tracking in a natural line with the feet.',
        'Drive through the full foot to stand up and finish without losing posture.',
      ],
    );
  }
  if (/Deadlift|Good Morning|Hip Thrust/i.test(name)) {
    return createEnGuide(
      `${name} is a hip-hinge exercise that trains ${targets}. It teaches powerful extension through the hips while reinforcing trunk stability and efficient force transfer.`,
      `This pattern is excellent for developing posterior-chain strength, improving athletic power, and building resilience in movements that involve lifting, hinging, and accelerating.`,
      [
        'Set the bar or implement close to the body and brace your core first.',
        'Hinge from the hips instead of rounding or overextending the lower back.',
        'Drive the floor away and finish each rep with the hips and trunk arriving together.',
      ],
    );
  }
  if (/Press|Dips/i.test(name)) {
    return createEnGuide(
      `${name} is a pressing exercise for ${targets}. It is a key pattern for developing upper-body strength, pressing mechanics, and front-side muscular development.`,
      `A strong press supports hypertrophy of the chest, shoulders, and triceps while also improving performance in many other upper-body training movements.`,
      [
        'Create a stable shoulder position and line up the wrists, elbows, and pressing path.',
        'Control the lowering phase without losing tension or bouncing out of the bottom.',
        'Press smoothly while keeping the shoulders organized and the torso stable.',
      ],
    );
  }
  if (/Row|Pulldown|Pull-Up|Chin-Up|Face Pull/i.test(name)) {
    return createEnGuide(
      `${name} is a pulling exercise that targets ${targets}. It helps build back width, thickness, shoulder balance, and pulling strength.`,
      `Pulling work is essential for posture, shoulder health, and balanced upper-body development. It also supports stronger performance in pressing and grip-demanding exercises.`,
      [
        'Start with the chest open and avoid shrugging the shoulders excessively.',
        'Lead the motion with the elbows rather than yanking with the hands.',
        'Pause briefly in the contracted position and return under control.',
      ],
    );
  }
  if (/Raise|Fly/i.test(name)) {
    return createEnGuide(
      `${name} is an isolation movement for ${targets}. It is useful for refining muscular tension and adding targeted volume with relatively low load.`,
      `This makes it effective for bringing up weak points, improving mind-muscle connection, and supplementing the work done by bigger compound lifts.`,
      [
        'Set a stable torso and reduce unnecessary body swing before each rep.',
        'Lift or separate the load under control while focusing on the target muscle.',
        'Pause briefly near the top and lower slowly without dropping the tension.',
      ],
    );
  }
  if (/Curl/i.test(name)) {
    return createEnGuide(
      `${name} is an arm isolation exercise for ${targets}. It is commonly used to improve elbow flexor strength, arm size, and local muscular control.`,
      `Consistent curling work can improve pulling assistance, forearm involvement, and overall arm development while being easy to recover from relative to larger lifts.`,
      [
        'Lock in the elbow position before you begin each repetition.',
        'Curl the weight without swinging the torso or changing wrist position excessively.',
        'Squeeze at the top and lower slowly through the full available range.',
      ],
    );
  }
  if (/Pushdown|Extension|Skull Crusher|Kickback/i.test(name)) {
    return createEnGuide(
      `${name} focuses on ${targets}. It is a strong accessory choice for building triceps size and reinforcing the lockout portion of pressing movements.`,
      `Developing the triceps improves arm development and can help support progress in presses, dips, and other upper-body pushing patterns.`,
      [
        'Set the elbow position first and keep the upper arm as still as possible.',
        'Move through the elbow joint with deliberate control rather than rushing the rep.',
        'Finish with a clear triceps squeeze, then return slowly without losing tension.',
      ],
    );
  }
  if (/Plank|Crunch|Leg Raise|Twist|Rollout/i.test(name)) {
    return createEnGuide(
      `${name} is a core-focused exercise that builds ${targets}. It improves trunk control, bracing skill, and the ability to resist unwanted motion.`,
      `A stronger core improves force transfer between the upper and lower body, supports spinal positioning, and contributes to better performance in compound lifts and daily movement.`,
      [
        'Brace the midsection before the rep starts and keep the ribs and pelvis organized.',
        'Move slowly and avoid using momentum to create range of motion.',
        'Finish the rep without letting the lower back overextend or the neck take over.',
      ],
    );
  }

  return createEnGuide(
    `${name} is a resistance-training exercise for ${targets}. It can be used to build strength, hypertrophy, and technical consistency within a broader program.`,
    `With appropriate loading and repetition schemes, this movement can improve muscular development and movement quality while fitting a wide range of goals.`,
    [
      'Set up in a stable position and organize your breathing before the rep begins.',
      'Move through the intended range without relying on momentum.',
      'Finish under control and repeat with the same technique on every rep.',
    ],
  );
}

async function main() {
  const exercises = parseBuiltInExercises();
  if (exercises.length === 0) {
    throw new Error('Failed to parse built-in exercises from src/constants/exercises.ts');
  }

  const lines = [];
  lines.push('-- Generated by scripts/generate-exercise-content-sql.js');
  lines.push('-- Source for visual media candidates: public Wger exercise search API');
  lines.push('-- This file overwrites existing visual_guide_url, description_ko, description_en values.');
  lines.push('BEGIN;');
  lines.push('');

  for (const exercise of exercises) {
    const image = await searchWgerImage(exercise);
    const guideKo = buildDescriptionKo(exercise);
    const guideEn = buildDescriptionEn(exercise);

    lines.push(`-- ${exercise.name_ko} <- ${image.matchName} (query: ${image.query})`);
    lines.push('UPDATE exercises');
    lines.push('SET');
    lines.push(`  visual_guide_url = ${toSqlString(image.url)},`);
    lines.push(`  overview_ko = ${toSqlString(guideKo.overview)},`);
    lines.push(`  overview_en = ${toSqlString(guideEn.overview)},`);
    lines.push(`  why_ko = ${toSqlString(guideKo.why)},`);
    lines.push(`  why_en = ${toSqlString(guideEn.why)},`);
    lines.push(`  how_ko = ${toSqlString(guideKo.how)},`);
    lines.push(`  how_en = ${toSqlString(guideEn.how)},`);
    lines.push(`  description_ko = ${toSqlString(guideKo.description)},`);
    lines.push(`  description_en = ${toSqlString(guideEn.description)}`);
    lines.push(`WHERE name_ko = ${toSqlString(exercise.name_ko)} AND is_custom = false;`);
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');

  fs.writeFileSync(OUTPUT_SQL, lines.join('\n'));
  console.log(`Generated SQL for ${exercises.length} exercises: ${OUTPUT_SQL}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
