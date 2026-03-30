# Design: food-schema-unification

| 항목 | 내용 |
|------|------|
| Feature | food-schema-unification |
| Plan | docs/01-plan/features/food-schema-unification.plan.md |
| Created | 2026-03-26 |
| Architecture | Option C — Pragmatic (단계적 통합) |
| Status | Design |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | `custom-food-db.ts`(874줄) + AsyncStorage 로컬 캐시 → 이중 스키마 복잡도 제거 |
| **WHO** | 개발자 전용 리팩토링 (사용자 UX 변화: 커스텀 음식 폼 필드 일부 단순화) |
| **RISK** | `FoodItem`은 `MealEntry`/`diet-store`에 깊이 연결 → 이번 작업 범위 밖 |
| **SUCCESS** | `custom-food-db.ts` 삭제, AsyncStorage 음식 캐시 제거, 커스텀 CRUD → `diet-search.ts` |
| **SCOPE** | `diet-search.ts`, `custom-food-form-screen.tsx`, `food-search.ts`, `root-navigator.tsx`, `types/food.ts` |

---

## 1. Overview

### 1.1 현재 아키텍처 (Before)

```
food-search.ts (집계 검색)
  ├─ searchCustomFoods() ─────→ custom-food-db.ts
  │                               ├─ AsyncStorage (로컬 874줄)
  │                               ├─ FoodItem / CustomFoodRecord (정규화)
  │                               └─ Supabase sync (복잡)
  ├─ searchMfdsFoods()
  ├─ searchOpenFoodFactsFoods()
  └─ searchUsdaFoods()

diet-search.ts (Supabase-first)
  ├─ FoodRow (평면)
  ├─ searchFoods() → foods 테이블
  └─ saveUserFood() → foods 테이블

custom-food-form-screen.tsx
  └─ getCustomFoodById / saveCustomFood / updateCustomFood (custom-food-db)

types/food.ts
  ├─ FoodItem (정규화, FoodNutrients)
  ├─ CustomFoodRecord / CustomFoodInput (복잡 구조)
  ├─ MealEntry (diet-store 연결)
  └─ NutritionBasis / ServingInfo / FoodEditHistoryEntry (custom-food-db 전용)
```

### 1.2 목표 아키텍처 (After)

```
food-search.ts (집계 검색)
  ├─ searchDbUserFoods() ─────→ diet-search.ts  ← 변경
  │                               └─ FoodRow (평면 단일 타입)
  ├─ searchMfdsFoods()
  ├─ searchOpenFoodFactsFoods()
  └─ searchUsdaFoods()

diet-search.ts (확장)
  ├─ FoodRow (기존)
  ├─ searchFoods() (기존)
  ├─ saveUserFood() (기존)
  ├─ updateUserFood() ← 추가
  ├─ getFoodById() ← 추가
  └─ foodRowToFoodItem() ← 추가 (bridge 헬퍼)

custom-food-form-screen.tsx
  └─ getFoodById / saveUserFood / updateUserFood (diet-search) ← 교체

custom-food-db.ts → 삭제

types/food.ts (정리)
  ├─ FoodItem (유지, MealEntry 연결)
  ├─ MealEntry (유지, diet-store 연결)
  └─ CustomFoodInput / CustomFoodRecord / NutritionBasis / ServingInfo
     / FoodEditHistoryEntry / BrandType / BRAND_TYPE_LABEL
     / FOOD_VISIBILITY_LABEL / NUTRITION_UNIT_LABEL → 제거
```

---

## 2. 상세 설계

### 2.1 Module 1: diet-search.ts 확장

**추가할 함수 3개 + 헬퍼 1개:**

