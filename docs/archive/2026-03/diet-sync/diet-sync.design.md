# Design: diet-sync

> Feature: 식단 Supabase 동기화
> Created: 2026-03-25
> Architecture: Option C — Pragmatic Balance
> Status: Design

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 식단 데이터가 로컬에만 저장돼 앱 재설치 시 유실 → 사용자 신뢰 저하 |
| **WHO** | 앱을 꾸준히 사용하는 유저 (기기 변경, 재설치 경험자) |
| **RISK** | Supabase 쓰기 실패 시 로컬↔클라우드 불일치 (fire-and-forget 한계) |
| **SUCCESS** | 앱 재시작 후 오늘 식단 자동 복원 100% + write 실패율 < 1% (wifi 환경) |
| **SCOPE** | 오늘 날짜만. 과거 데이터 마이그레이션 없음. 오프라인 큐 없음. |

---

## 1. 아키텍처 개요

### 1.1 선택: Option C — Pragmatic Balance

```
[diet-screen / food-search-screen]
    │ addEntry(food, amount, ...)
    ▼
[diet-store.ts] ──── 로컬 AsyncStorage 즉시 갱신
    │ fire-and-forget ↘
    ▼                  [diet-supabase.ts]
  (반환 즉시)           syncAddEntry()
                        syncRemoveEntry()
                        syncUpdateEntry()
                        loadTodayEntries()
                            │
                            ▼
                        Supabase (meal_logs + meal_items)

[root-navigator.tsx]
  user 로그인 useEffect
    │ await loadTodayEntries(userId, today)
    ▼
  diet-store.hydrateFromSupabase(today, entries)
    │
    ▼
  entriesByDate[today] 갱신 → 화면 자동 리렌더
```

### 1.2 파일 변경 목록

| 파일 | 유형 | 변경 내용 |
|------|------|---------|
| `src/lib/diet-supabase.ts` | **신규** | Supabase sync 함수 5개 + meal_type 매핑 |
| `src/stores/diet-store.ts` | **수정** | `addEntry/removeEntry/updateAmount` fire-and-forget 추가, `hydrateFromSupabase` 신규 |
| `src/navigation/root-navigator.tsx` | **수정** | `loadTodayEntries` useEffect 추가 |

---

## 2. SQL 마이그레이션 (Supabase SQL Editor)

> 구현 전 반드시 실행해야 함

```sql
-- 1. meal_items 컬럼 추가
ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS food_json JSONB,
  ADD COLUMN IF NOT EXISTS entry_local_id TEXT;

-- 2. entry_local_id 중복 방지 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_items_local_id
  ON meal_items(entry_local_id)
  WHERE entry_local_id IS NOT NULL;

-- 3. 오늘 조회 최적화 인덱스 (IMMUTABLE 오류 수정본 — ::date 캐스트 제거)
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON meal_logs(user_id, logged_at);
```

---

## 3. `src/lib/diet-supabase.ts` 상세 설계

### 3.1 meal_type 매핑

```typescript
const MEAL_TYPE_KO: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

const MEAL_TYPE_EN: Record<string, MealType> = {
  '아침': 'breakfast',
  '점심': 'lunch',
  '저녁': 'dinner',
  '간식': 'snack',
};
```

### 3.2 `getMealLogId(userId, mealType, date)`

```typescript
async function getMealLogId(
  userId: string,
  mealType: MealType,
  date: string,  // 'YYYY-MM-DD'
): Promise<string>
```

- `meal_logs` SELECT: `user_id = userId AND meal_type = MEAL_TYPE_KO[mealType] AND logged_at >= dateStart AND logged_at < dateEnd`
- 없으면 INSERT → 생성된 id 반환
- dateStart/dateEnd: 해당 날짜 00:00:00 ~ 23:59:59.999 (로컬 타임 기반)

**날짜 범위 계산:**
```typescript
const dateStart = new Date(`${date}T00:00:00`).toISOString();
const dateEnd   = new Date(`${date}T23:59:59.999`).toISOString();
```

### 3.3 `syncAddEntry(userId, entry, date)`

```typescript
export async function syncAddEntry(
  userId: string,
  entry: MealEntry,
  date: string,
): Promise<void>
```

