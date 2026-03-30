# Plan: home-goals

> Feature: 홈 목표값 연결 (user_goals 테이블)
> Created: 2026-03-25
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 홈 탭의 칼로리/매크로 목표가 하드코딩(`CAL_GOAL=2200`, `PROTEIN_GOAL=150`, `CARBS_GOAL=250`, `FAT_GOAL=60`)되어 있어 프로필 탭에서 목표를 저장해도 홈에 반영되지 않음 |
| **Solution** | `home-screen.tsx`의 `fetchRemote()`에 `getLatestUserGoal()` 쿼리를 추가해 Supabase `user_goals` 테이블의 실제 값을 사용하도록 교체. 미설정 시 기존 기본값으로 폴백 |
| **Function UX Effect** | 프로필 탭에서 목표 칼로리/매크로를 저장하면 홈 탭의 칼로리 링, 매크로 바, 주간 차트 목표선이 즉시 반영됨 |
| **Core Value** | 사용자가 설정한 목표 기반 피드백 — 하드코딩 제거로 개인화 UX 완성 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 프로필 탭 목표 저장 기능이 완성됐으나 홈 탭에 연결이 안 돼 있음. P1 항목 |
| **WHO** | 프로필 탭에서 목표 칼로리/매크로를 설정한 모든 로그인 유저 |
| **RISK** | `user_goals` 미설정 유저는 기본값(2200kcal 등)으로 폴백 — 기존 동작 유지 |
| **SUCCESS** | 프로필에서 목표 저장 → 앱 재진입 시 홈 탭 목표값 갱신 확인 |
| **SCOPE** | `src/screens/home/home-screen.tsx` 1개 파일만 수정. UI 구조 변경 없음 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | `fetchRemote()`에서 `getLatestUserGoal(userId)` 호출 → goals state 설정 | Must |
| FR-2 | 하드코딩 상수 제거 → goals state의 값 사용 (CalorieRing, MacroBars, WeeklyCalorieChart goal line) | Must |
| FR-3 | `user_goals` 미설정 유저 → 기본값 폴백 (`calories: 2200, protein: 150, carbs: 250, fat: 60`) | Must |

### 1.2 비기능 요구사항

- 신규 패키지 없음 — `getLatestUserGoal()` 함수 재사용 (이미 `profile.ts`에 구현됨)
- goals 쿼리 실패 시 기본값 유지 (독립 try/catch로 분리)
- 기존 UI 컴포넌트 시그니처 변경 없음 (goal prop에 숫자만 전달)

---

## 2. 범위

### In Scope
- `src/screens/home/home-screen.tsx`:
  - `CAL_GOAL`, `PROTEIN_GOAL`, `CARBS_GOAL`, `FAT_GOAL` 상수 제거
  - `goals` state 추가 (`useState` with default values)
  - `fetchRemote()`에 goals 쿼리 블록 추가
  - `nutrition` 객체 및 `WeeklyCalorieChart goal` prop — state 값으로 교체

### Out of Scope
- 프로필 탭 goals 저장 로직 변경 없음 (이미 구현)
- Zustand goals store 추가 없음 (homescreen 로컬 state로 충분)
- AsyncStorage 캐싱 없음 (앱 재진입 시 fetchRemote 재실행으로 충분)
- goals 실시간 구독 없음 (포커스 시 re-fetch로 충분)

---

## 3. 기술 설계 방향

### 3.1 State 추가

```typescript
const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 250, fat: 60 };
const [goals, setGoals] = useState(DEFAULT_GOALS);
```

### 3.2 fetchRemote() goals 쿼리 추가

```typescript
// 독립 try/catch — goals 실패 시 기본값 유지
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
} catch {
  // 기본값 유지
}
```

### 3.3 사용 위치 교체

| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| `nutrition.calories.goal` | `CAL_GOAL` | `goals.calories` |
| `nutrition.protein.goal_g` | `PROTEIN_GOAL` | `goals.protein` |
| `nutrition.carbs.goal_g` | `CARBS_GOAL` | `goals.carbs` |
| `nutrition.fat.goal_g` | `FAT_GOAL` | `goals.fat` |
| `WeeklyCalorieChart goal` prop | `CAL_GOAL` | `goals.calories` |

---

## 4. 성공 기준

| 항목 | 기준 |
|------|------|
| SC-1 | `user_goals`에 데이터 있는 유저 → 홈 탭 목표값이 저장된 값으로 표시 |
| SC-2 | `user_goals` 미설정 유저 → 기본값(2200/150/250/60)으로 정상 표시 |
| SC-3 | goals 쿼리 오류 → 기본값 유지, 앱 크래시 없음 |
| SC-4 | 하드코딩 상수(`CAL_GOAL` 등) 완전 제거 |

---

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| `user_goals` RLS 미설정 시 쿼리 실패 | 독립 try/catch → 기본값 폴백 |
| 프로필 저장 후 홈 진입까지 딜레이 | `useFocusEffect` 또는 `useEffect` + `user` dep으로 충분 |
| 익명 유저 (`user.id` 없음) | `fetchRemote()` 이미 `if (!user?.id) return` 가드 존재 |

---

## 6. 구현 모듈 (Session Guide)

| 모듈 | 파일 | 내용 |
|------|------|------|
| module-1 | `src/screens/home/home-screen.tsx` | 상수 제거 + goals state + fetchRemote 쿼리 + 사용 위치 교체 |
