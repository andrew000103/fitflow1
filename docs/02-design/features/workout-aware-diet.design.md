# Design: workout-aware-diet

**Feature**: 운동 연동 식단 목표 자동 조정  
**Architecture**: Option C — Pragmatic Balance  
**Status**: Design  
**Created**: 2026-04-02  
**Plan Ref**: `docs/01-plan/features/workout-aware-diet.plan.md`

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 사용자 핵심 불편: "숫자만 쫓게 된다" — 운동을 했는데도 식단 앱은 그걸 모름. FIT은 운동 세션을 알기 때문에 맥락 있는 목표를 줄 수 있음 |
| WHO | 운동 + 식단을 같이 관리하는 FIT 핵심 타겟. nSuns 사용자, 자유 운동 기록자 모두 포함 |
| RISK | 칼로리 추정 로직이 부정확하면 신뢰성 저하. AI 플랜 목표와 충돌 시 우선순위 혼선 위험 |
| SUCCESS | 오늘 운동 완료 시 식단 탭 상단에 컨텍스트 카드 표시 + 목표값이 운동 볼륨/부위 기반으로 조정됨 |
| SCOPE | 식단 탭 + 신규 lib/컴포넌트. 외부 API 변경 없음. Push notification 제외. |

---

## 1. Overview

### 1.1 선택 아키텍처: Option C — Pragmatic Balance

```
[diet-screen.tsx]
  ├─ fetchTodayWorkoutAdjustment(userId, today)  ← lib 직접 호출
  ├─ <WorkoutContextCard />                       ← 독립 컴포넌트
  └─ 목표값 = baseGoal + adjustment.additional*
```

- `lib` 함수로 조회+계산 로직 분리 (기존 프로젝트 패턴과 동일)
- `WorkoutContextCard` 컴포넌트로 UI 분리
- `diet-screen.tsx`에는 조합 로직만 남음
- 커스텀 훅 없음 (프로젝트 내 전례 없음)

### 1.2 신규/수정 파일 목록

| 파일 | 타입 | 역할 |
|------|------|------|
| `src/lib/workout-diet-sync.ts` | 신규 | 오늘 운동 조회 + 조정값 계산 |
| `src/components/diet/WorkoutContextCard.tsx` | 신규 | 운동 컨텍스트 카드 UI |
| `src/screens/diet/diet-screen.tsx` | 수정 | 조정값 적용 + 카드 렌더링 |

---

## 2. 타입 정의

### 2.1 `WorkoutDietAdjustment`

`src/lib/workout-diet-sync.ts` 상단에 정의.

```typescript
export type WorkoutBodyPart = 'lower_body' | 'upper_body' | 'full_body' | 'unknown';
export type WorkoutIntensity = 'light' | 'moderate' | 'intense';

export interface WorkoutDietAdjustment {
  hasWorkout: boolean;
  workoutLabel: string;        // "하체 운동", "상체 운동", "전신 운동", "운동"
  bodyPart: WorkoutBodyPart;
  intensityLevel: WorkoutIntensity;
  totalVolumeKg: number;       // 계산에 사용된 총 볼륨 (참고용)
  additionalCalories: number;
  additionalProtein: number;
  additionalCarbs: number;
  additionalFat: number;       // 항상 0 (지방 추가 없음)
}
```

**fat은 0으로 고정**: 운동 후 지방 추가 섭취는 권장하지 않음.

---

## 3. `src/lib/workout-diet-sync.ts` 상세 설계

### 3.1 메인 함수 시그니처

```typescript
export async function fetchTodayWorkoutAdjustment(
  userId: string,
  today: string  // 'YYYY-MM-DD'
): Promise<WorkoutDietAdjustment>
```

실패 시 예외를 throw하지 않고 `hasWorkout: false` 기본값 반환 (graceful fallback).

### 3.2 내부 쿼리 흐름

