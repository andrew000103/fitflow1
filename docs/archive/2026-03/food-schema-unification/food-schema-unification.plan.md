# Plan: food-schema-unification

| 항목 | 내용 |
|------|------|
| Feature | food-schema-unification |
| Created | 2026-03-25 |
| Author | Claude Code |
| Status | Plan |

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | `diet-search.ts`(FoodRow 평면) + `custom-food-db.ts`(FoodItem 정규화)의 이중 스키마로 음식 관련 코드가 불안정하고 일관성이 없음 |
| **Solution** | FoodRow 기준 단일 스키마로 통일, AsyncStorage 로컬 캐시 제거, Supabase `foods` 테이블 단일 소스 |
| **Function UX Effect** | 음식 검색·추가·편집 흐름이 단일 타입으로 일관되어 버그 발생 감소, 코드 유지보수성 향상 |
| **Core Value** | 개발 복잡도 제거 — 두 시스템 간 변환 코드 불필요, 신규 음식 기능 추가 시 단일 파일만 수정 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 두 스키마 공존으로 타입 변환 코드 필요, AsyncStorage ↔ Supabase 마이그레이션 로직 복잡도 |
| **WHO** | 개발자 (사용자 UX 변화 없음, 내부 리팩토링) |
| **RISK** | `custom-food-form-screen`이 FoodItem 타입 의존 → FoodRow 전환 시 UI 수정 필요 |
| **SUCCESS** | `diet-search.ts` + `custom-food-db.ts` → 단일 파일로 통합, FoodItem/CustomFoodRecord 타입 제거 |
| **SCOPE** | `src/lib/`, `src/types/food.ts`, `src/screens/diet/custom-food-form-screen.tsx` |

---

## 1. 문제 정의

### 1.1 현재 상태

```
diet-search.ts
  └─ FoodRow (평면)         → food-search-screen.tsx

custom-food-db.ts
  └─ FoodItem / CustomFoodRecord (정규화)
     ├─ AsyncStorage 캐시
     ├─ Supabase 동기화
     └─ food-search-screen.tsx, custom-food-form-screen.tsx
```

### 1.2 문제점

1. **타입 이중화**: `FoodRow` (diet-search) vs `FoodItem` (custom-food-db) — 같은 음식 데이터를 두 인터페이스로 표현
2. **변환 코드 필요**: `food-search-screen.tsx`에서 `FoodRow` → `FoodItem` 변환 로직 존재
3. **AsyncStorage 불필요**: Supabase 연동 이후 AsyncStorage는 구버전 로컬 폴백 — 현재 불필요
4. **874줄 복잡도**: `custom-food-db.ts`는 AsyncStorage 관리, 마이그레이션, 오류 처리로 과도하게 비대

### 1.3 영향 범위

| 파일 | 의존 타입 | 변경 필요 |
|------|-----------|-----------|
| `src/lib/diet-search.ts` | FoodRow | 검색/저장 함수 유지, 커스텀 음식 CRUD 흡수 |
| `src/lib/custom-food-db.ts` | FoodItem, CustomFoodRecord | 대부분 제거, 필요 함수만 diet-search로 이전 |
| `src/screens/diet/food-search-screen.tsx` | FoodRow, FoodItem | FoodRow 단일 타입으로 단순화 |
| `src/screens/diet/custom-food-form-screen.tsx` | CustomFoodInput, FoodItem | FoodRow 기반 입력으로 변경 |
| `src/lib/food-search.ts` | FoodItem (custom-food-db 연결) | FoodRow 기반으로 변경 |
| `src/types/food.ts` | FoodItem, CustomFoodRecord 등 | MealEntry, FoodNutrients 등 필요 타입만 유지 |
| `src/navigation/root-navigator.tsx` | migrateLocalCustomFoodsToSupabase | 마이그레이션 함수 제거 |

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 커스텀 음식 생성(`saveCustomFood`) → `diet-search.ts`의 `saveUserFood`로 통일 | 필수 |
| FR-02 | 커스텀 음식 수정(`updateCustomFood`) → `diet-search.ts`에 `updateUserFood` 추가 | 필수 |
| FR-03 | 커스텀 음식 조회(`getCustomFoodById`) → `diet-search.ts`에 `getFoodById` 추가 | 필수 |
| FR-04 | `custom-food-form-screen.tsx`가 FoodRow 기반 입력 사용 | 필수 |
| FR-05 | AsyncStorage 로컬 캐시 코드 제거 | 필수 |
| FR-06 | `migrateLocalCustomFoodsToSupabase` 제거 (root-navigator 포함) | 필수 |
| FR-07 | `types/food.ts`에서 FoodItem, CustomFoodRecord, FoodVisibility, NutritionBasis, ServingInfo, FoodEditHistoryEntry, CustomFoodInput 타입 제거 | 필수 |
| FR-08 | 기존 기능 동등성 유지 (검색, 추가, 수정, 식사 기록 저장) | 필수 |

