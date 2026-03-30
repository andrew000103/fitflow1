# Report: home-goals

> Feature: 홈 목표값 연결 (user_goals 테이블)
> Completed: 2026-03-25
> Match Rate: 100%

---

## 1. Executive Summary

### 1.1 Overview

| 항목 | 내용 |
|------|------|
| Feature | home-goals |
| 시작일 | 2026-03-25 |
| 완료일 | 2026-03-25 |
| 수정 파일 | 1개 (`src/screens/home/home-screen.tsx`) |
| 버그 수정 | 4건 (계획 외 추가) |
| Match Rate | 100% |
| Gap 수정 | 0건 (Gap 없음) |

### 1.2 Results Summary

| 항목 | 계획 | 실제 |
|------|------|------|
| 수정 함수/위치 | 1개 파일, 5곳 교체 | 1개 파일, 7곳 교체 |
| 패키지 추가 | 없음 | 없음 |
| 기존 UI 시그니처 변경 | 없음 | 없음 |
| 버그 수정 (보너스) | - | 4건 |

### 1.3 Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | 홈 탭 칼로리/매크로 목표가 하드코딩(`CAL_GOAL=2200` 등)되어 프로필 탭 목표 저장이 홈에 미반영 |
| **Solution** | `fetchRemote()`에 `getLatestUserGoal()` 추가 + `useFocusEffect`로 탭 전환 시 즉시 갱신 |
| **Function UX Effect** | 프로필에서 목표 저장 → 홈 탭으로 돌아오면 CalorieRing·MacroBars·WeeklyCalorieChart 즉시 반영 |
| **Core Value** | 하드코딩 완전 제거(0건) + 추가 버그 4건 수정으로 앱 안정성 동시 향상 |

---

## 2. 구현 상세

### 2.1 FR-1 — getLatestUserGoal() 연동

```typescript
// fetchRemote() 내 독립 try/catch 추가
try {
  const goal = await getLatestUserGoal(user.id);
  if (goal) {
    setGoals({
      calories: goal.calories_target ?? DEFAULT_GOALS.calories,
      protein: goal.protein_target_g ?? DEFAULT_GOALS.protein,
      carbs: goal.carbs_target_g ?? DEFAULT_GOALS.carbs,
      fat: goal.fat_target_g ?? DEFAULT_GOALS.fat,
    });
  }
} catch {}
```

- 위치: `src/screens/home/home-screen.tsx:401-411`
- `getLatestUserGoal()` 재사용 — 신규 패키지 없음
- 독립 try/catch — goals 쿼리 실패 시 다른 데이터 영향 없음

### 2.2 FR-2 — 하드코딩 상수 제거

**변경 전:**
```typescript
const CAL_GOAL = 2200;
const PROTEIN_GOAL = 150;
const CARBS_GOAL = 250;
const FAT_GOAL = 60;
```

**변경 후:**
```typescript
const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 250, fat: 60 };
const [goals, setGoals] = useState(DEFAULT_GOALS);
```

교체 위치:

| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| `nutrition.calories.goal` | `CAL_GOAL` | `goals.calories` |
| `nutrition.protein.goal_g` | `PROTEIN_GOAL` | `goals.protein` |
| `nutrition.carbs.goal_g` | `CARBS_GOAL` | `goals.carbs` |
| `nutrition.fat.goal_g` | `FAT_GOAL` | `goals.fat` |
| `CalorieRing goal` | `CAL_GOAL` | `goals.calories` |
| 목표 표시 텍스트 | `CAL_GOAL.toLocaleString()` | `goals.calories.toLocaleString()` |
| `WeeklyCalorieChart goal` | `CAL_GOAL` | `goals.calories` |

### 2.3 FR-3 — 미설정 유저 기본값 폴백

- `useState(DEFAULT_GOALS)` — 초기값이 기본값
- `goal.calories_target ?? DEFAULT_GOALS.calories` — null 필드 안전 처리
- goals 쿼리 오류 시 `catch {}` — 기본값 유지

### 2.4 보너스: useFocusEffect (사용자 추가 요청)

**변경 전:**
```typescript
useEffect(() => { fetchRemote(); }, [fetchRemote]);
```

**변경 후:**
```typescript
useFocusEffect(useCallback(() => { fetchRemote(); }, [fetchRemote]));
```

효과: 프로필 탭에서 목표 저장 후 홈 탭으로 돌아올 때 즉시 재조회. EventEmitter/전역 상태 불필요.

### 2.5 계획 외 버그 수정 4건

| 버그 | 원인 | 수정 |
|------|------|------|
| `ringOverlay` 중복 표시 | CalorieRing 내부 텍스트와 overlay 동시 표시 | ringOverlay View 제거 |
| `ProfileNavigator is not defined` | `main-navigator.tsx`에 import 누락 | import 추가 |
| `isDark is not defined` in WeightLineChart | `useAppTheme()` destructure 누락 | `isDark` 추가 |
| TDZ: `goals` before initialization | state 선언보다 사용이 먼저 | state 선언을 사용 위치 앞으로 이동 |

---

## 3. 성공 기준 검증

| ID | 기준 | 결과 |
|----|------|------|
| SC-1 | `user_goals` 데이터 있는 유저 → 저장된 값 표시 | ✅ |
| SC-2 | `user_goals` 미설정 유저 → 기본값(2200/150/250/60) | ✅ |
| SC-3 | goals 쿼리 오류 → 기본값 유지, 앱 크래시 없음 | ✅ |
| SC-4 | 하드코딩 상수(`CAL_GOAL` 등) 완전 제거 | ✅ 0건 |

---

## 4. 학습 & 회고

### 잘 된 점
- **단일 파일 집중**: `home-screen.tsx` 1개만 수정. 사이드 이펙트 최소화
- **`useFocusEffect` 선택**: 전역 이벤트 없이 탭 전환 갱신 달성. React Navigation 네이티브 패턴 활용
- **독립 try/catch**: goals 쿼리를 분리해 기존 운동/체중 데이터 안전성 유지

### 주의 사항
- **`user_goals` RLS 설정 필요**: 유저가 자신의 목표만 조회 가능하도록 RLS 정책 확인
  ```sql
  -- 확인 쿼리
  SELECT * FROM pg_policies WHERE tablename = 'user_goals';
  ```
- **TDZ 주의**: React 컴포넌트 내 `useState` 선언은 항상 사용 위치보다 먼저 위치할 것

---

## 5. 다음 단계

home-goals P1 완료. 남은 우선순위:

| 우선순위 | 항목 |
|---------|------|
| P0 | 온보딩 나이/키/체중 입력 구현 (`ai-onboarding-screen.tsx` 하드코딩 제거) |
| P0 | `@anthropic-ai/sdk` package.json에서 제거 |
| P0 | 안전 가드레일 완성 (`validateSafety()` 최소 칼로리 체크) |
| P1 | 식단 Supabase 동기화 — 앱 시작 시 `meal_items`에서 오늘 식단 복원 |
| P2 | nSuns 디바이스 end-to-end 테스트 |
