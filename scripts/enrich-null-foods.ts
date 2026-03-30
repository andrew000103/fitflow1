/**
 * foods 테이블의 NULL 영양성분 자동 복구 스크립트
 *
 * 동작:
 *   - foods WHERE calories_per_100g = 0 (또는 IS NULL) 조회
 *   - 각 음식 이름으로 MFDS API 검색
 *   - 정확 일치 시 영양성분 UPDATE
 *   - 매칭 실패 시 로그만 기록
 *
 * 실행:
 *   npx tsx scripts/enrich-null-foods.ts
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MFDS_API_KEY = process.env.EXPO_PUBLIC_MFDS_API_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !MFDS_API_KEY) {
  console.error('❌ 필수 환경 변수 누락. seed-mfds.ts 주석 참고.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const MFDS_BASE = 'https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1';
const ENDPOINT = '/getFoodNtrItdntList1';
const DELAY_MS = 300;

interface MfdsRow {
  DESC_KOR?: string;
  NUTR_CONT1?: string;
  NUTR_CONT2?: string;
  NUTR_CONT3?: string;
  NUTR_CONT4?: string;
  MAKER_NAME?: string;
  SERVING_SIZE?: string;
}

interface MfdsApiResponse {
  body?: {
    items?: MfdsRow[] | { item?: MfdsRow[] };
  };
}

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

function extractRows(data: MfdsApiResponse): MfdsRow[] {
  const items = data.body?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return Array.isArray(items.item) ? items.item : [];
}

async function searchMfds(query: string): Promise<MfdsRow[]> {
  const params = new URLSearchParams({
    serviceKey: MFDS_API_KEY,
    desc_kor: query,
    pageNo: '1',
    numOfRows: '5',
    type: 'json',
  });

  const res = await fetch(`${MFDS_BASE}${ENDPOINT}?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as MfdsApiResponse;
  return extractRows(data);
}

async function main() {
  console.log('🔧 NULL 영양성분 복구 시작\n');

  // calories = 0 이거나 NULL인 음식 조회 (최대 1000건)
  const { data: nullFoods, error } = await supabase
    .from('foods')
    .select('id, product_name, source')
    .or('calories_per_100g.eq.0,calories_per_100g.is.null')
    .neq('source', 'mfds')  // 이미 mfds 소스인 것은 제외
    .limit(1000);

  if (error) {
    console.error('❌ Supabase 조회 에러:', error.message);
    process.exit(1);
  }

  if (!nullFoods || nullFoods.length === 0) {
    console.log('✅ 복구가 필요한 음식이 없습니다.');
    return;
  }

  console.log(`📋 복구 대상: ${nullFoods.length}건\n`);

  let matched = 0;
  let skipped = 0;

  for (const food of nullFoods) {
    const name: string = food.product_name;

    try {
      const results = await searchMfds(name);

      // 정확 일치 우선, 없으면 앞 10글자 부분 일치
      const exact = results.find((r) => r.DESC_KOR?.trim() === name);
      const partial = results.find((r) =>
        r.DESC_KOR?.trim().startsWith(name.substring(0, Math.min(name.length, 10)))
      );
      const match = exact ?? partial;

      if (match) {
        const calories = parseNumber(match.NUTR_CONT1);
        if (calories > 0) {
          const { error: updateError } = await supabase
            .from('foods')
            .update({
              calories_per_100g: round1(calories),
              carbs_per_100g: round1(parseNumber(match.NUTR_CONT2)),
              protein_per_100g: round1(parseNumber(match.NUTR_CONT3)),
              fat_per_100g: round1(parseNumber(match.NUTR_CONT4)),
              source: 'mfds',
            })
            .eq('id', food.id);

          if (updateError) {
            console.log(`  ⚠️  업데이트 실패 [${name}]: ${updateError.message}`);
          } else {
            matched++;
            if (matched % 10 === 0) {
              console.log(`  ✅ ${matched}건 복구됨 (최근: ${name})`);
            }
          }
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }

    } catch {
      skipped++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ 복구 완료!`);
  console.log(`   매칭 성공: ${matched}건`);
  console.log(`   매칭 실패(스킵): ${skipped}건`);
  console.log(`   매칭률: ${((matched / nullFoods.length) * 100).toFixed(1)}%`);
}

main().catch((err) => {
  console.error('❌ 치명적 오류:', err);
  process.exit(1);
});
