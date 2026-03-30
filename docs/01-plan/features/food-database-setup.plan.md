# Plan: food-database-setup

**Feature**: food-database-setup
**Date**: 2026-03-27
**Phase**: Plan
**Status**: In Progress

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | Supabase `foods` 테이블이 비어 있어 식품 검색이 전혀 동작하지 않고, 기존에 등록한 커스텀 음식의 영양성분도 NULL 상태라 사용 불가 |
| **Solution** | MFDS 공공 API(식약처)로 한국 식품 ~90,000건을 Supabase에 대량 시딩하고, 기존 NULL 영양성분을 이름 매칭으로 자동 복구 |
| **Function UX Effect** | 식단 탭 음식 검색에서 한국 식품이 즉시 표시되고, 이전에 등록한 음식도 영양성분이 복원되어 정상 사용 가능 |
| **Core Value** | 별도 유료 API 없이 공공 데이터만으로 FatSecret 수준의 한국 식품 DB를 앱 내에 구축 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | foods 테이블이 비어 검색이 불가하고, 기존 커스텀 음식의 영양 데이터도 NULL이라 앱 핵심 기능(식단 기록)이 동작 안 함 |
| **WHO** | 식단 탭에서 음식을 검색하거나 직접 등록하는 모든 사용자 |
| **RISK** | MFDS API 90k 페이지네이션 중 네트워크 에러로 중단 가능 → 재시작 가능한 offset 기반 시딩 필요 |
| **SUCCESS** | (1) 식품 이름 검색 시 Supabase에서 결과 반환 (2) 기존 NULL 음식 중 매칭된 것의 영양성분 복원 (3) 중복 없이 ~90k 시딩 완료 |
| **SCOPE** | 새 seed 스크립트 + DB 스키마 변경 (mfds_id 컬럼) + NULL 복구 스크립트. 앱 코드 변경 최소화 |

---

## 1. 배경 및 현황

### 현재 상태
- `foods` 테이블이 Supabase에 존재하지만 행(row)이 없음
- 기존 등록 음식: `product_name`, `brand` 등 기본 정보는 있으나 `calories_per_100g`, `protein_per_100g` 등 영양성분 전부 NULL
- `food-search.ts`는 4개 소스(Supabase + MFDS API + OpenFoodFacts + USDA) 병렬 검색 구조로 이미 올바르게 구현됨
- `EXPO_PUBLIC_MFDS_API_KEY`는 `.env`에 이미 설정됨

### 원인 분석
- Supabase DB에 초기 데이터 seed가 없었음
- MFDS API는 실시간 검색용으로만 사용 중 (20건/쿼리), 대량 사전 로딩 없음
- 기존 커스텀 음식 등록 시 영양성분이 누락된 채 저장된 것으로 추정

---

## 2. 요구사항

### FR-01: MFDS DB 스키마 확장
- `foods` 테이블에 `mfds_id TEXT UNIQUE` 컬럼 추가
- 중복 방지 upsert 기준으로 사용
- 기존 foods_off_id_idx와 병행

### FR-02: MFDS 전체 대량 시딩 스크립트
- `scripts/seed-mfds.ts` (로컬 Node.js 실행)
- MFDS API 페이지네이션: `pageNo` 1부터 마지막까지 100건씩 반복
- 총 ~90,000건 (약 900 페이지)
- 진행 상황 콘솔 출력 (페이지 번호, 누적 건수)
- 중단 후 재시작 가능: `scripts/.mfds-seed-progress.json`에 마지막 완료 페이지 저장
- 속도 제한: 요청 사이 200ms 지연 (공공 API 남용 방지)
- 배치 upsert: 100건씩 `supabase.from('foods').upsert()`

### FR-03: NULL 영양성분 복구 스크립트
- `scripts/enrich-null-foods.ts` (로컬 Node.js 실행)
- `foods` 테이블에서 `calories_per_100g IS NULL` 행 조회
- 각 음식 이름으로 MFDS API 검색 (pageNo=1, numOfRows=5)
- 첫 번째 결과의 이름이 정확 일치 시 영양성분 UPDATE
- 매칭 실패 시 스킵 (로그에 기록)

### FR-04: 시딩 후 foods 테이블 full-text search 인덱스
- `CREATE INDEX foods_name_idx ON foods USING GIN (to_tsvector('simple', product_name))`
- 검색 속도 최적화

