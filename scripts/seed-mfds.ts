/**
 * MFDS(식품의약품안전처) 식품영양성분 DB 대량 시딩 스크립트
 *
 * 사전 준비:
 *   1. .env 파일에 추가:
 *      EXPO_PUBLIC_SUPABASE_URL=...
 *      EXPO_PUBLIC_MFDS_API_KEY=...
 *      SUPABASE_SERVICE_ROLE_KEY=...
 *   2. supabase/migrations/20260327_food_db_setup.sql Supabase SQL Editor에서 실행 완료
 *
 * 실행:
 *   npx tsx scripts/seed-mfds.ts
 *
 * 중단 후 재시작:
 *   동일 명령어 재실행 — scripts/.mfds-seed-progress.json에서 이어서 시작
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// .env 로드 (프로젝트 루트 기준)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── 환경 변수 ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MFDS_API_KEY = process.env.EXPO_PUBLIC_MFDS_API_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !MFDS_API_KEY) {
  console.error('❌ 필수 환경 변수가 누락됐습니다:');
  if (!SUPABASE_URL) console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  if (!SERVICE_ROLE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  if (!MFDS_API_KEY) console.error('   - EXPO_PUBLIC_MFDS_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── 설정 ──────────────────────────────────────────────────────────────────────

const MFDS_BASE = 'https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1';
const ENDPOINT = '/getFoodNtrItdntList1';
const PAGE_SIZE = 100;
const DELAY_MS = 200;       // 요청 간 지연 (API 남용 방지)
const RETRY_DELAY_MS = 5000; // 429 시 대기
const MAX_RETRIES = 3;

const PROGRESS_FILE = path.resolve(__dirname, '.mfds-seed-progress.json');

// ─── 타입 ──────────────────────────────────────────────────────────────────────

interface MfdsRow {
  DESC_KOR?: string;
  SERVING_SIZE?: string;
  NUTR_CONT1?: string; // 칼로리
  NUTR_CONT2?: string; // 탄수화물
  NUTR_CONT3?: string; // 단백질
  NUTR_CONT4?: string; // 지방
  BGN_YEAR?: string;
  ANIMAL_PLANT?: string;
  MAKER_NAME?: string;
}

interface MfdsApiResponse {
  header?: { resultCode?: string; resultMsg?: string };
  body?: {
    totalCount?: number;
    items?: MfdsRow[] | { item?: MfdsRow[] };
  };
}

interface Progress {
  lastCompletedPage: number;
  totalInserted: number;
  startedAt: string;
  updatedAt: string;
}

// ─── 유틸 ──────────────────────────────────────────────────────────────────────

function parseNumber(value?: string): number {
  if (!value) return 0;
  const parsed = parseFloat(value.replace(/,/g, '').trim());
  return isFinite(parsed) ? parsed : 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch {}
  return {
    lastCompletedPage: 0,
    totalInserted: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function saveProgress(progress: Progress): void {
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── MFDS API ─────────────────────────────────────────────────────────────────

async function fetchMfdsPage(pageNo: number, retries = 0): Promise<MfdsApiResponse> {
  const params = new URLSearchParams({
    serviceKey: MFDS_API_KEY,
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    type: 'json',
  });

  const url = `${MFDS_BASE}${ENDPOINT}?${params}`;

  try {
    const res = await fetch(url);

    if (res.status === 429) {
      if (retries < MAX_RETRIES) {
        console.log(`  ⏳ Rate limit (429) — ${RETRY_DELAY_MS / 1000}초 대기 후 재시도...`);
        await sleep(RETRY_DELAY_MS);
        return fetchMfdsPage(pageNo, retries + 1);
      }
      throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`);
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as MfdsApiResponse;
  } catch (err) {
    if (retries < MAX_RETRIES && err instanceof Error && err.message.includes('fetch')) {
      console.log(`  ⚠️  네트워크 에러 — ${RETRY_DELAY_MS / 1000}초 후 재시도...`);
      await sleep(RETRY_DELAY_MS);
      return fetchMfdsPage(pageNo, retries + 1);
    }
    throw err;
  }
}

function extractRows(data: MfdsApiResponse): MfdsRow[] {
  const items = data.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return Array.isArray(items.item) ? items.item : items.item ? [items.item as unknown as MfdsRow] : [];
}

// ─── 데이터 변환 ───────────────────────────────────────────────────────────────

function mfdsRowToFoodRecord(item: MfdsRow): Record<string, unknown> | null {
  const name = item.DESC_KOR?.trim();
  const calories = parseNumber(item.NUTR_CONT1);

  // 이름 없거나 칼로리 0 이하인 경우 스킵
  if (!name || calories <= 0) return null;

  const brand = item.MAKER_NAME?.trim() || item.ANIMAL_PLANT?.trim() || '';
  const servingSize = parseNumber(item.SERVING_SIZE);

  return {
    product_name: name,
    name_ko: name,
    brand,                                         // NULL 대신 '' 사용 (UNIQUE 제약)
    calories_per_100g: round1(calories),
    carbs_per_100g: round1(parseNumber(item.NUTR_CONT2)),
    protein_per_100g: round1(parseNumber(item.NUTR_CONT3)),
    fat_per_100g: round1(parseNumber(item.NUTR_CONT4)),
    sodium_per_100g: null,
    sugar_per_100g: null,
    source: 'mfds',
    visibility: 'public',
    user_id: null,
    ...(servingSize > 0 ? { notes: `1회 제공량: ${servingSize}g` } : {}),
  };
}

// ─── Supabase upsert ──────────────────────────────────────────────────────────

async function upsertBatch(records: Record<string, unknown>[]): Promise<number> {
  if (records.length === 0) return 0;

  const { error, count } = await supabase
    .from('foods')
    .upsert(records as never[], {
      onConflict: 'product_name,brand',
      ignoreDuplicates: false,
    })
    .select('id');

  if (error) {
    console.error('  ❌ upsert 에러:', error.message);
    return 0;
  }

  return count ?? records.length;
}

// ─── 메인 ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌾 MFDS 식품 DB 시딩 시작\n');

  // progress 로드
  const progress = loadProgress();
  const startPage = progress.lastCompletedPage + 1;

  if (progress.lastCompletedPage > 0) {
    console.log(`📂 이어서 시작: 페이지 ${startPage} (이전 완료: ${progress.lastCompletedPage}, 누적: ${progress.totalInserted}건)\n`);
  }

  // 총 건수 파악 (1건만 조회)
  console.log('📊 총 데이터 건수 조회 중...');
  const firstPage = await fetchMfdsPage(1);
  const totalCount = firstPage.body?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  console.log(`   총 ${totalCount.toLocaleString()}건 / ${totalPages}페이지\n`);

  if (totalCount === 0) {
    console.error('❌ MFDS API에서 데이터를 가져오지 못했습니다. API 키를 확인하세요.');
    process.exit(1);
  }

  // 이미 첫 페이지를 가져왔으므로 startPage === 1이면 처리
  let currentInserted = progress.totalInserted;
  const startTime = Date.now();

  for (let page = startPage; page <= totalPages; page++) {
    try {
      // 첫 페이지는 이미 조회함
      const data = page === 1 && startPage === 1 ? firstPage : await fetchMfdsPage(page);
      const rows = extractRows(data);

      const records = rows
        .map(mfdsRowToFoodRecord)
        .filter((r): r is Record<string, unknown> => r !== null);

      if (records.length > 0) {
        await upsertBatch(records);
        currentInserted += records.length;
      }

      // progress 저장
      progress.lastCompletedPage = page;
      progress.totalInserted = currentInserted;
      saveProgress(progress);

      // 진행 상황 출력 (10페이지마다 또는 마지막 페이지)
      if (page % 10 === 0 || page === totalPages) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const pct = ((page / totalPages) * 100).toFixed(1);
        console.log(`  [${page}/${totalPages}] ${pct}% | 누적 ${currentInserted.toLocaleString()}건 | ${elapsed}초 경과`);
      }

      // API 속도 제한 방지
      if (page < totalPages) {
        await sleep(DELAY_MS);
      }

    } catch (err) {
      console.error(`\n  ❌ 페이지 ${page} 처리 실패:`, err instanceof Error ? err.message : err);
      console.log('  → progress.json 저장됨. 재실행 시 이어서 진행합니다.');
      saveProgress(progress);
      process.exit(1);
    }
  }

  // 완료
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ 시딩 완료!`);
  console.log(`   총 ${currentInserted.toLocaleString()}건 적재 | 소요 시간: ${totalElapsed}초`);
  console.log(`\n📋 검증 SQL (Supabase SQL Editor에서 실행):`);
  console.log(`   SELECT source, COUNT(*) FROM foods GROUP BY source;`);
  console.log(`   SELECT * FROM foods WHERE product_name ILIKE '%닭가슴살%' LIMIT 5;`);

  // progress 파일 삭제 (완료 후)
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log(`\n🗑️  .mfds-seed-progress.json 삭제됨 (완료 후 자동 정리)`);
  }
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
