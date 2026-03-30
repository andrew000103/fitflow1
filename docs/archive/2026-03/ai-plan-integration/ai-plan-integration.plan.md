# Plan: ai-plan-integration

> Feature: AI 플랜 운동/식단 탭 통합 + 중량 데이터 추가
> Created: 2026-03-25
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | AI 플랜이 생성돼도 운동/식단/프로필 탭은 플랜 데이터를 전혀 활용하지 않아 별도 탭을 오가야 하고, 운동 프로그램에 중량 정보가 없어 실제 운동에 활용하기 어려움 |
| **Solution** | 운동 탭에 오늘 AI 플랜 카드(중량 포함, 바로 시작 가능)를, 식단/프로필 탭에 AI 플랜 목표값을 표시하고, 플랜 미생성 시 프로필 기반 칼로리 자동 계산으로 폴백 |
| **Function UX Effect** | 앱 진입 즉시 오늘 AI 플랜 운동/식단 목표 파악 가능; 운동 탭에서 AI 추천 운동을 바로 시작할 수 있어 플랜 → 실행 흐름이 자연스러워짐 |
| **Core Value** | AI 플랜의 실용성 극대화 — 결과 화면에서만 보던 플랜이 매일 쓰는 탭에서 직접 활용됨 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | AI 플랜이 결과 화면에만 격리돼 일상적 활용 불가; 운동 중량 미포함으로 실전 가이드 부족 |
| **WHO** | AI 플랜을 생성한 모든 유저, 미생성 유저는 프로필 기반 폴백 |
| **RISK** | Gemini 프롬프트 변경 → weight_kg 미포함 응답 시 graceful null 처리 필요 |
| **SUCCESS** | 운동 탭 AI 카드 표시, 식단/프로필 탭 목표값 동적화, AI 운동 바로 시작 |
| **SCOPE** | 5개 파일 수정 (ai-plan-store, ai-planner, workout-screen, diet-screen, profile-screen) |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | `WorkoutExercise`에 `weight_kg?: number` 필드 추가; Gemini 프롬프트에 `"weight_kg": number \| null` 출력 지시 | Must |
| FR-2 | 운동 탭: 오늘 요일 기반으로 AI 플랜 `weeklyWorkout`에서 해당 `WorkoutDay` 표시 — 종목명/세트/반복/중량 | Must |
| FR-3 | 운동 탭: Rest Day이면 "오늘은 휴식일입니다" 카드 표시; 운동일이면 "AI 플랜 운동 시작" 버튼 (빈 운동 시작 연결) | Must |
| FR-4 | 식단 탭: AI 플랜 있으면 `targetCalories`/`targetMacros` 사용; 없으면 프로필 기반 자동 계산 | Must |
| FR-5 | 프로필 탭: AI 플랜 목표 요약 섹션 추가 (목표 유형, 목표 칼로리, 단백질/탄수화물/지방) | Must |

### 1.2 비기능 요구사항

- **weight_kg optional**: 모든 운동에 중량이 있는 것은 아님 (맨몸 운동 등) — null 허용
- **플랜 미생성 폴백**: 식단/프로필 탭에서 AI 플랜 없을 때 프로필(나이/키/체중/성별/목표) 기반 Mifflin-St Jeor 계산
- **요일 매핑**: `new Date().getDay()` → `['sun','mon','tue','wed','thu','fri','sat'][n]` → `weeklyWorkout` 배열에서 해당 day 탐색
- **AI 운동 시작**: 기존 `workoutStore.startSession()` 활용 (빈 운동), 별도 스토어 메서드 추가 없음

---

## 2. 범위

### In Scope
- `src/stores/ai-plan-store.ts`: `WorkoutExercise`에 `weight_kg?: number` 추가
- `src/lib/ai-planner.ts`: Gemini 프롬프트 exercise 스키마에 `weight_kg` 추가
- `src/screens/workout/workout-screen.tsx`: AI 플랜 오늘 운동 카드 섹션 추가
- `src/screens/diet/diet-screen.tsx`: 하드코딩 `CALORIE_GOAL`/`MACRO_GOALS` → 동적 값으로 교체
- `src/screens/profile/profile-screen.tsx`: AI 플랜 목표 요약 섹션 추가

### Out of Scope
- `WorkoutSession`에서 AI 플랜 종목 자동 추가 (별도 세션에서 처리)
- AI 플랜 종목을 Supabase `exercises` 테이블에 저장/매핑 (별도 작업)
- 식단 탭에서 AI 플랜 추천 식단 목록 표시 (목표 수치만)

---

## 3. 기술 설계

### 3.1 FR-1 — WorkoutExercise 타입 + 프롬프트 수정

```typescript
// ai-plan-store.ts — weight_kg 추가
export interface WorkoutExercise {
  name: string;
  sets: number;
  repsRange: string;
  weight_kg?: number | null;  // ← 추가 (맨몸 운동은 null)
  note?: string | null;
}
```

```
// ai-planner.ts buildPrompt() 출력 형식 수정
"exercises": [
  {
    "name": string,
    "sets": number,
    "repsRange": string,
    "weight_kg": number | null,   // ← 추가 (맨몸운동/카디오는 null)
    "note": string | null
  }
]
```

### 3.2 FR-2/FR-3 — 운동 탭 AI 플랜 카드

