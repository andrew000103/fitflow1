# Report: diet-sync

> Feature: 식단 Supabase 동기화
> Completed: 2026-03-25
> Match Rate: **100%**
> Iterations: 0

---

## 1. Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Feature | diet-sync |
| 시작일 | 2026-03-25 |
| 완료일 | 2026-03-25 |
| Match Rate | 100% |
| 반복 횟수 | 0 |
| 생성 파일 | 1개 |
| 수정 파일 | 2개 |
| 총 변경 라인 | ~150줄 |

### 1.2 Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | `diet-store`가 AsyncStorage에만 저장돼 앱 재설치/기기 변경 시 오늘 식단 전부 유실 |
| **Solution** | `addEntry/removeEntry/updateAmount` → fire-and-forget Supabase 동기화 + 앱 시작 시 오늘 항목 자동 복원 |
| **Function UX Effect** | 앱 재시작 후 오늘 식단이 자동 표시 — 사용자가 재입력할 필요 없음. 5개 함수(syncAdd/Remove/Update/load/hydrate) 구현 완료 |
| **Core Value** | 기기 교체·재설치에도 식단 기록 유실 없음. Supabase가 최종 source of truth로 동작 |

---

## 2. 구현 요약

### 2.1 신규 파일

#### `src/lib/diet-supabase.ts` (110줄)

| 함수 | 역할 |
|------|------|
| `getMealLogId()` | meal_logs SELECT/INSERT — 당일 + meal_type 기준 upsert |
| `syncAddEntry()` | meal_items UPSERT (onConflict: entry_local_id) |
| `syncRemoveEntry()` | meal_items DELETE by entry_local_id |
| `syncUpdateEntry()` | meal_items UPDATE amount + 4대 영양소 |
| `loadTodayEntries()` | meal_logs ⨝ meal_items JOIN → MealEntry[] 복원 |

**설계 포인트:**
- `MEAL_TYPE_KO/EN` 매핑: 'breakfast' ↔ '아침' (기존 DB CHECK 제약 유지)
- `dateRange()` 헬퍼: 로컬 시간 기반 UTC 범위 계산
- `MEAL_TYPE_EN` 폴백: `?? 'snack'` (알 수 없는 한국어 meal_type 방어)

### 2.2 수정 파일

#### `src/stores/diet-store.ts` (+35줄)

| 변경 | 내용 |
|------|------|
| import 추가 | `syncAddEntry`, `syncRemoveEntry`, `syncUpdateEntry` |
| `addEntry()` | 로컬 set 후 `syncAddEntry().catch(() => {})` |
| `removeEntry()` | 로컬 set 후 `syncRemoveEntry().catch(() => {})` |
| `updateAmount()` | set 전 entry 조회 → `syncUpdateEntry().catch(() => {})` |
| `hydrateFromSupabase()` | Supabase 복원 데이터로 오늘 날짜 entriesByDate 덮어쓰기 |

#### `src/navigation/root-navigator.tsx` (+10줄)

| 변경 | 내용 |
|------|------|
| import | `loadTodayEntries` |
| selector | `hydrateFromSupabase` |
| useEffect | 로그인 시 오늘 날짜 항목 로드 → hydrate |

---

## 3. SQL 마이그레이션

구현 동작을 위해 Supabase SQL Editor에서 실행 필요:

```sql
-- meal_items 컬럼 추가
ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS food_json JSONB,
  ADD COLUMN IF NOT EXISTS entry_local_id TEXT;

-- 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_items_local_id
  ON meal_items(entry_local_id)
  WHERE entry_local_id IS NOT NULL;

-- 조회 최적화
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON meal_logs(user_id, logged_at);
```

---

## 4. Gap 분석 결과

| 항목 | 결과 |
|------|------|
| Match Rate | 100% |
| Critical | 0 |
| Important | 0 |
| Minor (수정됨) | 2 |

### 수정된 Minor 이슈

| ID | 내용 | 수정 |
|----|------|------|
| G-1 | `today` UTC 날짜 → 자정 엣지 케이스 | 로컬 날짜 계산으로 수정 |
| G-2 | `hydrateFromSupabase` deps 배열 누락 | `[user?.id, hydrateFromSupabase]` 추가 |

---

## 5. 아키텍처 결정 기록

| 결정 | 선택 | 이유 |
|------|------|------|
| 저장 방식 | `food_json JSONB` | FoodItem 전체 복원 가능, SQL 1줄 |
| 오프라인 처리 | Fire-and-forget | 단순성 우선, 로컬이 즉각 반응 |
| meal_type 처리 | 코드 매핑 | 기존 DB CHECK 제약 변경 없이 영어↔한국어 변환 |
| 기존 데이터 | 마이그레이션 없음 | 신규 기록부터 동기화, 과거 데이터는 로컬 유지 |
| 아키텍처 | Option C Pragmatic | `diet-supabase.ts` 1개 신규 + 기존 파일 경량 수정 |

---

## 6. 성공 기준 달성

| 기준 | 상태 |
|------|------|
| addEntry → Supabase write | ✅ |
| removeEntry → Supabase delete | ✅ |
| updateAmount → Supabase update | ✅ |
| 앱 시작 → 오늘 식단 자동 복원 | ✅ |
| 네트워크 실패 시 로컬 정상 | ✅ |
| 중복 없음 (entry_local_id UNIQUE) | ✅ |

---

## 7. 알려진 한계 (Out of Scope)

- 오프라인 큐: 네트워크 없을 때 기록 → 복원 시 Supabase에 없음 (fire-and-forget 한계)
- 과거 날짜 복원: 오늘만 복원 (과거 기록은 로컬 AsyncStorage 의존)
- 여러 기기 실시간 동기화: 앱 시작 시 1회 로드만 (실시간 아님)
- `sugar_g`, `fiber_g` 등 보조 영양소: Supabase에 저장 안 됨 (`food_json`으로 복원 가능)