```typescript
// ─── getFoodById ───────────────────────────────────────────
export async function getFoodById(id: string): Promise<FoodRow | null> {
  const { data } = await supabase
    .from('foods')
    .select(SELECT_COLS)
    .eq('id', id)
    .maybeSingle();
  return (data as FoodRow | null) ?? null;
}

// ─── updateUserFood ───────────────────────────────────────
export interface UpdateUserFoodParams {
  name_ko?: string;
  brand?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  sodium_per_100g?: number | null;
  sugar_per_100g?: number | null;
  notes?: string | null;
}

export async function updateUserFood(id: string, params: UpdateUserFoodParams): Promise<FoodRow> {
  const { data, error } = await supabase
    .from('foods')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as FoodRow;
}

// ─── getUserFoods ─────────────────────────────────────────
export async function getUserFoods(userId: string): Promise<FoodRow[]> {
  const { data } = await supabase
    .from('foods')
    .select(SELECT_COLS)
    .eq('user_id', userId)
    .eq('source', 'user')
    .order('updated_at', { ascending: false })
    .limit(50);
  return (data as FoodRow[]) ?? [];
}

// ─── FoodRow → FoodItem bridge ────────────────────────────
// food-search.ts에서 FoodItem[] 타입 유지를 위한 변환 헬퍼
export function foodRowToFoodItem(row: FoodRow): FoodItem {
  return {
    id: row.id,
    name: row.name_ko ?? row.product_name,
    brand: row.brand ?? undefined,
    source: row.source === 'openfoodfacts' ? 'openfoodfacts' : 'custom',
    nutrition_basis: { amount: 100, unit: 'g', label: '100g' },
    nutrients: {
      calories: row.calories_per_100g,
      protein_g: row.protein_per_100g,
      carbs_g: row.carbs_per_100g,
      fat_g: row.fat_per_100g,
      sodium_mg: row.sodium_per_100g ?? undefined,
      sugar_g: row.sugar_per_100g ?? undefined,
    },
    notes: row.off_id ? undefined : undefined, // notes 컬럼 미포함 시 undefined
  };
}
```

**파일**: [src/lib/diet-search.ts](../../src/lib/diet-search.ts)
**변경**: 함수 4개 추가 (~60줄)

---

### 2.2 Module 2: custom-food-form-screen.tsx 단순화

**변경 핵심**:
- `import from '../../lib/custom-food-db'` → `import from '../../lib/diet-search'`
- `CustomFoodInput` 빌더 → `SaveUserFoodParams` / `UpdateUserFoodParams`
- 폼 필드 제거: `brandType`, `visibility`, `tags`, `basisUnit`, `basisAmount`, `servingAmount`, `servingUnit`, `fiber`, `saturatedFat`, `transFat`, `cholesterol`
- 폼 필드 유지: `productName`, `brand`, `notes`, `calories`, `protein`, `carbs`, `fat`, `sodium`, `sugar`
- `populateForm(food: FoodRow)` — `FoodRow` 기반으로 재구현

**변경된 저장 흐름**:
```typescript
// Before
const input: CustomFoodInput = buildInput();
await saveCustomFood(input, userId);  // custom-food-db

// After
const params: SaveUserFoodParams = buildInput();
await saveUserFood(params);  // diet-search
```

**변경된 로드 흐름**:
```typescript
// Before
const food = await getCustomFoodById(foodId);  // custom-food-db → FoodItem
populateForm(food);  // FoodItem 구조

// After
const food = await getFoodById(foodId);  // diet-search → FoodRow
populateForm(food);  // FoodRow 구조
```

**파일**: [src/screens/diet/custom-food-form-screen.tsx](../../src/screens/diet/custom-food-form-screen.tsx)
**변경**: import 교체 + 폼 필드 10개 제거 + buildInput/populateForm 재구현

---

### 2.3 Module 3: food-search.ts 브릿지 교체

**변경 핵심**:
- `searchCustomFoods` (custom-food-db) → `searchFoods` (diet-search) + `foodRowToFoodItem`

