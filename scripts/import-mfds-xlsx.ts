/**
 * MFDS XLSX 파일 → Supabase foods 테이블 임포트
 *
 * 대상 파일 (~/Downloads/ 에 위치):
 *   - 음식DB.xlsx
 *   - 건강기능식품DB.xlsx
 *
 * 실행:
 *   npx tsx scripts/import-mfds-xlsx.ts
 */

import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경 변수 누락: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const DOWNLOADS = os.homedir() + '/Downloads';
const BATCH_SIZE = 500;

// ─── 유틸 ──────────────────────────────────────────────────────────────────────

function toNum(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/,/g, '').trim());
  return isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
}

function toNumOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(/,/g, '').trim());
  return isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null;
}

function dedupBatch(rows: any[]): any[] {
  const seen = new Map<string, any>();
  for (const row of rows) {
    const key = `${row.product_name}||${row.brand}`;
    seen.set(key, row);
  }
  return [...seen.values()];
}

async function upsertBatch(rows: any[]): Promise<number> {
  const deduped = dedupBatch(rows);
  const { error, data } = await supabase
    .from('foods')
    .upsert(deduped, { onConflict: 'product_name,brand' })
    .select('id');
  if (error) {
    console.error('\n  ⚠️  upsert 에러:', error.message);
    return 0;
  }
  return data?.length ?? 0;
}

// header:1 로 읽어서 배열 기반으로 컬럼 인덱스 매핑 (인코딩 문제 우회)
function readSheetAsArrays(filePath: string, sheetIndex = 0): any[][] {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[sheetIndex]];
  return XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
}

function findColIndex(header: any[], names: string[]): number {
  for (const name of names) {
    const idx = header.findIndex((h: any) => String(h).trim() === name.trim());
    if (idx >= 0) return idx;
  }
  return -1;
}

// ─── 음식DB 처리 ───────────────────────────────────────────────────────────────

async function importFoodDb() {
  const filePath = DOWNLOADS + '/음식DB.xlsx';
  console.log('\n📂 음식DB.xlsx 로딩 중...');

  const allRows = readSheetAsArrays(filePath);
  const header = allRows[0];
  const dataRows = allRows.slice(1);

  console.log(`   총 ${dataRows.length.toLocaleString()}행 로드됨`);

  // 컬럼 인덱스 찾기
  const iName   = findColIndex(header, ['식품명']);
  const iCal    = findColIndex(header, ['에너지(kcal)', '에너지(Kcal)']);
  const iProt   = findColIndex(header, ['단백질(g)']);
  const iFat    = findColIndex(header, ['지방(g)']);
  const iCarb   = findColIndex(header, ['탄수화물(g)']);
  const iSodium = findColIndex(header, ['나트륨(mg)']);
  const iSugar  = findColIndex(header, ['당류(g)']);

  console.log(`   컬럼 인덱스 — 식품명:${iName} 칼로리:${iCal} 단백질:${iProt} 지방:${iFat} 탄수:${iCarb} 나트륨:${iSodium} 당:${iSugar}`);

  if (iName < 0 || iCal < 0) {
    console.error('   ❌ 필수 컬럼을 찾지 못했습니다. 헤더:', header.slice(0, 10));
    return 0;
  }

  let inserted = 0;
  let skipped = 0;
  let batch: any[] = [];

  for (const row of dataRows) {
    const name = String(row[iName] ?? '').trim();
    if (!name) { skipped++; continue; }

    const cal = toNum(row[iCal]);
    if (cal <= 0) { skipped++; continue; }

    batch.push({
      name,
      product_name: name,
      name_ko: name,
      name_en: null,
      brand: '',
      calories_per_100g: cal,
      protein_per_100g: toNum(row[iProt]),
      carbs_per_100g: toNum(row[iCarb]),
      fat_per_100g: toNum(row[iFat]),
      sodium_per_100g: toNumOrNull(row[iSodium]),
      sugar_per_100g: toNumOrNull(row[iSugar]),
      source: 'mfds',
      visibility: 'public',
      user_id: null,
      off_id: null,
    });

    if (batch.length >= BATCH_SIZE) {
      inserted += await upsertBatch(batch);
      batch = [];
      process.stdout.write(`\r   진행: ${inserted.toLocaleString()}건 삽입됨`);
    }
  }

  if (batch.length > 0) {
    inserted += await upsertBatch(batch);
  }

  console.log(`\n   ✅ 음식DB 완료 — 삽입: ${inserted.toLocaleString()}건, 스킵: ${skipped.toLocaleString()}건`);
  return inserted;
}