```typescript
// workout-screen.tsx — 오늘 요일 → AI 플랜 day 매핑
const DAY_MAP = ['sun','mon','tue','wed','thu','fri','sat'];
const todayKey = DAY_MAP[new Date().getDay()];
const todayAIPlan = currentPlan?.weeklyWorkout.find(d => d.dayOfWeek === todayKey);

// 렌더링
if (!currentPlan) → 카드 없음 (AI 플랜 없음 안내 또는 미표시)
if (todayAIPlan?.isRestDay) → "오늘은 휴식일입니다 🛌" 카드
if (todayAIPlan && !isRestDay) → 운동 목록 카드 + "AI 플랜 운동 시작" 버튼
```

**AI 플랜 운동 시작 버튼 동작:**
```typescript
// 빈 운동 시작 (기존 로직 재사용)
workoutStore.startSession();
navigation.navigate('WorkoutSession');
// WorkoutSession에서 사용자가 직접 종목 추가 — AI 플랜 카드에 종목 목록이 참고용으로 표시됨
```

### 3.3 FR-4 — 식단 탭 동적 목표

```typescript
// diet-screen.tsx — AI 플랜 또는 프로필 기반 계산
import { useAIPlanStore } from '../../stores/ai-plan-store';
import { getUserProfile, getLatestUserGoal } from '../../lib/profile';

// 우선순위: AI 플랜 > user_goals > 프로필 기반 계산 > 하드코딩 폴백
const currentPlan = useAIPlanStore(s => s.currentPlan);

// useFocusEffect 또는 useEffect에서 로드:
// 1. currentPlan 있으면 → targetCalories, targetMacros 사용
// 2. 없으면 → user_goals.target_calories 사용
// 3. 없으면 → user_profiles로 Mifflin-St Jeor 계산
// 4. 없으면 → 하드코딩 2000 유지
```

**프로필 기반 칼로리 계산 (폴백):**
```typescript
function calcTargetCaloriesFromProfile(profile: UserProfileRecord, goalType: string): number {
  const { age, height_cm, weight_kg, gender } = profile;
  if (!age || !height_cm || !weight_kg) return 2000;
  const bmr = gender === 'female'
    ? 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    : 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  const tdee = bmr * 1.375; // 가벼운 활동 계수
  if (goalType === 'weight_loss') return Math.max(tdee - 500, 1200);
  if (goalType === 'muscle_gain') return tdee + 300;
  return Math.round(tdee);
}
```

### 3.4 FR-5 — 프로필 탭 AI 플랜 목표 섹션

```typescript
// profile-screen.tsx — AI 플랜 목표 섹션
const { currentPlan, onboardingData } = useAIPlanStore(s => ({
  currentPlan: s.currentPlan,
  onboardingData: s.onboardingData,
}));

// 표시: AI 플랜 목표 카드 (currentPlan 있을 때)
// - 목표: onboardingData.goal 한글 표시
// - 목표 칼로리: currentPlan.targetCalories kcal
// - 단백질/탄수화물/지방: targetMacros
// - 플랜 생성일: currentPlan.generatedAt
// AI 플랜 없을 때: user_goals 기반 표시 (기존 로직 유지)
```

---

## 4. 성공 기준

| ID | 기준 |
|----|------|
| SC-1 | `WorkoutExercise.weight_kg` 필드 존재, 새 AI 플랜 생성 시 중량 포함 |
| SC-2 | 운동 탭 → 오늘 요일 AI 플랜 운동 카드 표시 (Rest Day 포함) |
| SC-3 | 운동 탭 → "AI 플랜 운동 시작" 버튼 클릭 시 WorkoutSession 진입 |
| SC-4 | 식단 탭 → AI 플랜 있으면 `targetCalories` 표시, 없으면 프로필 기반 계산값 |
| SC-5 | 프로필 탭 → AI 플랜 목표 섹션 표시 |
| SC-6 | AI 플랜 없는 유저 → 앱 크래시 없음, 폴백 정상 동작 |

---

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| Gemini가 weight_kg 미반환 (이전 플랜 포함) | `WorkoutExercise.weight_kg` optional로 선언, UI에서 null 체크 후 미표시 |
| 오늘 요일이 weeklyWorkout에 없는 경우 | `find()` → undefined 시 "AI 플랜을 확인해주세요" 안내 |
| profile 데이터 없는 유저 폴백 계산 | age/height/weight 중 하나라도 없으면 하드코딩 2000 유지 |
| WorkoutSession에서 AI 종목이 pre-load 안 됨 | 운동 탭 카드에 목록 표시로 사용자가 참고하며 직접 추가 — 이 범위에서는 수용 |

---

## 6. 구현 모듈 (Session Guide)

| 모듈 | 파일 | 내용 |
|------|------|------|
| module-1 | `src/stores/ai-plan-store.ts` | WorkoutExercise 타입 weight_kg 추가 |
| module-2 | `src/lib/ai-planner.ts` | buildPrompt() 운동 스키마 수정 |
| module-3 | `src/screens/workout/workout-screen.tsx` | AI 플랜 오늘 운동 카드 |
| module-4 | `src/screens/diet/diet-screen.tsx` | 동적 목표 칼로리/매크로 |
| module-5 | `src/screens/profile/profile-screen.tsx` | AI 플랜 목표 섹션 |