```typescript
// Before
import { searchCustomFoods } from './custom-food-db';

const results = await Promise.allSettled([
  withTimeout(searchCustomFoods(query, userId), '내 음식 검색'),
  ...
]);

// After
import { searchFoods as searchDbFoods, foodRowToFoodItem } from './diet-search';

const results = await Promise.allSettled([
  withTimeout(
    searchDbFoods(query).then(rows => rows.map(foodRowToFoodItem)),
    '내 음식 검색'
  ),
  ...
]);
```

**파일**: [src/lib/food-search.ts](../../src/lib/food-search.ts)
**변경**: import 1개 교체 + searchCustomFoods 호출부 교체 (~5줄)

---

### 2.4 Module 4: 정리 (삭제 + 타입 정리)

#### root-navigator.tsx

```typescript
// 제거할 줄
import { migrateLocalCustomFoodsToSupabase } from '../lib/custom-food-db';

// 제거할 useEffect
useEffect(() => {
  if (!user?.id) return;
  migrateLocalCustomFoodsToSupabase(user.id);  // ← 이 블록 전체 제거
}, [user?.id]);
```

**파일**: [src/navigation/root-navigator.tsx](../../src/navigation/root-navigator.tsx)
**변경**: import 1개 제거 + useEffect 블록 제거 (~5줄)

#### custom-food-db.ts 삭제

파일 삭제: `src/lib/custom-food-db.ts` (874줄)

#### types/food.ts 정리

**제거할 항목** (custom-food-db 전용):

| 항목 | 이유 |
|------|------|
| `BrandType` 타입 | custom-food-form에서만 사용 |
| `BRAND_TYPE_LABEL` | custom-food-form에서만 사용 |
| `FOOD_VISIBILITY_LABEL` | custom-food-form에서만 사용 |
| `NUTRITION_UNIT_LABEL` | custom-food-form 폼 레이블 (단순화 후 불필요) |
| `NutritionBasis` interface | FoodItem.nutrition_basis 타입 (단순화) |
| `ServingInfo` interface | FoodItem.serving 타입 (단순화) |
| `FoodEditHistoryEntry` interface | custom-food-db 편집 이력 |
| `CustomFoodRecord` interface | custom-food-db 레코드 타입 |
| `CustomFoodInput` interface | custom-food-form 입력 타입 |

**유지할 항목**:

| 항목 | 이유 |
|------|------|
| `MealType`, `MEAL_TYPE_LABEL` | diet-store, 전체 사용 |
| `NutritionUnit` | MealEntry.amount_unit |
| `FoodSource` | FoodItem.source |
| `FoodVisibility` | FoodItem.visibility (선택적) |
| `FoodNutrients` | diet-store calcNutrients |
| `FoodItem` | MealEntry.food — diet-store 연결 |
| `MealEntry` | diet-store 핵심 타입 |
| `OFFProduct`, `OFFSearchResponse` | openfoodfacts.ts |

**주의**: `FoodItem`에서 `nutrition_basis: NutritionBasis`와 `serving?: ServingInfo` 필드도 제거.
`FoodItem.nutrition_basis`는 `food-search.ts`에서 변환 시 항상 `{amount:100, unit:'g', label:'100g'}`로 고정됨.

---

## 3. 파일별 변경 요약

| 파일 | 변경 유형 | 변경 규모 |
|------|-----------|-----------|
| `src/lib/diet-search.ts` | 함수 4개 추가 | +60줄 |
| `src/screens/diet/custom-food-form-screen.tsx` | 대폭 단순화 | -100줄 이상 |
| `src/lib/food-search.ts` | import + 호출부 교체 | ~5줄 |
| `src/navigation/root-navigator.tsx` | import + useEffect 제거 | -10줄 |
| `src/lib/custom-food-db.ts` | **삭제** | -874줄 |
| `src/types/food.ts` | 타입 9개 제거 | -60줄 |

**순 변경**: -874줄 (custom-food-db.ts 삭제) - ~120줄 = **약 -1000줄**

