# Design: adaptive-workout-intensity

> Feature: 적응형 운동 강도 조정
> Created: 2026-03-25
> Status: Design
> Architecture: Option C — ai-planner 통합

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 강도 입력 강제로 초보자 이탈 위험, 정적 플랜으로 점진적 과부하 원칙 미적용 |
| **WHO** | 운동 초보자(특히 다이어트 목표 여성), 기존 강도 입력 완료 중고급자 모두 |
| **RISK** | 룰 기반 증량이 부상으로 이어질 수 있음 → 보수적 증량 폭 (+2.5kg max) |
| **SUCCESS** | Skip 후 플랜 정상 생성, 주간 자동 조정 적용, AI 재생성 시 히스토리 반영 |
| **SCOPE** | onboarding skip + rule-based weekly adjustment + AI prompt history injection |

---

## 1. Overview

### 1.1 선택된 아키텍처: Option C — ai-planner 통합

기존 `ai-planner.ts`에 이미 Supabase 쿼리 패턴(`fetchUserHistorySummary`)이 있으므로,
워크아웃 수행 데이터 조회 및 조정 로직도 동일 파일에 통합한다.
Store는 상태 관리에만 집중하며 planner 함수를 호출한다.

### 1.2 수정 대상 파일 (신규 파일 없음)

| 파일 | 변경 유형 | 주요 내용 |
|------|-----------|-----------|
| `src/lib/ai-planner.ts` | 기능 추가 | `fetchRecentWorkoutPerformance()`, `computeAdjustedWeight()`, `buildWorkoutHistorySection()`, `buildPrompt()` 수정 |
| `src/stores/ai-plan-store.ts` | 기능 추가 | `isAdjusting` 상태, `applyRuleBasedAdjustment(userId)` 액션 |
| `src/screens/ai/ai-onboarding-screen.tsx` | UX 수정 | `strengthSkipped` 상태, "강도 입력 건너뛰기" 버튼, `strengthProfile: []` 전달 |
| `src/screens/ai/ai-plan-weekly-screen.tsx` | UX 추가 | "중량 자동 조정" 버튼 추가 |

---

## 2. 데이터 플로우

### 2.1 강도 스킵 플로우

```
[온보딩 강도 스텝]
  └─ "강도 입력 건너뛰기" 클릭
       → strengthSkipped = true
       → passedStrengthStep = true
       → handleFinish() 시: strengthProfile = []
       → buildPrompt() 수신: strengthProfile.length === 0
       → 프롬프트에 보수적 weight_kg 지시 추가
```

### 2.2 룰 기반 주간 조정 플로우

```
[주간 리뷰 화면]
  └─ "중량 자동 조정" 클릭
       → applyRuleBasedAdjustment(userId) 호출
       → fetchRecentWorkoutPerformance(userId, planExercises, 7)
            → Supabase: workout_sets JOIN workout_sessions WHERE user_id = userId AND 7일
            → exercise_id가 'local::ai-' 접두사인 경우 name_ko 기반 매칭
       → 종목별 완수율 계산 (실제reps/계획reps × 완료세트/계획세트)
       → computeAdjustedWeight() per exercise
       → currentPlan.weeklyWorkout[].exercises[].weight_kg 업데이트
       → setCurrentPlan(updatedPlan)
       → isAdjusting = false → 화면 닫힘
```

### 2.3 AI 재생성 히스토리 주입 플로우

```
[온보딩 완료 → AI 플랜 재생성]
  └─ handleFinish()
       → buildWorkoutHistorySection(userId, currentPlan)
            → fetchRecentWorkoutPerformance(userId, planExercises, 14)
            → 종목별 수행 기록을 텍스트로 포맷
       → generateAIPlan(data, history, workoutHistorySection)
       → buildPrompt()에 [최근 운동 수행 기록] 섹션 주입
```

---

## 3. ai-planner.ts 신규 인터페이스 및 함수

### 3.1 신규 타입

```typescript
// 종목별 수행 데이터
interface ExercisePerformanceRecord {
  exerciseName: string;        // AI 플랜 종목명 (매칭 키)
  plannedSets: number;
  plannedReps: number;         // repsRange 파싱값 (중간값)
  plannedWeightKg: number | null;
  actualCompletedSets: number;
  actualTotalReps: number;
  actualAvgWeightKg: number | null;
  completionRate: number;      // 0~1 (실제reps/계획reps × 완료세트/계획세트)
}
```