### 2.2 비기능 요구사항

- `custom-food-db.ts` 874줄 → 삭제 (또는 50줄 이하 shell로 축소)
- 타입 변환 코드 0개 (FoodRow ↔ FoodItem 변환 불필요)
- AsyncStorage 의존성 제거 (음식 관련)

---

## 3. 설계 방향

### 3.1 단일 파일 전략

```
Before:
  diet-search.ts (363줄) — 검색 + 저장
  custom-food-db.ts (874줄) — 커스텀 CRUD + AsyncStorage

After:
  diet-search.ts (~450줄) — 검색 + 저장 + 커스텀 CRUD (FoodRow 기반)
  custom-food-db.ts — 삭제 (또는 re-export shim으로 축소)
```

### 3.2 타입 전략

```typescript
// 유지 (diet-search.ts)
export interface FoodRow { ... }  // Supabase foods 테이블 매핑
export interface SaveUserFoodParams { ... }
export interface SaveMealItemParams { ... }

// 제거 (types/food.ts)
FoodItem, CustomFoodRecord, CustomFoodInput
FoodVisibility, NutritionBasis, ServingInfo
FoodEditHistoryEntry

// 유지 (types/food.ts)
MealEntry  // diet-store에서 사용
OFFProduct, OFFSearchResponse  // OpenFoodFacts API 타입
FoodNutrients  // 내부 유틸
```

### 3.3 추가할 함수 (diet-search.ts)

```typescript
export async function updateUserFood(id: string, params: Partial<SaveUserFoodParams>): Promise<FoodRow>
export async function getFoodById(id: string): Promise<FoodRow | null>
export async function getUserFoods(userId: string): Promise<FoodRow[]>
```

---

## 4. 성공 기준

| SC | 기준 | 검증 방법 |
|----|------|-----------|
| SC-1 | `custom-food-db.ts` 삭제 또는 50줄 이하 | 파일 크기 확인 |
| SC-2 | FoodItem/CustomFoodRecord 타입 미사용 | grep으로 import 없음 확인 |
| SC-3 | 커스텀 음식 생성·수정·검색 정상 동작 | Expo Go 직접 테스트 |
| SC-4 | 식사 기록 저장 정상 동작 | Expo Go 직접 테스트 |
| SC-5 | AsyncStorage `custom-food-db:*` 키 코드 없음 | grep 확인 |

---

## 5. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| custom-food-form-screen 타입 의존성 | 중 | FoodRow 기반 입력 파라미터로 교체 |
| migrateLocalCustomFoodsToSupabase 의존 사용자 | 낮 | 마이그레이션 1회성 완료 간주 후 제거 |
| food-search.ts 브릿지 함수 타입 불일치 | 중 | food-search.ts도 FoodRow 기반으로 수정 |

---

## 6. 구현 순서

1. `diet-search.ts`에 `updateUserFood`, `getFoodById`, `getUserFoods` 추가
2. `custom-food-form-screen.tsx` → FoodRow 기반으로 교체 (custom-food-db import 제거)
3. `food-search.ts` → `searchCustomFoods` 대신 `searchFoods`(diet-search) 사용
4. `root-navigator.tsx`에서 `migrateLocalCustomFoodsToSupabase` 제거
5. `custom-food-db.ts` 삭제 (또는 deprecated shim)
6. `types/food.ts`에서 사용 안 되는 타입 제거
7. TypeScript 빌드 오류 수정