---

## 4. 성공 기준 (Plan SC 재확인)

| SC | 기준 | 검증 |
|----|------|------|
| SC-1 | `custom-food-db.ts` 삭제 | `ls src/lib/custom-food-db.ts` 파일 없음 |
| SC-2 | `FoodItem`/`CustomFoodRecord` import 없음 (custom-food-db) | `grep CustomFoodRecord src/` 결과 없음 |
| SC-3 | 커스텀 음식 생성·수정·검색 동작 | Expo Go 직접 테스트 |
| SC-4 | 식사 기록 저장 정상 | Expo Go 직접 테스트 |
| SC-5 | AsyncStorage `custom-food-db:*` 키 코드 없음 | `grep 'custom-food-db:' src/` 결과 없음 |

---

## 5. 구현 순서 (의존성 고려)

```
Module 1 (diet-search.ts 확장)
    ↓ 독립적, 먼저 완료해야 Module 2,3 가능
Module 2 (custom-food-form-screen.tsx)  ─┐
Module 3 (food-search.ts 브릿지)        ─┤ 병렬 가능
    ↓
Module 4 (custom-food-db.ts 삭제 + 정리)  ← 마지막
    (삭제 전 Module 2,3 완료 확인 필수)
```

---

## 11. Implementation Guide

### 11.1 의존성 설치

없음 (신규 패키지 불필요)

### 11.2 구현 체크리스트

```
Module 1: diet-search.ts 확장
  [ ] updateUserFood(id, params) 함수 추가
  [ ] getFoodById(id) 함수 추가
  [ ] getUserFoods(userId) 함수 추가
  [ ] foodRowToFoodItem(row) 헬퍼 추가
  [ ] FoodItem import 추가 (types/food에서)

Module 2: custom-food-form-screen.tsx 단순화
  [ ] import custom-food-db → diet-search 교체
  [ ] brandType, visibility, tags state 제거
  [ ] basisUnit, basisAmount, servingAmount, servingUnit state 제거
  [ ] fiber, saturatedFat, transFat, cholesterol state 제거
  [ ] populateForm → FoodRow 기반으로 재구현
  [ ] buildInput → SaveUserFoodParams 반환으로 재구현
  [ ] 저장 로직: saveCustomFood → saveUserFood, updateCustomFood → updateUserFood
  [ ] 로드 로직: getCustomFoodById → getFoodById
  [ ] types/food에서 불필요 import 제거

Module 3: food-search.ts 업데이트
  [ ] import searchCustomFoods 제거
  [ ] import searchFoods, foodRowToFoodItem from diet-search 추가
  [ ] Promise.allSettled 내 searchCustomFoods 호출 교체

Module 4: 정리
  [ ] root-navigator.tsx: migrateLocalCustomFoodsToSupabase import + useEffect 제거
  [ ] custom-food-db.ts 파일 삭제
  [ ] types/food.ts: 불필요 타입 9개 + FoodItem.nutrition_basis/serving 필드 제거
  [ ] TypeScript 오류 확인 및 수정
```

### 11.3 Session Guide

**Module Map:**

| Module | 파일 수 | 예상 줄 | 의존성 |
|--------|---------|---------|--------|
| module-1 | 1개 수정 | +60줄 | 없음 |
| module-2 | 1개 수정 | -100줄+ | module-1 필요 |
| module-3 | 1개 수정 | ~5줄 | module-1 필요 |
| module-4 | 1개 삭제 + 2개 수정 | -940줄 | module-2,3 필요 |

**권장 세션 분할:**

```
Session 1: Module 1 + Module 2 + Module 3
  (diet-search 확장, form 단순화, food-search 브릿지)
Session 2: Module 4
  (custom-food-db 삭제, types 정리, TS 오류 수정)
```

또는 `/pdca do food-schema-unification` (전체 단일 세션 가능)