```
Step 1: workout_sessions 조회
  ├─ user_id = userId
  ├─ started_at >= today + 'T00:00:00'
  ├─ started_at <= today + 'T23:59:59'
  └─ ended_at IS NOT NULL  (완료된 세션만)

Step 2: workout_sets 조회 (session_id IN [session ids])
  ├─ SELECT weight_kg, reps, exercise_id,
  │         exercises(category)  ← Supabase foreign key join
  └─ is_done = true  (완료된 세트만)

Step 3: 볼륨 계산
  ├─ weight_kg > 0: volume += weight_kg × reps
  ├─ weight_kg = 0 (맨몸): volume += 0  (볼륨 기여 없음)
  └─ totalVolumeKg = sum of all

Step 4: 부위 분류
  ├─ exercises.category 기준 (한국어: '하체', '상체', '가슴', '등', '어깨', '팔', '코어', '유산소')
  ├─ LOWER_BODY_CATEGORIES = ['하체']
  ├─ UPPER_BODY_CATEGORIES = ['가슴', '등', '어깨', '팔']  // '상체' 카테고리는 DB에 없음
  ├─ FULL_BODY_CATEGORIES = ['역도']  // 30% 이상이면 full_body 우선
  ├─ '복근', '유산소', '기타' → unknown (보수적 처리)
  ├─ 과반수 규칙: 가장 많은 세트 수를 가진 카테고리 그룹으로 결정
  └─ exercise_id가 'local::ai-' 접두어인 경우: 카테고리 불명 → unknown 처리

Step 5: 강도 레벨 결정 (볼륨 기반)
  ├─ < 3,000 kg → 'light'
  ├─ 3,000 ~ 8,000 kg → 'moderate'
  └─ > 8,000 kg → 'intense'
  (맨몸 운동만 있을 때: 세트 수 기준 fallback)

Step 6: 조정값 계산 → WorkoutDietAdjustment 반환
```

### 3.3 조정값 계산 테이블

```typescript
// 강도별 기본 조정
const INTENSITY_BASE: Record<WorkoutIntensity, { kcal: number; protein: number; carbs: number }> = {
  light:    { kcal: 150, protein: 5,  carbs: 20 },
  moderate: { kcal: 250, protein: 10, carbs: 40 },
  intense:  { kcal: 400, protein: 20, carbs: 60 },
};

// 부위 추가 보정 (탄수화물/단백질)
const BODYPART_BONUS: Record<WorkoutBodyPart, { protein: number; carbs: number }> = {
  lower_body: { protein: 0,  carbs: 20 },  // 하체: 글리코겐 소모 큼
  upper_body: { protein: 5,  carbs: 0  },  // 상체: 단백질 합성
  full_body:  { protein: 5,  carbs: 15 },  // 전신
  unknown:    { protein: 0,  carbs: 0  },  // 보수적 처리
};
```

### 3.4 운동 라벨 생성

```typescript
function buildWorkoutLabel(bodyPart: WorkoutBodyPart, sessionCount: number): string {
  const partLabel = {
    lower_body: '하체',
    upper_body: '상체',
    full_body:  '전신',
    unknown:    '',
  }[bodyPart];
  
  const base = partLabel ? `${partLabel} 운동 완료` : '운동 완료';
  return sessionCount > 1 ? `${base} (${sessionCount}세션)` : base;
}
```

### 3.5 맨몸 운동만 있을 때 Fallback

볼륨이 0이지만 세트가 있는 경우 (`is_done` 세트 수 기준):
- ≤ 10세트: `light`
- 11~25세트: `moderate`  
- > 25세트: `intense`

---

## 4. `src/components/diet/WorkoutContextCard.tsx` 상세 설계

### 4.1 Props 인터페이스

```typescript
interface WorkoutContextCardProps {
  adjustment: WorkoutDietAdjustment;
  hasAIPlanGoal: boolean;   // AI 플랜 목표 적용 중 여부
  onDismiss: () => void;    // 닫기 콜백 (오늘 하루 숨김)
}
```

### 4.2 UI 레이아웃

```
┌──────────────────────────────────────────────────────┐
│  💪  하체 운동 완료 · 탄수화물 +60g 적용됨          [×] │
│      단백질 +10g · 칼로리 +250 kcal 추가            │
│      운동 볼륨 기반 추정값입니다                       │
└──────────────────────────────────────────────────────┘
```

**AI 플랜 목표 있을 때:**
```
┌──────────────────────────────────────────────────────┐
│  💪  하체 운동 완료 · AI 플랜 목표에 +250 kcal 추가 [×] │
│      단백질 +10g · 탄수화물 +60g 더해졌어요           │
│      운동 볼륨 기반 추정값입니다                       │
└──────────────────────────────────────────────────────┘
```

### 4.3 색상 및 스타일
- 카드 배경: `colors.accentMuted` (기존 앱 강조색 연하게)
- 왼쪽 아이콘: `MaterialCommunityIcons` `dumbbell` 아이콘
- 닫기 버튼: `close-circle` 아이콘, `colors.textTertiary`
- 하단 추정값 텍스트: 10px, `colors.textTertiary`, italic

### 4.4 텍스트 생성 로직

