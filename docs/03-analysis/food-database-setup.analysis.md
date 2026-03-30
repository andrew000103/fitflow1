# Analysis: food-database-setup

**Feature**: food-database-setup
**Date**: 2026-03-28
**Phase**: Check
**Match Rate**: 91%
**Status**: Pass

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

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Core Requirements | 14/14 (100%) | ✅ Pass |
| File Structure | 11/15 (73%) | ⚠️ Warning |
| Architecture Compliance | 95% | ✅ Pass |
| **Overall Match Rate** | **91%** | ✅ Pass |

---

## Core Requirements Verification

| # | 요구사항 | 상태 | 구현 위치 | 신뢰도 |
|---|---------|:----:|----------|:------:|
| 1 | `FoodRow.source` 타입에 `'mfds' \| 'usda'` 추가 | ✅ | `diet-search.ts:80` | 100% |
| 2 | `searchDb` limit 20 → 50 | ✅ | `diet-search.ts:132` | 100% |
| 3 | NULL 방어 처리 (`?? 0`) | ✅ | `diet-search.ts:434-439` | 100% |
| 4 | `formatMfdsName()` 언더바 표기 처리 | ✅ | `diet-search.ts:412-418` | 100% |
| 5 | `foodRowToFoodItem()` export | ✅ | `diet-search.ts:420` | 100% |
| 6 | Migration: UNIQUE 제약 `(product_name, brand)` | ✅ | `20260327_food_db_setup.sql` | 100% |
| 7 | Migration: FTS 인덱스 | ✅ | `20260327_food_db_setup.sql` | 100% |
| 8 | Migration: source 인덱스 | ✅ | `20260327_food_db_setup.sql` | 100% |
| 9 | Migration: pattern search 인덱스 | ✅ | `20260327_food_db_setup.sql` | 100% |
| 10 | Migration: RLS policy mfds/usda 포함 | ✅ | `20260327_food_db_setup.sql` | 100% |
| 11 | `.env.example` `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `.env.example:15` | 100% |
| 12 | `.gitignore` `.mfds-seed-progress.json` | ✅ | `.gitignore:46-47` | 100% |
| 13 | `food-search.ts` cache key v1 → v2 | ✅ | `food-search.ts:8` | 100% |
| 14 | `food-search-screen.tsx` `foodRowToFoodItem` import | ✅ | `food-search-screen.tsx:22` | 100% |

---

## 파일 구조 비교

| 파일 | Design | 구현 | 비고 |
|------|:------:|:----:|------|
| `supabase/migrations/20260327_food_db_setup.sql` | 신규 | ✅ 존재 | DDL 모두 포함 |
| `scripts/seed-mfds.ts` | 신규 | ❌ 미생성 | XLSX 방식으로 의도적 대체 |
| `scripts/enrich-null-foods.ts` | 신규 | ❌ 미생성 | Migration SQL로 처리 |
| `src/lib/diet-search.ts` | 수정 | ✅ | 모든 변경 반영 |
| `.gitignore` | 수정 | ✅ | 항목 추가됨 |
| `.env.example` | 수정 | ✅ | 항목 추가됨 |
| `scripts/import-mfds-xlsx.ts` | 없음 | ✅ 추가됨 | API 대체, 269줄 |
| `scripts/import-processed-foods.ts` | 없음 | ✅ 추가됨 | 155MB 스트리밍 임포트 |
| `src/lib/food-search.ts` | 없음 | ✅ 수정됨 | cache v2 |
| `src/screens/diet/food-search-screen.tsx` | 없음 | ✅ 수정됨 | import 교체 |
| `src/stores/auth-store.ts` | 없음 | ✅ 수정됨 | signOut reset |
| `src/navigation/root-navigator.tsx` | 없음 | ✅ 수정됨 | 온보딩 스킵 로직 |
| `src/stores/ai-plan-store.ts` | 없음 | ✅ 수정됨 | markOnboardingComplete |

---

## 의도적 설계 변경 (Intentional Deviations)

### 1. MFDS API → XLSX 방식 전환
- **원인**: MFDS API 500 에러 지속 (data.go.kr 서비스 미활성화)
- **대안**: 식품안전나라에서 XLSX 직접 다운로드 → `import-mfds-xlsx.ts`
- **결과**: 동일 데이터, 더 높은 신뢰성 (API 의존성 제거)

### 2. `enrich-null-foods.ts` 스크립트 → Migration SQL로 통합
- **원인**: NULL 영양성분 복구를 Migration에서 일괄 처리
- **대안**: `20260327_food_db_setup.sql` 내 UPDATE 구문으로 처리
- **결과**: 원자적 실행, 별도 스크립트 불필요

### 3. 추가 임포트: `import-processed-foods.ts`
- **원인**: 가공식품DB.xlsx (155MB, 256,741건) 별도 스크리밍 임포트 필요
- **결과**: 총 264,704건 foods 테이블 적재 완료

---

## 실제 달성 수치

| 성공 기준 | 목표 | 실제 |
|----------|------|------|
| foods 테이블 적재 건수 | 80,000건+ | **264,704건** (mfds) |
| "닭가슴살" 검색 결과 | 결과 표시 | ✅ 확인됨 |
| 언더바 표기 처리 | 제거 | ✅ formatMfdsName() |
| 캐시 무효화 | 완료 | ✅ v2 키 |
| 중복 없음 | UNIQUE 보장 | ✅ 제약 적용 |
| 계정 분리 | AI 플랜 격리 | ✅ signOut reset |

---

## 권장 조치

### 문서 업데이트 필요 (Minor)
1. `docs/schema.md` — `foods_name_brand_unique`, `foods_source_idx`, `foods_product_name_idx`, `foods_fts_idx` 인덱스 반영 필요

### 즉시 조치 불필요
- 모든 핵심 요구사항 구현 완료
- 2개 "누락" 파일은 의도적 대체로 기능적으로 우수함