### 3.2 신규 함수: fetchRecentWorkoutPerformance()

```typescript
export async function fetchRecentWorkoutPerformance(
  userId: string,
  planExercises: { name: string; sets: number; repsRange: string; weight_kg?: number | null }[],
  days: number = 14
): Promise<ExercisePerformanceRecord[]>
```

**Supabase 쿼리 전략**:
```typescript
// workout_sessions에서 user 필터 후 sets 조회
const since = new Date(Date.now() - days * 86400000).toISOString();

const { data: sessions } = await supabase
  .from('workout_sessions')
  .select('id')
  .eq('user_id', userId)
  .gte('started_at', since);

const sessionIds = sessions?.map(s => s.id) ?? [];

const { data: sets } = await supabase
  .from('workout_sets')
  .select('exercise_id, weight_kg, reps, is_done')
  .in('session_id', sessionIds);
```

**local::ai-* 매칭 로직**:
```typescript
// exercise_id가 'local::ai-{name}' 형식인 경우
// name_ko 직접 추출하여 planExercises와 매칭
function extractNameFromLocalId(exerciseId: string): string | null {
  if (exerciseId.startsWith('local::ai-')) {
    return exerciseId.replace('local::ai-', '');
  }
  return null;
}
```

**완수율 계산**:
```typescript
function computeCompletionRate(
  plannedSets: number,
  plannedRepsPerSet: number,
  actualDoneSets: { reps: number }[]
): number {
  if (plannedSets === 0 || plannedRepsPerSet === 0) return 0;
  const totalPlanned = plannedSets * plannedRepsPerSet;
  const totalActual = actualDoneSets.reduce((sum, s) => sum + s.reps, 0);
  return Math.min(totalActual / totalPlanned, 1);
}
```

### 3.3 신규 함수: computeAdjustedWeight()

```typescript
const COMPOUND_NAMES = ['스쿼트', '데드리프트', '벤치프레스', '오버헤드프레스', '바벨로우', '풀업'];

function isCompoundExercise(name: string): boolean {
  return COMPOUND_NAMES.some(c => name.includes(c));
}

export function computeAdjustedWeight(
  exerciseName: string,
  currentWeightKg: number | null,
  completionRate: number
): number | null {
  if (currentWeightKg === null || currentWeightKg === undefined) return null;

  const isCompound = isCompoundExercise(exerciseName);
  const increment = isCompound ? 2.5 : 1.0;

  if (completionRate >= 0.9) {
    return currentWeightKg + increment;
  } else if (completionRate < 0.6) {
    return Math.max(0, currentWeightKg - increment);
  }
  return currentWeightKg; // 60~89% → 현상 유지
}
```

### 3.4 신규 함수: buildWorkoutHistorySection()

```typescript
export async function buildWorkoutHistorySection(
  userId: string,
  currentPlan: AIPlan
): Promise<string> {
  // currentPlan에서 운동 종목 추출
  const planExercises = currentPlan.weeklyWorkout
    .flatMap(d => d.exercises)
    .filter((e, i, arr) => arr.findIndex(x => x.name === e.name) === i); // 중복 제거

  if (planExercises.length === 0) return '';

  try {
    const records = await fetchRecentWorkoutPerformance(userId, planExercises, 14);
    if (records.length === 0) return '';

    // 최대 10종목, 가장 최근 수행 기준
    const top = records.slice(0, 10);
    const lines = top.map(r => {
      const rate = Math.round(r.completionRate * 100);
      const weightStr = r.actualAvgWeightKg != null ? `${r.actualAvgWeightKg}kg × ` : '';
      return `- ${r.exerciseName}: ${weightStr}${r.actualCompletedSets}/${r.plannedSets}세트 완료 — 완수율 ${rate}%`;
    });

    return `\n[최근 운동 수행 기록 (2주)]\n${lines.join('\n')}\n→ 위 수행 데이터를 참고하여 다음 주 weight_kg 및 sets/repsRange를 현실적으로 조정해주세요.\n`;
  } catch {
    return ''; // 오류 시 graceful fallback
  }
}
```

### 3.5 buildPrompt() 수정