**흐름:**
1. `getMealLogId(userId, entry.meal_type, date)` → `mealLogId`
2. `meal_items` UPSERT (conflict: `entry_local_id`):
   ```typescript
   {
     meal_log_id: mealLogId,
     food_id: null,
     food_json: entry.food,          // FoodItem 전체
     food_name: entry.food.name,
     food_source: entry.food.source,
     entry_local_id: entry.id,       // 로컬 MealEntry.id
     amount: entry.amount,
     amount_unit: entry.amount_unit,
     calories: entry.calories,
     protein_g: entry.protein_g,
     carbs_g: entry.carbs_g,
     fat_g: entry.fat_g,
   }
   ```

### 3.4 `syncRemoveEntry(localId)`

```typescript
export async function syncRemoveEntry(localId: string): Promise<void>
```

- `DELETE FROM meal_items WHERE entry_local_id = localId`

### 3.5 `syncUpdateEntry(localId, amount, nutrients)`

```typescript
export async function syncUpdateEntry(
  localId: string,
  amount: number,
  nutrients: { calories: number; protein_g: number; carbs_g: number; fat_g: number },
): Promise<void>
```

- `UPDATE meal_items SET amount = amount, calories = ..., ... WHERE entry_local_id = localId`

### 3.6 `loadTodayEntries(userId, date)`

```typescript
export async function loadTodayEntries(
  userId: string,
  date: string,
): Promise<MealEntry[]>
```

**Supabase 쿼리:**
```typescript
const dateStart = new Date(`${date}T00:00:00`).toISOString();
const dateEnd   = new Date(`${date}T23:59:59.999`).toISOString();

const { data } = await supabase
  .from('meal_logs')
  .select(`
    id, meal_type, logged_at,
    meal_items (
      entry_local_id, food_json, amount, amount_unit,
      calories, protein_g, carbs_g, fat_g
    )
  `)
  .eq('user_id', userId)
  .gte('logged_at', dateStart)
  .lte('logged_at', dateEnd);
```

**MealEntry 복원:**
```typescript
// data 로우 → MealEntry[]
return data.flatMap(log => {
  const mealType = MEAL_TYPE_EN[log.meal_type];
  return (log.meal_items ?? [])
    .filter(mi => mi.food_json && mi.entry_local_id)
    .map(mi => ({
      id: mi.entry_local_id,
      food: mi.food_json as FoodItem,
      amount: mi.amount,
      amount_unit: mi.amount_unit as NutritionUnit,
      meal_type: mealType,
      logged_at: log.logged_at,
      calories: mi.calories,
      protein_g: mi.protein_g,
      carbs_g: mi.carbs_g,
      fat_g: mi.fat_g,
    }));
});
```

---

## 4. `src/stores/diet-store.ts` 수정 상세

### 4.1 인터페이스 추가

```typescript
interface DietStore {
  // ... 기존 ...
  hydrateFromSupabase: (date: string, entries: MealEntry[]) => void;
}
```

### 4.2 `addEntry()` 수정

```typescript
addEntry: (food, amount, amountUnit, mealType, date) => {
  const currentUserId = get().currentUserId;
  if (!currentUserId) return;

  const entry: MealEntry = { /* 기존과 동일 */ };

  set((state) => ({ /* 기존과 동일 */ }));

  // Fire-and-forget: 실패해도 로컬은 유지
  syncAddEntry(currentUserId, entry, date).catch(() => {});
},
```

### 4.3 `removeEntry()` 수정

```typescript
removeEntry: (date, entryId) => {
  // 기존 로컬 set 로직 그대로...
  set((state) => ({ /* 기존과 동일 */ }));

  syncRemoveEntry(entryId).catch(() => {});
},
```

### 4.4 `updateAmount()` 수정

```typescript
updateAmount: (date, entryId, amount) => {
  const state = get();
  const entry = state.entriesByDate[date]?.find(e => e.id === entryId);

  set((state) => ({ /* 기존과 동일 */ }));

  if (entry) {
    const nutrients = calcNutrients(entry.food, amount, entry.amount_unit);
    syncUpdateEntry(entryId, amount, nutrients).catch(() => {});
  }
},
```

### 4.5 `hydrateFromSupabase()` 신규

