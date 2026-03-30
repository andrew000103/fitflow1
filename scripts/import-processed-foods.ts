/**
 * 가공식품DB.xlsx (155MB, 256,741건) 스트리밍 임포트
 *
 * 실행:
 *   npx tsx scripts/import-processed-foods.ts
 */

import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import ExcelJS from 'exceljs';
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

const FILE_PATH = os.homedir() + '/Downloads/가공식품.xlsx';
const BATCH_SIZE = 500;

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
    seen.set(`${row.product_name}||${row.brand}`, row);
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

async function main() {
  console.log('🌾 가공식품DB 스트리밍 임포트 시작\n');
  console.log(`📂 파일: ${FILE_PATH}\n`);

  const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(FILE_PATH, {
    worksheets: 'emit',
    sharedStrings: 'cache',
    hyperlinks: 'ignore',
    styles: 'ignore',
    entries: 'emit',
  });

  let colMap: Record<string, number> = {};
  let headerParsed = false;
  let inserted = 0;
  let skipped = 0;
  let rowCount = 0;
  let batch: any[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    inserted += await upsertBatch(batch);
    batch = [];
    process.stdout.write(`\r   진행: ${rowCount.toLocaleString()}행 처리 / ${inserted.toLocaleString()}건 삽입`);
  };

  for await (const worksheetReader of workbookReader) {
    if (typeof worksheetReader === 'object' && 'on' in worksheetReader) {
      const ws = worksheetReader as ExcelJS.stream.xlsx.WorksheetReader;

      for await (const row of ws) {
        const values = (row.values as any[]) ?? [];
        // exceljs row.values는 1-indexed (index 0 = undefined)

        if (!headerParsed) {
          // 헤더 행 파싱
          values.forEach((v, i) => {
            if (v) colMap[String(v).trim()] = i;
          });
          // 필수 컬럼 확인
          const nameIdx = colMap['식품명'];
          const calIdx = colMap['에너지(kcal)'] ?? colMap['에너지(Kcal)'];
          if (!nameIdx || !calIdx) {
            console.log('   헤더 샘플:', values.slice(1, 10));
            console.error('❌ 필수 컬럼(식품명, 에너지) 없음');
            process.exit(1);
          }
          console.log(`   컬럼 매핑 완료 — 식품명:${nameIdx} 칼로리:${calIdx}`);
          headerParsed = true;
          continue;
        }

        rowCount++;

        const iName   = colMap['식품명'];
        const iCal    = colMap['에너지(kcal)'] ?? colMap['에너지(Kcal)'];
        const iProt   = colMap['단백질(g)'];
        const iFat    = colMap['지방(g)'];
        const iCarb   = colMap['탄수화물(g)'];
        const iSodium = colMap['나트륨(mg)'];
        const iSugar  = colMap['당류(g)'];
        const iBrand  = colMap['제조사명'] ?? colMap['브랜드'] ?? colMap['MAKER_NAME'];

        const name = String(values[iName] ?? '').trim();
        if (!name) { skipped++; continue; }

        const cal = toNum(values[iCal]);
        if (cal <= 0) { skipped++; continue; }

        const brand = iBrand ? String(values[iBrand] ?? '').trim() : '';

        batch.push({
          name,
          product_name: name,
          name_ko: name,
          name_en: null,
          brand,
          calories_per_100g: cal,
          protein_per_100g: toNum(values[iProt]),
          carbs_per_100g: toNum(values[iCarb]),
          fat_per_100g: toNum(values[iFat]),
          sodium_per_100g: toNumOrNull(values[iSodium]),
          sugar_per_100g: toNumOrNull(values[iSugar]),
          source: 'mfds',
          visibility: 'public',
          user_id: null,
          off_id: null,
        });

        if (batch.length >= BATCH_SIZE) {
          await flush();
        }
      }
    }
  }

  await flush();

  console.log(`\n\n✅ 완료!`);
  console.log(`   처리: ${rowCount.toLocaleString()}행`);
  console.log(`   삽입: ${inserted.toLocaleString()}건`);
  console.log(`   스킵: ${skipped.toLocaleString()}건`);

  const { count } = await supabase
    .from('foods')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'mfds');
  console.log(`\n📊 Supabase foods(mfds) 총 건수: ${count?.toLocaleString()}건`);
}

main().catch(err => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