**추가: strengthProfile = [] 분기 (FR-2)**
```typescript
// 기존 strengthSection 로직 수정
let strengthSection = '';
if (data.strengthProfile && data.strengthProfile.length > 0) {
  // 기존: 중량 표시
  strengthSection = `\n[현재 운동 중량 (참고용)]\n${...}\n`;
} else if (Array.isArray(data.strengthProfile) && data.strengthProfile.length === 0) {
  // 신규: 보수적 지시
  strengthSection = `\n→ 사용자가 운동 중량을 입력하지 않았습니다. 운동 경험(${data.experience})을 고려하여 weight_kg를 맨몸 또는 매우 가벼운 중량(0~10kg)으로 보수적으로 설정해주세요.\n`;
}
// undefined인 경우: 강도 스텝 미도달 → 기존처럼 빈 문자열
```

**추가: workoutHistorySection 파라미터 주입 (FR-5)**
```typescript
function buildPrompt(
  data: OnboardingData,
  history: UserHistorySummary | null,
  workoutHistorySection: string = ''  // 신규 파라미터
): string {
  // ... 기존 코드 ...
  return `...${historySection}${workoutHistorySection}\n[중요 지침]...`;
}
```

**generateAIPlan() 시그니처 수정**:
```typescript
export async function generateAIPlan(
  data: OnboardingData,
  history: UserHistorySummary | null,
  workoutHistorySection: string = ''  // 신규
): Promise<AIPlan>
```

---

## 4. ai-plan-store.ts 변경

### 4.1 신규 상태 및 액션

```typescript
interface AIPlanState {
  // 기존 필드들...
  isAdjusting: boolean;  // 신규
  applyRuleBasedAdjustment: (userId: string) => Promise<void>;  // 신규
}
```

### 4.2 applyRuleBasedAdjustment() 구현

```typescript
applyRuleBasedAdjustment: async (userId: string) => {
  const { currentPlan } = get();
  if (!currentPlan) return;

  set({ isAdjusting: true });
  try {
    const planExercises = currentPlan.weeklyWorkout
      .flatMap(d => d.exercises)
      .filter((e, i, arr) => arr.findIndex(x => x.name === e.name) === i);

    const records = await fetchRecentWorkoutPerformance(userId, planExercises, 7);
    const perfMap = new Map(records.map(r => [r.exerciseName, r]));

    const updatedPlan: AIPlan = {
      ...currentPlan,
      weeklyWorkout: currentPlan.weeklyWorkout.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => {
          const perf = perfMap.get(ex.name);
          if (!perf) return ex; // 기록 없음 → 현상 유지

          const newWeight = computeAdjustedWeight(
            ex.name,
            ex.weight_kg ?? null,
            perf.completionRate
          );
          return { ...ex, weight_kg: newWeight };
        }),
      })),
    };

    set((state) => ({
      previousPlan: state.currentPlan,
      currentPlan: updatedPlan,
      isAdjusting: false,
    }));
  } catch {
    set({ isAdjusting: false });
  }
},
```

---

## 5. ai-onboarding-screen.tsx 변경

### 5.1 신규 상태

```typescript
const [strengthSkipped, setStrengthSkipped] = useState(false);
```

### 5.2 강도 스텝 UI 변경

**기존 footer (강도 스텝)**:
```tsx
<TouchableOpacity style={s.primaryBtn} onPress={() => setPassedStrengthStep(true)}>
  <Text>다음</Text>
</TouchableOpacity>
<TouchableOpacity style={s.skipBtn} onPress={handleSkipPhase2}>
  <Text>건너뛰고 플랜 받기</Text>
</TouchableOpacity>
```

**변경 후 footer (강도 스텝)**:
```tsx
<TouchableOpacity style={s.primaryBtn} onPress={() => setPassedStrengthStep(true)}>
  <Text>다음</Text>
</TouchableOpacity>
{/* 신규: 강도만 건너뛰기 (Phase 2 계속) */}
<TouchableOpacity
  style={s.skipBtn}
  onPress={() => { setStrengthSkipped(true); setPassedStrengthStep(true); }}
>
  <Text>중량 모름 / 건너뛰기</Text>
</TouchableOpacity>
<TouchableOpacity style={[s.skipBtn, { marginTop: 4 }]} onPress={handleSkipPhase2}>
  <Text>건너뛰고 플랜 받기</Text>
</TouchableOpacity>
```

> **UX 설명**: "중량 모름 / 건너뛰기"는 Phase 2 질문으로 계속 진행. "건너뛰고 플랜 받기"는 Phase 2 전체 스킵 후 즉시 플랜 생성.

### 5.3 handleFinish() 수정

