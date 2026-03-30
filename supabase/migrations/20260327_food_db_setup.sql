-- ============================================================
-- food-database-setup migration
-- 실행: Supabase SQL Editor에서 전체 복사 후 실행
-- ============================================================

-- 1. 영양성분 NULL → 0 정규화 (NOT NULL 제약 준비)
UPDATE public.foods SET calories_per_100g = 0 WHERE calories_per_100g IS NULL;
UPDATE public.foods SET carbs_per_100g    = 0 WHERE carbs_per_100g IS NULL;
UPDATE public.foods SET protein_per_100g  = 0 WHERE protein_per_100g IS NULL;
UPDATE public.foods SET fat_per_100g      = 0 WHERE fat_per_100g IS NULL;

-- 2. 중복 행 제거 (product_name+brand 기준, created_at 오래된 것만 남김)
DELETE FROM public.foods
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY product_name, COALESCE(brand, '')
             ORDER BY created_at ASC
           ) AS rn
    FROM public.foods
  ) sub
  WHERE rn > 1
);

-- 3. brand NULL → '' 정규화 (UNIQUE 제약 준비)
UPDATE public.foods SET brand = '' WHERE brand IS NULL;

-- 4. (product_name, brand) 복합 UNIQUE 제약
--    이미 존재하면 스킵 (중복 실행 안전)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'foods_name_brand_unique'
  ) THEN
    ALTER TABLE public.foods
      ADD CONSTRAINT foods_name_brand_unique UNIQUE (product_name, brand);
  END IF;
END $$;

-- 4. product_name 패턴 검색 인덱스 (ilike 최적화)
CREATE INDEX IF NOT EXISTS foods_product_name_idx
  ON public.foods (product_name text_pattern_ops);

-- 5. source 필터 인덱스
CREATE INDEX IF NOT EXISTS foods_source_idx
  ON public.foods (source);

-- 6. FTS 인덱스 (미래 대비)
CREATE INDEX IF NOT EXISTS foods_fts_idx
  ON public.foods USING GIN (to_tsvector('simple', product_name));

-- 7. Insert 정책에 mfds source 허용 (서비스 롤 사용 시 RLS bypass라 불필요하지만 명시)
--    기존 정책 DROP 후 재생성
DROP POLICY IF EXISTS "Insert foods" ON public.foods;
CREATE POLICY "Insert foods" ON public.foods
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      (user_id IS NULL AND source IN ('openfoodfacts', 'mfds', 'usda'))
    )
  );

-- 확인 쿼리 (실행 후 체크)
-- SELECT COUNT(*) FROM foods;
-- SELECT source, COUNT(*) FROM foods GROUP BY source;