// ─── 건강기능식품DB 처리 ────────────────────────────────────────────────────────

async function importHealthDb() {
  const filePath = DOWNLOADS + '/건강기능식품DB.xlsx';
  console.log('\n📂 건강기능식품DB.xlsx 로딩 중...');

  const allRows = readSheetAsArrays(filePath);
  const header = allRows[0];
  const dataRows = allRows.slice(1);

  console.log(`   총 ${dataRows.length.toLocaleString()}행 로드됨`);

  const iName   = findColIndex(header, ['식품명']);
  const iUnit   = findColIndex(header, ['영양성분제공단위량']);
  const iCal    = findColIndex(header, ['에너지(kcal)', '에너지(Kcal)']);
  const iProt   = findColIndex(header, ['단백질(g)']);
  const iFat    = findColIndex(header, ['지방(g)']);
  const iCarb   = findColIndex(header, ['탄수화물(g)']);
  const iSodium = findColIndex(header, ['나트륨(mg)']);
  const iSugar  = findColIndex(header, ['당류(g)']);

  console.log(`   컬럼 인덱스 — 식품명:${iName} 단위:${iUnit} 칼로리:${iCal}`);

  if (iName < 0 || iCal < 0) {
    console.error('   ❌ 필수 컬럼을 찾지 못했습니다.');
    return 0;
  }

  // 단위 샘플 출력 (어떤 단위들이 있는지 확인)
  const unitSamples = new Set<string>();
  for (const row of dataRows.slice(0, 50)) {
    const u = String(row[iUnit] ?? '').trim();
    if (u) unitSamples.add(u);
  }
  console.log(`   단위 샘플:`, [...unitSamples].slice(0, 8));

  let inserted = 0;
  let skipped = 0;
  let batch: any[] = [];

  for (const row of dataRows) {
    const name = String(row[iName] ?? '').trim();
    if (!name) { skipped++; continue; }

    // 단위가 100g인 것만 포함 (없으면 포함)
    if (iUnit >= 0) {
      const unit = String(row[iUnit] ?? '').trim().toLowerCase();
      if (unit && !unit.includes('100g') && !unit.includes('100 g')) {
        skipped++;
        continue;
      }
    }

    const cal = toNum(row[iCal]);
    if (cal <= 0) { skipped++; continue; }

    batch.push({
      name,
      product_name: name,
      name_ko: name,
      name_en: null,
      brand: '',
      calories_per_100g: cal,
      protein_per_100g: toNum(row[iProt]),
      carbs_per_100g: toNum(row[iCarb]),
      fat_per_100g: toNum(row[iFat]),
      sodium_per_100g: toNumOrNull(row[iSodium]),
      sugar_per_100g: toNumOrNull(row[iSugar]),
      source: 'mfds',
      visibility: 'public',
      user_id: null,
      off_id: null,
    });

    if (batch.length >= BATCH_SIZE) {
      inserted += await upsertBatch(batch);
      batch = [];
      process.stdout.write(`\r   진행: ${inserted.toLocaleString()}건 삽입됨`);
    }
  }

  if (batch.length > 0) {
    inserted += await upsertBatch(batch);
  }

  console.log(`\n   ✅ 건강기능식품DB 완료 — 삽입: ${inserted.toLocaleString()}건, 스킵: ${skipped.toLocaleString()}건`);
  return inserted;
}

// ─── 메인 ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌾 MFDS XLSX 임포트 시작\n');

  let total = 0;
  total += await importFoodDb();
  total += await importHealthDb();

  console.log(`\n🎉 전체 완료 — 총 ${total.toLocaleString()}건 Supabase 저장됨`);

  const { count } = await supabase
    .from('foods')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'mfds');
  console.log(`📊 Supabase foods(mfds) 건수: ${count?.toLocaleString()}건`);
}

main().catch(err => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