```typescript
// 기존
...(strengthProfile.length > 0 ? { strengthProfile } : {}),

// 변경 후
// skipPhase2가 아닐 때(강도 스텝을 통과한 경우):
//   - strengthSkipped=true OR 빈 inputs → strengthProfile: []  → 보수적 프롬프트
//   - entries 있음 → strengthProfile: [...]  → 중량 참고 프롬프트
...(skipPhase2
  ? {}
  : { strengthProfile: strengthSkipped ? [] : strengthProfile }),
```

### 5.4 handleFinish()에 workoutHistorySection 주입 (FR-5)

```typescript
const handleFinish = async (skipPhase2 = false) => {
  // ... 기존 data 조립 ...

  const history = user?.id ? await fetchUserHistorySummary(user.id) : null;

  // 신규: AI 재생성 시 최근 운동 히스토리 주입
  let workoutHistorySection = '';
  if (user?.id) {
    const existingPlan = useAIPlanStore.getState().currentPlan;
    if (existingPlan) {
      workoutHistorySection = await buildWorkoutHistorySection(user.id, existingPlan);
    }
  }

  const plan = await generateAIPlan(data, history, workoutHistorySection);
  // ...
};
```

---

## 6. ai-plan-weekly-screen.tsx 변경

### 6.1 신규 버튼 및 상태

```typescript
const { currentPlan, previousPlan, restorePreviousPlan, isAdjusting, applyRuleBasedAdjustment } = useAIPlanStore();
const { user } = useAuthStore();

const handleAdjust = async () => {
  if (!user?.id) return;
  await applyRuleBasedAdjustment(user.id);
  navigation.goBack();
};
```

### 6.2 footer 버튼 추가

```tsx
<View style={s.footer}>
  {/* 기존 */}
  <TouchableOpacity style={s.primaryBtn} onPress={handleApply}>
    <Text>이번 주 플랜 적용하기</Text>
  </TouchableOpacity>

  {/* 신규: 중량 자동 조정 */}
  <TouchableOpacity
    style={[s.adjustBtn, isAdjusting && { opacity: 0.5 }]}
    onPress={handleAdjust}
    disabled={isAdjusting}
  >
    <Text>{isAdjusting ? '조정 중...' : '중량 자동 조정'}</Text>
  </TouchableOpacity>

  {/* 기존 */}
  {prev && (
    <TouchableOpacity style={s.secondaryBtn} onPress={handleKeepOld}>
      <Text>이전 플랜 유지</Text>
    </TouchableOpacity>
  )}
</View>
```

**스타일 추가**:
```typescript
adjustBtn: {
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: colors.accent,
},
adjustBtnText: {
  fontSize: 15,
  color: colors.accent,
  fontWeight: '600',
},
```

---

## 7. 엣지 케이스 처리

| 케이스 | 처리 방법 |
|--------|-----------|
| 운동 기록 없는 신규 유저 | `fetchRecentWorkoutPerformance` → `[]` 반환 → 조정 스킵 (SC-5) |
| `local::ai-*` exercise_id JOIN 실패 | `startsWith('local::ai-')` 감지 → name 추출 후 플랜 종목명과 매칭 |
| AI 플랜 종목명 vs 실제 기록 불일치 | `perfMap.get(ex.name)` → `undefined` → 해당 종목 현상 유지 |
| `weight_kg = null` (맨몸/카디오) | `computeAdjustedWeight` → `null` 반환 → 기존 값 유지 |
| `applyRuleBasedAdjustment` 실패 | `catch` → `isAdjusting = false` → 크래시 없음 |
| `buildWorkoutHistorySection` 실패 | `catch` → `''` 반환 → AI 생성 계속 진행 |
| Gemini 프롬프트 길이 초과 | 최대 10종목으로 slice (FR-5 리스크 대응) |

---

## 8. Supabase 쿼리 설계

### 8.1 workout_sets 조회 (2단계 쿼리)

```typescript
// Step 1: 해당 유저의 세션 ID 조회
const { data: sessions } = await supabase
  .from('workout_sessions')
  .select('id')
  .eq('user_id', userId)
  .gte('started_at', sinceISO);

// Step 2: 해당 세션의 workout_sets 조회
const { data: sets } = await supabase
  .from('workout_sets')
  .select('exercise_id, weight_kg, reps, is_done')
  .in('session_id', sessionIds);
```

> **Note**: 단일 JOIN 쿼리 대신 2단계로 분리한 이유:
> Supabase JS에서 `.eq('nested.field', value)` 필터링이 불안정할 수 있음.
> sessions 수가 많지 않은 개인 앱에서 2단계 쿼리가 더 안전.