```typescript
function buildHeadline(adj: WorkoutDietAdjustment, hasAIPlanGoal: boolean): string {
  const parts: string[] = [adj.workoutLabel];
  if (hasAIPlanGoal) {
    parts.push(`AI 플랜 목표에 +${adj.additionalCalories} kcal 추가`);
  } else {
    const changedMacros: string[] = [];
    if (adj.additionalCarbs > 0) changedMacros.push(`탄수화물 +${adj.additionalCarbs}g`);
    if (changedMacros.length > 0) parts.push(`${changedMacros.join(', ')} 조정됨`);
  }
  return parts.join(' · ');
}

function buildSubline(adj: WorkoutDietAdjustment, hasAIPlanGoal: boolean): string {
  const items: string[] = [];
  if (adj.additionalProtein > 0) items.push(`단백질 +${adj.additionalProtein}g`);
  if (hasAIPlanGoal && adj.additionalCarbs > 0) items.push(`탄수화물 +${adj.additionalCarbs}g`);
  if (!hasAIPlanGoal && adj.additionalCalories > 0) items.push(`칼로리 +${adj.additionalCalories} kcal`);
  return items.join(' · ') + (items.length > 0 ? ' 추가' : '');
}
```

---

## 5. `src/screens/diet/diet-screen.tsx` 수정 사항

### 5.1 추가 상태

```typescript
const [workoutAdjustment, setWorkoutAdjustment] = useState<WorkoutDietAdjustment | null>(null);
const [cardDismissed, setCardDismissed] = useState(false);
```

### 5.2 useEffect 수정

기존 목표 로드 useEffect와 독립적인 별도 useEffect로 조회 (관심사 분리):

```typescript
// 오늘 운동 조정값 로드 (기존 목표 로드와 독립적으로 실행)
useEffect(() => {
  if (!user?.id) return;
  fetchTodayWorkoutAdjustment(user.id, today).then((adj) => {
    if (adj.hasWorkout) setWorkoutAdjustment(adj);
  }).catch(() => {});
}, [user?.id, today]);
```

### 5.3 목표값 계산 수정

기존: `calorieGoal`, `macroGoals` 상태에 저장  
변경: 기존 상태 유지 + 렌더 시 운동 조정값을 더한 `effectiveCalorieGoal`, `effectiveMacroGoals` 계산

```typescript
// 렌더 로직에서 useMemo로 계산 (상태 변경 없음, 부작용 없음)
const effectiveGoals = useMemo(() => {
  const adj = workoutAdjustment;
  return {
    calories: calorieGoal + (adj?.additionalCalories ?? 0),
    protein_g: macroGoals.protein_g + (adj?.additionalProtein ?? 0),
    carbs_g: macroGoals.carbs_g + (adj?.additionalCarbs ?? 0),
    fat_g: macroGoals.fat_g,  // 지방은 조정 없음
  };
}, [calorieGoal, macroGoals, workoutAdjustment]);
```

- `calorieGoal`, `macroGoals` 상태 자체는 변경하지 않음 (기존 로직 회귀 방지)
- 링/매크로 바의 `goal` props만 `effectiveGoals.*`로 교체

### 5.4 카드 dismissal (오늘 하루 숨김)

```typescript
const DISMISS_KEY = `diet_workout_card_dismissed_${today}`;  // 날짜별 키

// 컴포넌트 마운트 시 오늘 dismissal 여부 로드
useEffect(() => {
  AsyncStorage.getItem(DISMISS_KEY).then((v) => {
    if (v === '1') setCardDismissed(true);
  });
}, [today]);

const handleDismissCard = useCallback(async () => {
  setCardDismissed(true);
  await AsyncStorage.setItem(DISMISS_KEY, '1');
}, [today]);
```

### 5.5 렌더 위치

`<ScrollView>` 내부, 요약 카드(`summaryCard`) **위에** `WorkoutContextCard` 삽입:

```tsx
<ScrollView>
  {/* 신규: 운동 컨텍스트 카드 */}
  {workoutAdjustment?.hasWorkout && !cardDismissed && (
    <WorkoutContextCard
      adjustment={workoutAdjustment}
      hasAIPlanGoal={Boolean(appliedGoalPlan)}
      onDismiss={handleDismissCard}
    />
  )}

  {/* 기존: 요약 카드 */}
  <AppCard variant="elevated" style={styles.summaryCard}>
    ...링/매크로 바 (effectiveGoals 사용)...
  </AppCard>

  {/* 기존: 식사 섹션들 */}
  ...
</ScrollView>
```

---

## 6. 데이터 흐름 다이어그램

```
[diet-screen 마운트]
        │
        ├─ fetchTodayWorkoutAdjustment(userId, today)
        │        │
        │        ├─ Supabase: workout_sessions (오늘, 완료)
        │        ├─ Supabase: workout_sets + exercises(category)
        │        ├─ 볼륨 계산 → 강도 레벨
        │        ├─ 카테고리 분류 → 부위 결정
        │        └─ → WorkoutDietAdjustment
        │
        ├─ setWorkoutAdjustment(adj)
        │
        ├─ effectiveGoals = baseGoal + adj.additional*  [useMemo]
        │
        └─ 렌더:
             ├─ <WorkoutContextCard>  (adj.hasWorkout && !dismissed)
             └─ <SummaryCard goal={effectiveGoals}>
```

