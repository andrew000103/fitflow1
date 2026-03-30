# Design: food-database-setup

**Feature**: food-database-setup
**Date**: 2026-03-27
**Phase**: Design
**Architecture**: Option C — Pragmatic Balance
**Status**: In Progress

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | foods 테이블이 비어 검색이 불가하고, 기존 커스텀 음식의 영양 데이터도 NULL이라 앱 핵심 기능(식단 기록)이 동작 안 함 |
| **WHO** | 식단 탭에서 음식을 검색하거나 직접 등록하는 모든 사용자 |
| **RISK** | MFDS API 90k 페이지네이션 중 중단 → progress 파일로 재시작; brand NULL 충돌 → COALESCE 처리 |
| **SUCCESS** | 검색 시 Supabase 결과 반환, 기존 NULL 영양성분 복원, 80k건 이상 시딩 완료 |
| **SCOPE** | 새 스크립트 2개 + SQL 마이그레이션 + diet-search.ts 소폭 수정. 앱 UI 변경 없음 |

---

## 1. Overview

MFDS(식품의약품안전처) 공공 API를 통해 한국 식품 ~90,000건을 Supabase `foods` 테이블에
대량 시딩하는 로컬 실행 스크립트와 DB 마이그레이션을 설계한다.

**선택된 아키텍처 (Option C — Pragmatic Balance)**:
- DB: UNIQUE 제약 + FTS 인덱스 추가 (마이그레이션 SQL)
- 스크립트: `scripts/seed-mfds.ts` (시딩) + `scripts/enrich-null-foods.ts` (복구)
- 앱 코드: `diet-search.ts` limit 상향 + `FoodRow.source` 타입에 `'mfds'` 추가 (최소 변경)

---

## 2. 파일 구조

```
fit/
├── scripts/
│   ├── seed-mfds.ts              # 신규: MFDS 90k 대량 시딩
│   ├── enrich-null-foods.ts      # 신규: NULL 영양성분 복구
│   └── .mfds-seed-progress.json  # 자동 생성: 진행 상황 (gitignore)
├── supabase/
│   └── migrations/
│       └── 20260327_food_db_setup.sql  # 신규: UNIQUE 제약 + 인덱스
└── src/
    └── lib/
        └── diet-search.ts        # 수정: source 타입 + limit 상향
```

**변경 파일 요약**:
| 파일 | 변경 종류 | 내용 |
|------|----------|------|
| `supabase/migrations/20260327_food_db_setup.sql` | 신규 | UNIQUE 제약, FTS 인덱스, source 인덱스 |
| `scripts/seed-mfds.ts` | 신규 | 90k 시딩 스크립트 |
| `scripts/enrich-null-foods.ts` | 신규 | NULL 복구 스크립트 |
| `src/lib/diet-search.ts` | 수정 | FoodRow.source에 'mfds' 추가, limit 20→50 |
| `.gitignore` | 수정 | `.mfds-seed-progress.json` 추가 |
| `.env.example` | 수정 | `SUPABASE_SERVICE_ROLE_KEY` 항목 추가 |

---

## 3. DB 스키마 설계

### 3.1 마이그레이션 SQL (`20260327_food_db_setup.sql`)

```sql
-- 1. brand NULL 허용 확인 (기존 foods 테이블 구조 유지)
-- brand가 NULL인 경우 빈 문자열('')로 대체하여 UNIQUE 제약 적용

-- 2. brand NULL → '' 정규화 (UNIQUE 제약 준비)
UPDATE public.foods SET brand = '' WHERE brand IS NULL;
ALTER TABLE public.foods ALTER COLUMN brand SET DEFAULT '';
ALTER TABLE public.foods ALTER COLUMN brand SET NOT NULL;

-- 3. (product_name, brand) 복합 UNIQUE 제약
ALTER TABLE public.foods
  ADD CONSTRAINT foods_name_brand_unique UNIQUE (product_name, brand);

-- 4. 검색 성능 인덱스 (ilike 최적화)
CREATE INDEX IF NOT EXISTS foods_product_name_idx
  ON public.foods (product_name text_pattern_ops);

-- 5. source 필터 인덱스
CREATE INDEX IF NOT EXISTS foods_source_idx
  ON public.foods (source);

-- 6. FTS 인덱스 (미래 대비, 현재는 ilike 사용)
CREATE INDEX IF NOT EXISTS foods_fts_idx
  ON public.foods USING GIN (to_tsvector('simple', product_name));
```