### 8.2 exercise_id → name 매핑

```typescript
// workout_sets.exercise_id 분류
// 1. 'local::ai-{name}' → AI 플랜 종목 → name 추출
// 2. UUID 형식 → exercises 테이블 JOIN 필요 (현재 미구현, 향후 개선)
// 3. null → 이름 없음 → 스킵

// 현재 구현: AI 플랜 운동만 정확히 매칭, 일반 운동은 향후 확장
const nameFromId = exerciseId?.startsWith('local::ai-')
  ? exerciseId.replace('local::ai-', '')
  : null;
```

---

## 9. 성공 기준 매핑

| SC | 기준 | 관련 구현 |
|----|------|-----------|
| SC-1 | 강도 스텝 "건너뛰기" → 다음 스텝, weight_kg = 0/null | `strengthSkipped=true` → `strengthProfile=[]` → 보수적 프롬프트 |
| SC-2 | `applyRuleBasedAdjustment()` → weight_kg 변경 | `computeAdjustedWeight()` + store state 업데이트 |
| SC-3 | 주간 리뷰 "중량 자동 조정" → 조정 → 화면 닫힘 | `handleAdjust()` → `await applyRuleBasedAdjustment()` → `navigation.goBack()` |
| SC-4 | AI 재생성 시 프롬프트에 `[최근 운동 수행 기록]` 포함 | `buildWorkoutHistorySection()` + `generateAIPlan(data, history, section)` |
| SC-5 | 신규 유저 조정 없이 정상 동작, 크래시 없음 | 빈 배열 반환 → 조정 스킵 + 모든 함수 try/catch |

---

## 10. 의존성

- 신규 npm 패키지: 없음
- Supabase 테이블: 기존 (`workout_sessions`, `workout_sets`) 활용
- 스키마 변경: 없음

---

## 11. Implementation Guide

### 11.1 구현 순서

1. **ai-planner.ts** — 신규 타입/함수 추가 (기반 로직)
   - `ExercisePerformanceRecord` 타입
   - `fetchRecentWorkoutPerformance()`
   - `computeAdjustedWeight()`
   - `buildWorkoutHistorySection()`
   - `buildPrompt()` 수정 (strengthProfile=[] 분기)
   - `generateAIPlan()` 시그니처 수정

2. **ai-plan-store.ts** — 신규 액션 추가
   - `isAdjusting` 상태
   - `applyRuleBasedAdjustment()` 액션

3. **ai-onboarding-screen.tsx** — Skip 버튼 + 히스토리 주입
   - `strengthSkipped` 상태
   - "중량 모름 / 건너뛰기" 버튼
   - `handleFinish()` 수정

4. **ai-plan-weekly-screen.tsx** — "중량 자동 조정" 버튼
   - `handleAdjust()` 함수
   - footer 버튼 추가
   - 스타일 추가

### 11.2 검증 순서

1. 강도 스텝 → "중량 모름 / 건너뛰기" → Gemini 프롬프트 콘솔 출력 확인 (보수적 지시 포함)
2. 운동 세션 완료 후 주간 리뷰 → "중량 자동 조정" → weight_kg 변경 확인
3. 운동 기록 없는 상태에서 "중량 자동 조정" → 크래시 없음 확인
4. AI 플랜 재생성 (온보딩 재실행) → Gemini 프롬프트에 `[최근 운동 수행 기록]` 포함 확인

### 11.3 Session Guide

| 모듈 | 파일 | 예상 작업량 |
|------|------|-------------|
| module-1 | `src/lib/ai-planner.ts` | ~100라인 (타입 + 4함수 + buildPrompt 수정) |
| module-2 | `src/stores/ai-plan-store.ts` | ~40라인 (상태 + 액션) |
| module-3 | `src/screens/ai/ai-onboarding-screen.tsx` | ~30라인 (상태 + 버튼 + handleFinish 수정) |
| module-4 | `src/screens/ai/ai-plan-weekly-screen.tsx` | ~30라인 (버튼 + 스타일) |

**권장 세션 분할**:
- Session 1: module-1 + module-2 (핵심 로직)
- Session 2: module-3 + module-4 (UI)

```
/pdca do adaptive-workout-intensity --scope module-1,module-2
/pdca do adaptive-workout-intensity --scope module-3,module-4
```
