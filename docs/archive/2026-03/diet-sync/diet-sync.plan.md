# Plan: diet-sync

> Feature: 식단 Supabase 동기화
> Created: 2026-03-25
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | `diet-store`는 AsyncStorage에만 저장돼 앱 재설치/다른 기기에서 식단 데이터가 전부 사라짐 |
| **Solution** | `addEntry/removeEntry/updateAmount` 호출 시 Supabase `meal_items`에 fire-and-forget write, 앱 시작 시 오늘 날짜 항목 복원 |
| **Function UX Effect** | 앱 재시작 후 오늘 식단이 자동 표시됨 — 사용자가 재입력할 필요 없음 |
| **Core Value** | 기기 교체·앱 재설치에도 식단 기록이 유실되지 않는 신뢰성 확보 |

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

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | `addEntry()` 호출 시 Supabase `meal_logs` + `meal_items`에 upsert | Must |
| FR-2 | 앱 시작(로그인) 시 오늘 날짜 `meal_items` 로드 → `diet-store` 복원 | Must |
| FR-3 | `removeEntry()` 호출 시 Supabase `meal_items`에서 삭제 | Must |
| FR-4 | `updateAmount()` 호출 시 Supabase `meal_items` 업데이트 | Must |
| FR-5 | 네트워크 실패 시 로컬 동작 정상 유지 (graceful degradation) | Must |

### 1.2 비기능 요구사항

- 오프라인 시 로컬 AsyncStorage 우선, Supabase는 백그라운드 fire-and-forget
- 기존 AsyncStorage 데이터 마이그레이션 없음 (새 기록부터 Supabase 저장)
- meal_type 매핑: 코드에서 영어↔한국어 변환 (`breakfast` ↔ `'아침'`)

---

## 2. 범위 (In Scope / Out of Scope)

### In Scope
- `addEntry`, `removeEntry`, `updateAmount` → Supabase 동기 write
- 앱 시작 시 오늘 날짜만 복원
- SQL 마이그레이션: `meal_items.food_json JSONB`, `meal_items.entry_local_id TEXT` 추가
- `meal_logs` 인덱스 추가 (`idx_meal_logs_user_date`)

### Out of Scope
- 과거 날짜 식단 복원 (오늘만)
- 오프라인 큐 / 재시도 로직
- 기존 AsyncStorage 데이터 Supabase 마이그레이션
- meal_logs.meal_type CHECK 제약 변경 (코드 매핑으로 해결)
- 여러 기기 실시간 동기화 (앱 시작 시 1회 로드)

---

## 3. 기술 설계 방향

### 3.1 스키마 변경 (SQL Editor 실행)

```sql
-- 1. food_json + entry_local_id 추가
ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS food_json JSONB,
  ADD COLUMN IF NOT EXISTS entry_local_id TEXT;

-- 2. 중복 방지 (선택적)
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_items_local_id
  ON meal_items(entry_local_id)
  WHERE entry_local_id IS NOT NULL;

-- 3. 오늘 조회 최적화 인덱스 (이전 세션에서 IMMUTABLE 오류 수정본)
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON meal_logs(user_id, logged_at);
```

### 3.2 meal_type 매핑

```typescript
const MEAL_TYPE_KO: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};
const MEAL_TYPE_EN: Record<string, MealType> = {
  '아침': 'breakfast', '점심': 'lunch', '저녁': 'dinner', '간식': 'snack',
};
```

### 3.3 아키텍처

```
diet-supabase.ts (신규)
  ├── getMealLogId(userId, mealType, date) → meal_log upsert
  ├── syncAddEntry(userId, entry, date)    → meal_log + meal_item insert
  ├── syncRemoveEntry(userId, localId)     → meal_item delete by entry_local_id
  ├── syncUpdateEntry(userId, localId, amount, nutrients) → update
  └── loadTodayEntries(userId, date)       → MealEntry[] 복원

diet-store.ts (수정)
  ├── addEntry()     → 로컬 set → fire-and-forget syncAddEntry
  ├── removeEntry()  → 로컬 set → fire-and-forget syncRemoveEntry
  └── updateAmount() → 로컬 set → fire-and-forget syncUpdateEntry

root-navigator.tsx (수정)
  └── user 로그인 useEffect → loadTodayEntries → diet-store hydrate
```

---

## 4. 성공 기준

| 항목 | 기준 |
|------|------|
| 오늘 식단 복원 | 앱 재시작 후 오늘 기록된 식단 자동 표시 |
| Write 동작 | addEntry → Supabase meal_items 행 생성 확인 |
| Delete 동작 | removeEntry → Supabase 행 삭제 확인 |
| 오프라인 | 네트워크 없을 때 addEntry 로컬 동작 정상 |
| 중복 없음 | 앱 재시작 2회 해도 오늘 항목 중복 없음 |

---

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| Supabase write 실패 → 로컬↔클라우드 불일치 | Fire-and-forget 허용, 앱 재시작 시 Supabase가 source of truth |
| `meal_logs` 당일 동일 meal_type 중복 생성 | `getMealLogId()`에서 기존 row SELECT 후 없을 때만 INSERT |
| `loadTodayEntries`가 빠르게 실패해도 앱 동작 | try/catch → 실패 시 로컬 AsyncStorage 그대로 유지 |
| 복원 시 `MealEntry.id` 충돌 (로컬 vs Supabase) | `entry_local_id`를 기준으로 dedup |

---

## 6. 구현 모듈 (Session Guide)

| 모듈 | 파일 | 내용 |
|------|------|------|
| module-1 | `src/lib/diet-supabase.ts` (신규) | Supabase sync 함수 4개 + meal_type 매핑 |
| module-2 | `src/stores/diet-store.ts` (수정) + `src/navigation/root-navigator.tsx` (수정) | fire-and-forget 연결 + 앱 시작 시 복원 |