> **brand NULL 전략**: MFDS 데이터에는 brand(MAKER_NAME)가 없는 경우가 많음.
> NULL 대신 `''`(빈 문자열)로 정규화하여 UNIQUE 제약이 올바르게 동작하도록 함.

### 3.2 upsert 충돌 처리
```sql
-- seed 스크립트에서 사용할 upsert 패턴
INSERT INTO foods (product_name, brand, calories_per_100g, ...)
VALUES (...)
ON CONFLICT (product_name, brand) DO UPDATE SET
  calories_per_100g = EXCLUDED.calories_per_100g,
  protein_per_100g  = EXCLUDED.protein_per_100g,
  carbs_per_100g    = EXCLUDED.carbs_per_100g,
  fat_per_100g      = EXCLUDED.fat_per_100g,
  source            = EXCLUDED.source,
  updated_at        = NOW()
WHERE foods.calories_per_100g IS NULL  -- NULL일 때만 덮어쓰기
   OR foods.source = 'mfds';           -- mfds 소스는 항상 최신화
```

---

## 4. `scripts/seed-mfds.ts` 상세 설계

### 4.1 전체 흐름

```
START
  ↓
progress.json 읽기 (없으면 startPage=1)
  ↓
totalCount 조회 (page=1, numOfRows=1) → 총 페이지 수 계산
  ↓
LOOP: page = startPage → lastPage
  ├─ MFDS API 호출 (numOfRows=100)
  ├─ 응답 파싱 → FoodRow[] 변환
  ├─ Supabase batch upsert
  ├─ progress.json 업데이트
  ├─ 200ms 지연
  └─ 콘솔: [페이지/총페이지] 누적건수
  ↓
완료 메시지 출력
```

### 4.2 진행 상황 파일 (`scripts/.mfds-seed-progress.json`)
```json
{
  "lastCompletedPage": 456,
  "totalInserted": 45600,
  "startedAt": "2026-03-27T10:00:00Z",
  "updatedAt": "2026-03-27T10:03:00Z"
}
```

### 4.3 MFDS → FoodRow 변환 함수
```typescript
function mfdsRowToFoodRow(item: MfdsRow): Partial<FoodRow> | null {
  const name = item.DESC_KOR?.trim();
  const calories = parseNumber(item.NUTR_CONT1);
  if (!name || calories <= 0) return null;

  return {
    product_name: name,
    name_ko: name,
    brand: item.MAKER_NAME?.trim() || '',  // NULL → ''
    calories_per_100g: round1(calories),
    carbs_per_100g: round1(parseNumber(item.NUTR_CONT2)),
    protein_per_100g: round1(parseNumber(item.NUTR_CONT3)),
    fat_per_100g: round1(parseNumber(item.NUTR_CONT4)),
    source: 'mfds',
    visibility: 'public',
    user_id: null,
  };
}
```

### 4.4 에러 처리
- HTTP 429 (Rate Limit): 5초 대기 후 재시도 (최대 3회)
- HTTP 5xx: 콘솔 경고 후 다음 페이지 진행
- Supabase upsert 에러: 배치 건너뛰고 로그 기록

### 4.5 실행 방법
```bash
# 환경 변수 설정 (.env에 추가)
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# 실행
npx tsx scripts/seed-mfds.ts

# 중단 후 재시작 (progress.json 자동 감지)
npx tsx scripts/seed-mfds.ts
```

---

## 5. `scripts/enrich-null-foods.ts` 상세 설계

### 5.1 전체 흐름

```
START
  ↓
foods WHERE calories_per_100g IS NULL 조회
  ↓
LOOP: 각 food
  ├─ MFDS API 검색 (desc_kor=product_name, numOfRows=5)
  ├─ 첫 결과의 DESC_KOR === product_name 정확 일치 체크
  ├─ 일치: UPDATE SET calories/protein/carbs/fat, source='mfds'
  ├─ 불일치: 로그에 기록 후 스킵
  └─ 300ms 지연
  ↓
완료: 매칭 N건, 스킵 M건 출력
```

### 5.2 매칭 전략
- 1순위: 정확 일치 (`result.DESC_KOR === food.product_name`)
- 2순위: 앞 10글자 일치 (부분 매칭)
- 매칭 실패 시 스킵 (NULL 유지, 수동 입력 필요)

---

## 6. `diet-search.ts` 수정 사항

### 변경 1: FoodRow.source 타입 확장

```typescript
// Before
source: 'openfoodfacts' | 'user';

// After
source: 'openfoodfacts' | 'mfds' | 'usda' | 'user';
```

### 변경 2: searchDb 함수 limit 상향

```typescript
// Before
.limit(20)

// After
.limit(50)  // 90k DB에서 더 많은 결과 허용
```