```typescript
hydrateFromSupabase: (date, entries) => {
  const currentUserId = get().currentUserId;
  if (!currentUserId || entries.length === 0) return;

  set((state) => ({
    allEntriesByUser: {
      ...state.allEntriesByUser,
      [currentUserId]: {
        ...(state.allEntriesByUser[currentUserId] ?? {}),
        [date]: entries,
      },
    },
    entriesByDate: {
      ...state.entriesByDate,
      [date]: entries,
    },
  }));
},
```

---

## 5. `src/navigation/root-navigator.tsx` 수정 상세

### 5.1 추가 import

```typescript
import { loadTodayEntries } from '../lib/diet-supabase';
```

### 5.2 추가 useEffect

```typescript
// 기존 setDietCurrentUser useEffect 이후에 추가
const hydrateFromSupabase = useDietStore((state) => state.hydrateFromSupabase);

useEffect(() => {
  if (!user?.id) return;
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  loadTodayEntries(user.id, today)
    .then((entries) => {
      hydrateFromSupabase(today, entries);
    })
    .catch(() => {
      // 네트워크 실패 시 로컬 AsyncStorage 그대로 유지
    });
}, [user?.id]);
```

---

## 6. 엣지 케이스 처리

| 케이스 | 처리 방법 |
|--------|---------|
| `loadTodayEntries` 결과 0개 | `hydrateFromSupabase` 호출 안 함 → 로컬 유지 |
| `syncAddEntry` 실패 | catch 무시. 다음 앱 시작 시 Supabase에 없는 항목은 로컬에서만 존재 |
| `getMealLogId` INSERT 실패 | 함수 전체 throw → `syncAddEntry` catch에서 흡수 |
| 앱 재시작 시 중복 | `entry_local_id` UNIQUE 인덱스로 DB 레벨 방지. hydrate는 덮어쓰기 방식 |
| meal_type 매핑 누락 (방어) | `MEAL_TYPE_EN[ko] ?? 'snack'` 폴백 |
| 게스트 유저 (userId=null) | `setCurrentUser(null)` → `syncAddEntry` 미호출 (currentUserId 없음) |

---

## 7. 타입 흐름

```
MealEntry.id (diet-store 로컬 id)
    │ = entry_local_id (meal_items 컬럼)
    │
    ├─ syncAddEntry: INSERT 시 entry_local_id 저장
    ├─ syncRemoveEntry: DELETE WHERE entry_local_id = ?
    ├─ syncUpdateEntry: UPDATE WHERE entry_local_id = ?
    └─ loadTodayEntries: SELECT mi.entry_local_id → MealEntry.id 복원
```

---

## 8. RLS 고려사항

`meal_logs`와 `meal_items` 테이블에 RLS가 적용돼 있다면:
- `meal_logs`: `user_id = auth.uid()` 조건으로 SELECT/INSERT
- `meal_items`: `meal_log_id` FK를 통해 간접 보호

RLS 미적용 시에도 기능 동작 (개발 단계 허용).

---

## 9. 성공 기준 (Design 레벨)

| 검증 항목 | 방법 |
|---------|------|
| `meal_items`에 `food_json`, `entry_local_id` 컬럼 존재 | Supabase Table Editor 확인 |
| `addEntry` 후 `meal_items` 행 생성 | Supabase Table Editor 확인 |
| 앱 재시작 → 오늘 식단 표시 | Expo Go 실제 테스트 |
| 오프라인 상태 addEntry → 로컬 표시 정상 | 비행기 모드 테스트 |

---

## 10. 구현 모듈 (Session Guide)

### Module Map

| 모듈 | 파일 | 예상 라인 |
|------|------|---------|
| module-1 | `src/lib/diet-supabase.ts` (신규) | ~100줄 |
| module-2 | `src/stores/diet-store.ts` (수정) + `src/navigation/root-navigator.tsx` (수정) | ~40줄 추가 |

### 권장 세션 플랜

| 세션 | 스코프 | 내용 |
|------|--------|------|
| 세션 1 | `--scope module-1` | `diet-supabase.ts` 전체 구현 |
| 세션 2 | `--scope module-2` | store + navigator 연결 |

### 선행 조건 (SQL)

세션 1 시작 전 Supabase SQL Editor에서 다음 실행 완료 필요:
```sql
ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS food_json JSONB,
  ADD COLUMN IF NOT EXISTS entry_local_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_items_local_id
  ON meal_items(entry_local_id)
  WHERE entry_local_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON meal_logs(user_id, logged_at);
```
