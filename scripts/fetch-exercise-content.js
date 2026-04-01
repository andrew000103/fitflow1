/**
 * fetch-exercise-content.js
 *
 * 자동 수집 스크립트 — exercises 테이블의 빈 description_en, visual_guide_url 채우기
 *
 * 실행:
 *   node scripts/fetch-exercise-content.js
 *
 * 환경 변수 (.env.scripts):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   YOUTUBE_API_KEY
 *   GIPHY_API_KEY
 *
 * 우선순위:
 *   description_en  : Wger REST API (https://wger.de/api/v2/)
 *   visual_guide_url: GIPHY API 우선, 없으면 YouTube API
 *
 * 안전 원칙:
 *   - 기존 값이 있는 필드는 절대 덮어쓰지 않음
 *   - 실패한 종목은 건너뛰고 요약 출력
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── 환경 변수 로드 (.env.scripts) ───────────────────────────────────────────

const envPath = path.join(__dirname, '..', '.env.scripts');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim();
      }
    });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.');
  console.error('   .env.scripts 파일을 확인하세요. (.env.scripts.example 참고)');
  process.exit(1);
}

// ─── HTTP 유틸 ────────────────────────────────────────────────────────────────

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Supabase 클라이언트 (fetch 기반) ─────────────────────────────────────────

async function supabaseSelect(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const data = await fetchJson(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return data || [];
}

async function supabaseBatchUpsert(table, rows) {
  if (rows.length === 0) return;
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`;
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rows);
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
      },
      (res) => {
        res.resume();
        res.on('end', resolve);
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Wger API ─────────────────────────────────────────────────────────────────

async function fetchWgerDescription(nameEn) {
  if (!nameEn) return null;
  try {
    const query = encodeURIComponent(nameEn.toLowerCase());
    const data = await fetchJson(
      `https://wger.de/api/v2/exercise/search/?term=${query}&language=english&format=json`,
    );
    const suggestions = data?.suggestions;
    if (!suggestions || suggestions.length === 0) return null;

    // 상위 결과의 exercise id로 상세 조회
    const exerciseId = suggestions[0]?.data?.id;
    if (!exerciseId) return null;

    const detail = await fetchJson(
      `https://wger.de/api/v2/exerciseinfo/${exerciseId}/?format=json`,
    );
    const translations = detail?.translations;
    if (!translations) return null;

    const englishTrans = translations.find(
      (t) => t.language === 2 && t.description && t.description.length > 20,
    );
    if (!englishTrans) return null;

    // HTML 태그 제거
    return englishTrans.description.replace(/<[^>]*>/g, '').trim();
  } catch {
    return null;
  }
}

// ─── GIPHY API ────────────────────────────────────────────────────────────────

async function fetchGiphyGif(searchTerm) {
  if (!GIPHY_API_KEY) return null;
  try {
    const query = encodeURIComponent(searchTerm + ' exercise workout');
    const data = await fetchJson(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=1&rating=g`,
    );
    const gif = data?.data?.[0];
    if (!gif) return null;
    return gif.images?.original?.url || null;
  } catch {
    return null;
  }
}

// ─── YouTube API ──────────────────────────────────────────────────────────────

async function fetchYoutubeVideo(searchTerm) {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const query = encodeURIComponent(searchTerm + ' exercise how to');
    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`,
    );
    const videoId = data?.items?.[0]?.id?.videoId;
    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    return null;
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📋 exercises 테이블 로드 중...');
  const exercises = await supabaseSelect('exercises', 'select=id,name_ko,name_en,description_en,visual_guide_url&order=name_ko.asc');

  if (!Array.isArray(exercises) || exercises.length === 0) {
    console.error('❌ exercises 테이블을 불러올 수 없습니다. Supabase 설정을 확인하세요.');
    process.exit(1);
  }

  console.log(`✅ 총 ${exercises.length}개 종목 로드 완료\n`);

  const stats = {
    total: exercises.length,
    skipped: 0,
    descriptionUpdated: 0,
    gifUpdated: 0,
    youtubeUpdated: 0,
    failed: 0,
  };

  // 수집 단계: API 호출 후 변경 내용을 batchUpdates 배열에 누적
  const batchUpdates = [];

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const searchTerm = ex.name_en || ex.name_ko;
    const patch = { id: ex.id };

    console.log(`[${i + 1}/${exercises.length}] ${ex.name_ko} (${ex.name_en || '-'})`);

    // 이미 모든 필드가 채워져 있으면 건너뜀
    if (ex.description_en && ex.visual_guide_url) {
      console.log('  ✓ 이미 채워짐, 건너뜀');
      stats.skipped++;
      continue;
    }

    // description_en 수집 (없는 경우만)
    if (!ex.description_en) {
      const desc = await fetchWgerDescription(ex.name_en);
      if (desc) {
        patch.description_en = desc;
        stats.descriptionUpdated++;
        console.log(`  ✓ description_en: "${desc.slice(0, 60)}..."`);
      } else {
        console.log('  - description_en: 미수집');
      }
    }

    // visual_guide_url 수집 (없는 경우만)
    if (!ex.visual_guide_url) {
      // GIPHY 우선
      await sleep(36); // GIPHY 100 req/hr = 36ms 간격
      const gifUrl = await fetchGiphyGif(searchTerm);
      if (gifUrl) {
        patch.visual_guide_url = gifUrl;
        stats.gifUpdated++;
        console.log(`  ✓ visual_guide_url (GIF): ${gifUrl.slice(0, 60)}...`);
      } else {
        // YouTube 폴백
        const ytUrl = await fetchYoutubeVideo(searchTerm);
        if (ytUrl) {
          patch.visual_guide_url = ytUrl;
          stats.youtubeUpdated++;
          console.log(`  ✓ visual_guide_url (YouTube): ${ytUrl}`);
        } else {
          console.log('  - visual_guide_url: 미수집');
        }
      }
    }

    // id 외 변경 필드가 있는 경우만 배치에 추가
    if (Object.keys(patch).length > 1) {
      batchUpdates.push(patch);
    } else {
      stats.skipped++;
    }
  }

  // 저장 단계: 배치 upsert (id 기준, NULL 아닌 기존 값은 merge-duplicates로 보존)
  if (batchUpdates.length > 0) {
    console.log(`\n💾 배치 upsert 실행 (${batchUpdates.length}개)...`);
    try {
      await supabaseBatchUpsert('exercises', batchUpdates);
      console.log('  ✓ 저장 완료');
    } catch (err) {
      console.error(`  ❌ 배치 저장 실패: ${err.message}`);
      stats.failed = batchUpdates.length;
    }
  }

  // ─── 결과 요약 ───
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 수집 결과 요약');
  console.log(`  처리: ${stats.total}개`);
  console.log(`  건너뜀 (기존 데이터): ${stats.skipped}개`);
  console.log(`  description_en 업데이트: ${stats.descriptionUpdated}개`);
  console.log(`  visual_guide_url 업데이트 (GIF): ${stats.gifUpdated}개`);
  console.log(`  visual_guide_url 업데이트 (YouTube): ${stats.youtubeUpdated}개`);
  console.log(`  실패: ${stats.failed}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (stats.failed > 0) {
    console.log('\n⚠️  일부 종목 저장에 실패했습니다. Supabase 연결 및 RLS 정책을 확인하세요.');
  } else {
    console.log('\n✅ 완료!');
  }
}

main().catch((err) => {
  console.error('❌ 예기치 않은 오류:', err);
  process.exit(1);
});