### 변경 3: 영양성분 NULL 방어 처리

```typescript
// FoodRow → FoodItem 변환 시 NULL 안전 처리 추가
calories_per_100g: row.calories_per_100g ?? 0,
protein_per_100g:  row.protein_per_100g ?? 0,
carbs_per_100g:    row.carbs_per_100g ?? 0,
fat_per_100g:      row.fat_per_100g ?? 0,
```

---

## 7. 환경 변수

| 변수명 | 용도 | 위치 |
|--------|------|------|
| `EXPO_PUBLIC_MFDS_API_KEY` | MFDS API 인증 | `.env` (이미 설정됨) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase URL | `.env` (이미 설정됨) |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS bypass용 (스크립트 전용) | `.env` (새로 추가) |

> `SUPABASE_SERVICE_ROLE_KEY`는 Supabase 대시보드 → Settings → API → service_role에서 확인.
> **앱 번들에 포함되지 않음** — 스크립트 전용 로컬 키.

---

## 8. 보안 고려사항

- `SUPABASE_SERVICE_ROLE_KEY`: `.env`에만 저장, `.gitignore` 확인
- `scripts/.mfds-seed-progress.json`: `.gitignore`에 추가
- 스크립트는 로컬에서만 실행 (CI/CD에 포함하지 않음)

---

## 9. 성능 예측

| 항목 | 수치 |
|------|------|
| 총 페이지 수 | ~900 (90k ÷ 100) |
| 페이지당 소요 시간 | ~300ms (API 200ms + 처리 100ms) |
| 전체 시딩 시간 | ~270초 (~4.5분) |
| DB 용량 (90k × 1행 평균 500B) | ~45MB |
| 검색 쿼리 시간 (인덱스 적용 후) | < 100ms |

---

## 10. 의존성

신규 설치 패키지 없음. 기존 의존성만 사용:
- `@supabase/supabase-js` (이미 설치됨)
- `tsx` / `ts-node` — 스크립트 실행 (개발 의존성, 이미 설치됨 여부 확인 필요)

```bash
# tsx 없으면 설치
npm install -D tsx
```

---

## 11. Implementation Guide

### 11.1 구현 순서 체크리스트

```
[ ] Module-1: SQL 마이그레이션
    [ ] supabase/migrations/20260327_food_db_setup.sql 작성
    [ ] Supabase SQL Editor에서 실행
    [ ] UNIQUE 제약 적용 확인

[ ] Module-2: seed-mfds.ts
    [ ] scripts/ 디렉토리 생성
    [ ] .env에 SUPABASE_SERVICE_ROLE_KEY 추가
    [ ] scripts/seed-mfds.ts 작성
    [ ] .gitignore에 scripts/.mfds-seed-progress.json 추가
    [ ] 테스트 실행 (3페이지만): npx tsx scripts/seed-mfds.ts --test
    [ ] 전체 실행: npx tsx scripts/seed-mfds.ts

[ ] Module-3: enrich-null-foods.ts
    [ ] scripts/enrich-null-foods.ts 작성
    [ ] 실행: npx tsx scripts/enrich-null-foods.ts

[ ] Module-4: diet-search.ts 수정
    [ ] FoodRow.source 타입 확장
    [ ] limit 20 → 50
    [ ] NULL 방어 처리
```

### 11.2 검증 방법

```bash
# 시딩 완료 후 Supabase SQL Editor에서 확인
SELECT COUNT(*) FROM foods WHERE source = 'mfds';
-- 기대값: 80,000+

SELECT COUNT(*) FROM foods WHERE calories_per_100g IS NULL;
-- 기대값: enrich 후 감소

-- 검색 테스트
SELECT * FROM foods WHERE product_name ILIKE '%닭가슴살%' LIMIT 10;
```

앱에서 식단 탭 → 음식 추가 → "닭가슴살" 검색 → 결과 확인

### 11.3 Session Guide

| 모듈 | 작업 | 소요 시간 |
|------|------|-----------|
| module-1 | SQL 마이그레이션 작성 + 실행 | 5분 |
| module-2 | seed-mfds.ts 작성 + 전체 실행 | 30분 (실행 4.5분 포함) |
| module-3 | enrich-null-foods.ts 작성 + 실행 | 10분 |
| module-4 | diet-search.ts 소폭 수정 | 5분 |

**권장 세션 분리**:
- Session 1: module-1 + module-2 (DB 준비 + 시딩)
- Session 2: module-3 + module-4 (복구 + 검색 개선)

또는 전체를 한 세션에: `/pdca do food-database-setup`