---

## 7. 엣지 케이스 처리

| 케이스 | 처리 방법 |
|--------|-----------|
| 운동 없는 날 | `hasWorkout: false` → 카드 미표시, 목표 그대로 |
| 세션 조회 실패 | `catch(() => null)` → 카드 미표시, 목표 그대로 |
| 맨몸 운동만 (볼륨 0) | 세트 수 fallback으로 intensity 결정 |
| `exercise_id = 'local::ai-{name}'` | category 불명 → `unknown` bodyPart |
| AI 플랜 목표 적용 중 | 카드 문구 변경, additive 조정은 동일하게 적용 |
| 카드 dismissal 후 앱 재시작 | AsyncStorage 날짜별 키 → 자동 초기화 (다음 날) |
| 여러 세션 완료 (오전 + 오후) | 모든 세션의 세트를 합산하여 계산 |
| 유산소만 한 날 | `unknown` bodyPart → 보수적 조정값 (강도별 기본값만 적용) |

---

## 8. 코드 품질 규칙

- `workout-diet-sync.ts`는 순수 비동기 함수. 전역 상태(Zustand) 접근 없음
- try-catch는 `fetchTodayWorkoutAdjustment` 바깥(diet-screen 호출부)에서 처리
- `WorkoutContextCard`는 상태 없음 (dismissal 상태는 diet-screen이 관리)
- `effectiveGoals`는 useMemo로 계산 — 상태 변경 없음 (기존 목표 상태 오염 방지)

---

## 9. TypeScript 타입 안전성

- `WorkoutDietAdjustment`는 `export` 타입으로 `workout-diet-sync.ts`에 정의
- `WorkoutContextCardProps`는 컴포넌트 파일 내 지역 타입
- Supabase 응답의 `exercises(category)` join 결과: `{ category: string | null }` 처리 필수
- `exercise_id`가 string인지 null인지 체크 후 접두어 검사

---

## 10. 테스트 포인트

| 시나리오 | 기대 결과 |
|----------|-----------|
| 오늘 하체 세션 완료 (5,000kg 볼륨) | moderate 강도, 탄수화물 +60g (+40 base + 20 lower), 단백질 +10g |
| 오늘 상체 세션 완료 (2,000kg 볼륨) | light 강도, 단백질 +10g (+5 base + 5 upper), 탄수화물 +20g |
| 오늘 운동 없음 | 카드 없음, 목표 그대로 |
| AI 플랜 목표 적용 중 + 운동 있음 | 카드 문구 변경, 수치는 동일하게 additive |
| 카드 닫기 후 같은 날 재진입 | 카드 미표시 |
| 맨몸 스쿼트 15세트 | moderate fallback, unknown bodyPart → 기본값만 |

---

## 11. Implementation Guide

### 11.1 구현 순서

1. `src/lib/workout-diet-sync.ts` 작성
   - 타입 정의
   - 상수 테이블 (INTENSITY_BASE, BODYPART_BONUS)
   - 내부 헬퍼 함수 (`classifyBodyPart`, `buildWorkoutLabel`, `getIntensityLevel`)
   - `fetchTodayWorkoutAdjustment` 메인 함수

2. `src/components/diet/WorkoutContextCard.tsx` 작성
   - Props 타입
   - 텍스트 생성 로직 (`buildHeadline`, `buildSubline`)
   - 레이아웃 + StyleSheet

3. `src/screens/diet/diet-screen.tsx` 수정
   - `workoutAdjustment` 상태 추가
   - `cardDismissed` 상태 + AsyncStorage 연동
   - `useEffect` 안에 조회 추가
   - `effectiveGoals` useMemo 추가
   - 링/매크로 바 props 교체
   - `WorkoutContextCard` 렌더 추가

4. `npx tsc --noEmit` 통과 확인

### 11.2 주의 사항

- `diet-screen.tsx`의 기존 `calorieGoal`/`macroGoals` 상태는 건드리지 말 것
- `effectiveGoals`는 useMemo만 — 기존 상태 mutate 금지
- 조회 실패를 `console.error`로만 기록, throw 없음

### 11.3 Session Guide

| Module | 파일 | 예상 작업량 |
|--------|------|-------------|
| module-1 | `src/lib/workout-diet-sync.ts` | ~80줄, 신규 작성 |
| module-2 | `src/components/diet/WorkoutContextCard.tsx` | ~120줄, 신규 작성 |
| module-3 | `src/screens/diet/diet-screen.tsx` | ~40줄 수정 |

**추천 세션 분할:**
- Session 1: `--scope module-1` — lib 함수 완성 + 타입 검증
- Session 2: `--scope module-2,module-3` — UI + 연동 완성