### FR-05: 기존 `diet-search.ts` 검색 개선 (선택)
- 현재 Supabase 검색: `ilike '%query%'` → 90k 행에서 느릴 수 있음
- 시딩 완료 후 full-text search로 전환 고려

---

## 3. 기술 상세

### MFDS API 구조
```
GET https://apis.data.go.kr/1471000/FoodNtrIrdntInfoService1/getFoodNtrItdntList1
  ?serviceKey={key}
  &pageNo=1
  &numOfRows=100
  &type=json
```
- 필드: DESC_KOR(이름), NUTR_CONT1(칼로리), NUTR_CONT2(탄수화물), NUTR_CONT3(단백질), NUTR_CONT4(지방), MAKER_NAME(제조사), SERVING_SIZE(1회 제공량)
- MFDS_ID 전용 필드 없음 → `{DESC_KOR}::{pageNo}::{rowIndex}` 조합을 mfds_id로 사용

> **MFDS_ID 전략**: MFDS API에는 고유 ID 필드가 없음.
> `product_name` + `brand` 조합으로 UNIQUE 제약 → `ON CONFLICT DO UPDATE` 방식 채택

### Supabase upsert 전략
```sql
-- conflict 기준: (product_name, brand) UNIQUE
INSERT INTO foods (...) VALUES (...)
ON CONFLICT (product_name, brand) DO UPDATE SET
  calories_per_100g = EXCLUDED.calories_per_100g,
  ...
```
- 기존 NULL 음식과 시딩 충돌 시 영양성분이 자동 업데이트됨 (FR-03 효과 포함)

### 스크립트 실행 환경
- `ts-node` 또는 `npx tsx scripts/seed-mfds.ts`
- Supabase service_role 키 필요 (RLS bypass): `.env`에 `SUPABASE_SERVICE_ROLE_KEY` 추가
- 기존 `EXPO_PUBLIC_SUPABASE_URL` 재사용

---

## 4. 스키마 변경

```sql
-- 1. product_name + brand 복합 UNIQUE (upsert 기준)
ALTER TABLE public.foods
  ADD CONSTRAINT foods_name_brand_unique UNIQUE (product_name, brand);

-- 2. full-text search 인덱스
CREATE INDEX IF NOT EXISTS foods_fts_idx
  ON public.foods USING GIN (to_tsvector('simple', product_name));

-- 3. source 컬럼 인덱스 (필터링용)
CREATE INDEX IF NOT EXISTS foods_source_idx ON public.foods (source);
```

---

## 5. 구현 모듈

### Module-1: DB 스키마 마이그레이션 SQL
- `supabase/migrations/20260327_food_db_indexes.sql` 작성
- Supabase SQL Editor에서 수동 실행

### Module-2: MFDS 대량 시딩 스크립트
- `scripts/seed-mfds.ts` 신규 생성
- progress 파일로 재시작 가능
- 예상 실행 시간: 900 페이지 × 200ms = ~3분

### Module-3: NULL 영양성분 복구 스크립트
- `scripts/enrich-null-foods.ts` 신규 생성
- 기존 커스텀 음식 복구

### Module-4: diet-search.ts 검색 방식 개선
- `ilike` → 정확도 높은 검색으로 개선 (source 필터, limit 상향 등)

---

## 6. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| MFDS API 속도 제한 | 중 | 200ms 지연 + 429 시 자동 재시도 |
| 90k 행 시딩 중 중단 | 중 | progress 파일로 이어하기 |
| 중복 충돌 | 높음 | (product_name, brand) UNIQUE + upsert |
| service_role 키 노출 | 낮음 | 스크립트는 로컬 실행, .gitignore |
| full-text search 인덱스 빌드 시간 | 낮음 | 시딩 완료 후 생성 |

---

## 7. 성공 기준

- [ ] `foods` 테이블에 MFDS 데이터 80,000건 이상 적재
- [ ] 식단 탭에서 "닭가슴살" 검색 시 결과 표시
- [ ] 기존 NULL 음식 중 MFDS 매칭률 70% 이상
- [ ] 중복 행 없음 (product_name + brand unique 확인)
- [ ] 검색 응답 속도 < 500ms

---

## 8. 구현 순서 (권장)

1. **Module-1** (5분): SQL 마이그레이션 Supabase 실행
2. **Module-2** (30분): seed 스크립트 작성 → 실행 (~3분)
3. **Module-3** (10분): enrich 스크립트 작성 → 실행
4. **Module-4** (15분): diet-search.ts 검색 품질 개선
5. 앱에서 직접 검색 테스트 (Expo Go)
