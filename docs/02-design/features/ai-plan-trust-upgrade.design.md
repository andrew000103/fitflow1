# Design: ai-plan-trust-upgrade

**Feature**: ai-plan-trust-upgrade
**Date**: 2026-03-28
**Phase**: Design
**Architecture**: Option C — Pragmatic Balance

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 사용자가 AI 플랜을 믿지 못하거나(설명 부족), 실제 시설에 맞지 않는 종목이 나오거나, 특정 종목이 싫을 때 대안이 없어 포기하는 문제 |
| **WHO** | 헬스장/홈짐/맨몸 등 다양한 환경의 모든 AI 플랜 사용자 |
| **RISK** | 온보딩에 질문 추가로 플로우 길어짐 → Phase 1 필수 질문에 삽입 필요; Swap 테이블 종목명이 Gemini 출력과 불일치 가능성 |
| **SUCCESS** | (1) ExplanationCard가 운동 탭 최상단에 노출 (2) gymType이 Gemini 프롬프트에 반영되어 시설 맞춤 종목 생성 (3) 운동 세션에서 Swap 후 기록 정상 저장 |
| **SCOPE** | 온보딩 1문항 추가, ai-plan-result-screen 레이아웃 변경, 정적 대체운동 테이블 신규, workout-session-screen Swap 버튼 추가. DB 스키마 변경 없음 |

---

## 1. Overview

### 선택 아키텍처: Option C — Pragmatic Balance

| | Option A (Minimal) | **Option C (Pragmatic)** | Option B (Clean) |
|--|--|--|--|
| 신규 파일 | 1개 | **2개** | 4개 |
| 수정 파일 | 5개 | **5개** | 5개 |
| Swap 코드 중복 | 있음 | **없음** | 없음 |
| 복잡도 | 낮음 | **적당** | 높음 |
| 권장 | - | **✅** | - |

**핵심 원칙**:
- `SwapExerciseSheet.tsx` → 독립 컴포넌트 (결과화면 + 세션화면 재사용)
- `exercise-alternatives.ts` → 독립 데이터 모듈
- `EquipmentDetailSheet` → `ai-onboarding-screen.tsx` 내 인라인 Modal (1회 사용)
- 각 화면에 직접 state 관리 (별도 hook 불필요)

---

## 2. 파일 변경 목록

### 신규 파일 (2개)

| 파일 | 역할 |
|------|------|
| `src/components/ai/SwapExerciseSheet.tsx` | 대체 운동 선택 바텀시트 (결과+세션 공용) |
| `src/lib/exercise-alternatives.ts` | 정적 대체 운동 테이블 + lookup 함수 |

### 수정 파일 (5개)

| 파일 | 변경 내용 |
|------|---------|
| `src/stores/ai-plan-store.ts` | `GymType` 타입, `OnboardingData`에 `gymType`/`equipmentList` 추가 |
| `src/screens/ai/ai-onboarding-screen.tsx` | gymType 질문 추가, EquipmentDetailSheet 인라인 Modal |
| `src/lib/ai-planner.ts` | `buildPrompt`에 gymType/equipmentList 섹션 추가 |
| `src/screens/ai/ai-plan-result-screen.tsx` | ExplanationCard 상단 이동, 기본 open=true, 제목 변경, WorkoutDayCard Swap 연동 |
| `src/screens/workout/workout-session-screen.tsx` | 종목 헤더에 Swap 버튼, 세션-only 교체 |

---

## 3. 상세 설계

### 3.1 Module-1: 타입 + 온보딩 + 프롬프트

#### ai-plan-store.ts 타입 변경

```typescript
// 추가
export type GymType = 'full_gym' | 'garage_gym' | 'dumbbell_only' | 'bodyweight';

export interface OnboardingData {
  goal: AIGoal;
  gender: AIGender;
  age: number;
  height: number;
  weight: number;
  experience: AIExperience;
  workoutDaysPerWeek: number;
  gymType: GymType;              // ← 신규 (필수)
  equipmentList?: string[];       // ← 신규 (선택)
  dietaryRestrictions: string[];
  // Phase 2 (optional) — 기존 유지
  recoveryLevel?: 'easy' | 'moderate' | 'hard';
  overeatingHabit?: 'rarely' | 'sometimes' | 'often';
  sleepQuality?: 'good' | 'average' | 'poor';
  plateauHistory?: string;
  strengthProfile?: StrengthEntry[];
}
```

**기존 사용자 fallback**: `buildPrompt`에서 `data.gymType ?? 'full_gym'` 사용 → 크래시 없음

#### ai-onboarding-screen.tsx 변경

**QUESTIONS 배열 변경** (`workoutDaysPerWeek` 이후, `dietaryRestrictions` 이전에 삽입):

```typescript
// Question 타입에 gymType 추가됨 (OnboardingData에 포함되므로 자동)
{
  key: 'gymType',
  question: '주로 어떤 환경에서 운동하시나요?',
  type: 'single',
  phase: 1,
  options: [
    { label: '헬스장 (Full Gym)', value: 'full_gym' },
    { label: '홈짐 / 파워랙', value: 'garage_gym' },
    { label: '덤벨·케틀벨만', value: 'dumbbell_only' },
    { label: '맨몸 운동', value: 'bodyweight' },
  ],
},
```

**EquipmentDetailSheet 신규 state 및 Modal**:

```typescript
// 신규 state 추가
const [showEquipmentSheet, setShowEquipmentSheet] = useState(false);
const [equipmentList, setEquipmentList] = useState<string[]>([]);
const [equipmentStep, setEquipmentStep] = useState<'confirm' | 'select'>('confirm');
```

**handleNext 수정** — gymType 답변 후 장비시트 트리거:

```typescript
const handleNext = () => {
  // gymType 답변 직후: EquipmentDetailSheet 표시
  if (currentQuestion?.key === 'gymType' && !showEquipmentSheet) {
    setEquipmentStep('confirm');
    setShowEquipmentSheet(true);
    return; // 장비시트 닫힌 후 자동으로 step 진행
  }
  if (step < totalSteps - 1) {
    setStep((s) => s + 1);
  } else {
    handleFinish();
  }
};
```

**EquipmentDetailSheet 인라인 Modal**:

장비 카테고리 및 항목:

```
프리웨이트:  덤벨, 케틀벨, 바벨, EZ바, 트랩바
랙·벤치:    스쿼트랙, 플랫벤치, 인클라인벤치, 풀업바
케이블·머신: 케이블 크로스오버, 랫풀다운, 로우케이블, 렉프레스, 레그익스텐션, 레그컬
```

Modal 흐름:
1. **Step 'confirm'**: "세부 장비를 직접 지정할까요?" + "네, 직접 선택할게요" / "아니요, 기본으로 진행" 버튼
2. **Step 'select'**: 카테고리별 체크리스트, "완료" 버튼
3. 어느 단계에서든 닫으면 → `setShowEquipmentSheet(false)` → `setStep((s) => s + 1)`

Modal 닫기 핸들러:
```typescript
const handleEquipmentClose = (selectedList: string[]) => {
  setEquipmentList(selectedList);
  setAnswers((prev) => ({ ...prev, equipmentList: selectedList }));
  setShowEquipmentSheet(false);
  setStep((s) => s + 1); // gymType 다음 질문으로 진행
};
```

**handleFinish 수정** — equipmentList 조립:

```typescript
const equipmentListValue = equipmentList.length > 0 ? equipmentList : undefined;
const onboardingData: OnboardingData = {
  // ... 기존 필드
  gymType: (raw.gymType as GymType) ?? 'full_gym',
  equipmentList: equipmentListValue,
  // ...
};
```

#### ai-planner.ts buildPrompt 수정

```typescript
// 기존 genderLabel, goalLabel 등 이후에 추가
const gymLabel: Record<string, string> = {
  full_gym: '헬스장 (바벨, 덤벨, 머신 전체 이용 가능)',
  garage_gym: '홈짐 (바벨, 스쿼트랙, 덤벨 일부)',
  dumbbell_only: '덤벨·케틀벨만 사용 가능',
  bodyweight: '장비 없이 자체 중량만 가능',
};

const gymType = data.gymType ?? 'full_gym';
const gymSection = `
[운동 환경]
- 시설: ${gymLabel[gymType]}
${data.equipmentList && data.equipmentList.length > 0
  ? `- 보유 장비: ${data.equipmentList.join(', ')}\n- 위에 없는 장비가 필요한 종목은 절대 포함하지 마세요.`
  : ''}
`;
```

프롬프트 내 주입 위치: `[사용자 정보]` 섹션 하단, `[중요 지침]` 이전.

---

### 3.2 Module-2: ExplanationCard 상단 배치 + UX

#### ai-plan-result-screen.tsx 변경

**ExplanationCard 컴포넌트 수정**:

```typescript
function ExplanationCard({ plan, colors }: { plan: AIPlan; colors: any }) {
  const [open, setOpen] = useState(true); // false → true (기본 펼침)

  return (
    <View style={[exStyles.wrap, {
      backgroundColor: colors.card,
      borderWidth: 1.5,                 // 신규 accent border
      borderColor: colors.accent + '60', // accent 40% 투명도
    }]}>
      <TouchableOpacity
        style={exStyles.toggle}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[exStyles.toggleText, { color: colors.text }]}>
          이 플랜이 당신에게 맞는 이유  {/* 제목 변경 */}
        </Text>
        <Text style={[exStyles.chevron, { color: colors.accent }]}>
          {open ? '▲' : '▼'}  {/* chevron 색상 accent로 강조 */}
        </Text>
      </TouchableOpacity>
      {/* body 부분 기존 유지 */}
    </View>
  );
}
```

**workout 탭 렌더링 순서 변경** (line 666~672 구간):

```typescript
// 변경 전
{sortedWorkout.map((day) => (
  <WorkoutDayCard key={day.dayOfWeek} day={day} colors={colors} />
))}
<ExplanationCard plan={currentPlan} colors={colors} />

// 변경 후
<ExplanationCard plan={currentPlan} colors={colors} />
{sortedWorkout.map((day) => (
  <WorkoutDayCard key={day.dayOfWeek} day={day} onSwap={...} colors={colors} />
))}
```

---

### 3.3 Module-3: exercise-alternatives.ts

#### src/lib/exercise-alternatives.ts (신규)

```typescript
export interface ExerciseAlternatives {
  similar: string[];      // 동일 패턴 대체 (1~3개)
  alternatives: string[]; // 다른 선택지 (2~4개)
}

// 키: 정규화된 종목명 (공백 포함 허용)
export const EXERCISE_ALTERNATIVES: Record<string, ExerciseAlternatives> = {
  '벤치프레스': {
    similar: ['덤벨 벤치프레스', '푸쉬업'],
    alternatives: ['인클라인 덤벨 프레스', '체스트 플라이', '딥스'],
  },
  '스쿼트': {
    similar: ['고블릿 스쿼트', '박스 스쿼트'],
    alternatives: ['렉프레스', '불가리안 스플릿 스쿼트', '런지'],
  },
  '데드리프트': {
    similar: ['루마니안 데드리프트', '스티프레그 데드리프트'],
    alternatives: ['힙힌지 머신', '케이블 풀스루', '굿모닝'],
  },
  '오버헤드프레스': {
    similar: ['덤벨 숄더프레스', '아놀드프레스'],
    alternatives: ['랫풀다운', '사이드 레터럴 레이즈', '페이스풀'],
  },
  '바벨로우': {
    similar: ['덤벨 로우', '시티드 케이블 로우'],
    alternatives: ['랫풀다운', '풀업', 'TRX 로우'],
  },
  '풀업': {
    similar: ['친업', '어시스티드 풀업'],
    alternatives: ['랫풀다운', '시티드 케이블 로우', '덤벨 로우'],
  },
  '랫풀다운': {
    similar: ['케이블 로우', '시티드 케이블 로우'],
    alternatives: ['덤벨 로우', '풀업', 'TRX 로우'],
  },
  '딥스': {
    similar: ['벤치 딥스', '머신 딥스'],
    alternatives: ['클로즈그립 벤치프레스', '라잉 트라이셉스 익스텐션', '케이블 푸쉬다운'],
  },
  '바벨 컬': {
    similar: ['덤벨 컬', 'EZ바 컬'],
    alternatives: ['해머 컬', '케이블 컬', '인클라인 덤벨 컬'],
  },
  '레그프레스': {
    similar: ['해크 스쿼트', '불가리안 스플릿 스쿼트'],
    alternatives: ['스쿼트', '런지', '레그 익스텐션'],
  },
  '레그 익스텐션': {
    similar: ['머신 레그 익스텐션'],
    alternatives: ['스쿼트', '런지', '불가리안 스플릿 스쿼트'],
  },
  '레그 컬': {
    similar: ['라잉 레그컬', '시티드 레그컬'],
    alternatives: ['루마니안 데드리프트', '굿모닝', '케이블 킥백'],
  },
  '힙 쓰러스트': {
    similar: ['바벨 힙 쓰러스트', '글루트 브릿지'],
    alternatives: ['케이블 킥백', '도네키 킥', '루마니안 데드리프트'],
  },
  '케이블 크로스오버': {
    similar: ['펙덱 플라이', '덤벨 플라이'],
    alternatives: ['벤치프레스', '인클라인 덤벨 프레스', '딥스'],
  },
  '인클라인 벤치프레스': {
    similar: ['인클라인 덤벨프레스', '인클라인 푸쉬업'],
    alternatives: ['벤치프레스', '딥스', '케이블 플라이'],
  },
  '플랭크': {
    similar: ['사이드 플랭크', 'RKC 플랭크'],
    alternatives: ['데드버그', '할로우 바디', '팔라오프'],
  },
  '크런치': {
    similar: ['리버스 크런치', '케이블 크런치'],
    alternatives: ['레그레이즈', '데드버그', 'V업'],
  },
  '런지': {
    similar: ['워킹 런지', '리버스 런지'],
    alternatives: ['불가리안 스플릿 스쿼트', '스텝업', '레그프레스'],
  },
  '사이드 레터럴 레이즈': {
    similar: ['케이블 레터럴 레이즈'],
    alternatives: ['오버헤드프레스', '페이스풀', '밴드 레터럴 레이즈'],
  },
  '페이스풀': {
    similar: ['밴드 페이스풀', '케이블 페이스풀'],
    alternatives: ['리어 델트 플라이', '사이드 레터럴 레이즈', '바벨로우'],
  },
  '라잉 트라이셉스 익스텐션': {
    similar: ['덤벨 스컬크러셔', 'EZ바 스컬크러셔'],
    alternatives: ['케이블 푸쉬다운', '딥스', '클로즈그립 벤치프레스'],
  },
  '케이블 푸쉬다운': {
    similar: ['로프 트라이셉스 푸쉬다운'],
    alternatives: ['딥스', '오버헤드 트라이셉스 익스텐션', '클로즈그립 벤치프레스'],
  },
  '해머 컬': {
    similar: ['케이블 해머 컬'],
    alternatives: ['바벨 컬', '덤벨 컬', '인클라인 컬'],
  },
  '힙힌지': {
    similar: ['케이블 풀스루', '굿모닝'],
    alternatives: ['루마니안 데드리프트', '힙 쓰러스트', '데드리프트'],
  },
  '불가리안 스플릿 스쿼트': {
    similar: ['덤벨 스플릿 스쿼트'],
    alternatives: ['런지', '레그프레스', '스쿼트'],
  },
  '체스트 플라이': {
    similar: ['덤벨 플라이', '인클라인 플라이'],
    alternatives: ['케이블 크로스오버', '벤치프레스', '펙덱 플라이'],
  },
  '바벨 힙 쓰러스트': {
    similar: ['힙 쓰러스트', '글루트 브릿지'],
    alternatives: ['데드리프트', '루마니안 데드리프트', '케이블 킥백'],
  },
  '풀업': {
    similar: ['와이드그립 풀업', '친업'],
    alternatives: ['랫풀다운', '덤벨 로우', '케이블 로우'],
  },
};

// ─── 종목명 정규화 + lookup ────────────────────────────────────────────────────

/**
 * Gemini 출력 종목명(예: "바벨 벤치프레스")을 테이블 키와 매칭
 * 1. 정확 매칭 (full key match)
 * 2. 키가 입력에 포함되는지 (partial: 'bench' contains '벤치프레스')
 * 3. 입력이 키에 포함되는지
 */
export function findAlternatives(exerciseName: string): ExerciseAlternatives {
  // 1. 정확 매칭
  if (EXERCISE_ALTERNATIVES[exerciseName]) {
    return EXERCISE_ALTERNATIVES[exerciseName];
  }

  // 2. 부분 매칭
  const keys = Object.keys(EXERCISE_ALTERNATIVES);
  for (const key of keys) {
    if (exerciseName.includes(key) || key.includes(exerciseName)) {
      return EXERCISE_ALTERNATIVES[key];
    }
  }

  // 3. fallback
  return { similar: [], alternatives: [] };
}
```

---

### 3.4 Module-4: SwapExerciseSheet 컴포넌트 + 결과화면 연동

#### src/components/ai/SwapExerciseSheet.tsx (신규)

```typescript
interface SwapExerciseSheetProps {
  exerciseName: string;
  visible: boolean;
  onSelect: (newName: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

export function SwapExerciseSheet({
  exerciseName, visible, onSelect, onClose, colors
}: SwapExerciseSheetProps) {
  const { similar, alternatives } = findAlternatives(exerciseName);
  const allAlts = [...similar, ...alternatives];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* 반투명 backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' }}>
              {/* 핸들바 */}
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 }} />

              {/* 제목 */}
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                {exerciseName} 대체 종목
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
                비슷한 근육을 사용하는 종목을 선택하세요
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 유사 종목 섹션 */}
                {similar.length > 0 && (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      유사 종목
                    </Text>
                    {similar.map((name) => (
                      <TouchableOpacity
                        key={name}
                        onPress={() => onSelect(name)}
                        style={{ paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }}
                      >
                        <Text style={{ fontSize: 16, color: colors.text }}>{name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* 다른 종목 섹션 */}
                {alternatives.length > 0 && (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 16, marginBottom: 8 }}>
                      다른 종목으로 변경
                    </Text>
                    {alternatives.map((name) => (
                      <TouchableOpacity
                        key={name}
                        onPress={() => onSelect(name)}
                        style={{ paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }}
                      >
                        <Text style={{ fontSize: 16, color: colors.text }}>{name}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* fallback: 대체 없을 때 */}
                {allAlts.length === 0 && (
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 }}>
                    이 종목의 대체 운동 정보가 없습니다
                  </Text>
                )}
              </ScrollView>

              {/* 닫기 */}
              <TouchableOpacity
                onPress={onClose}
                style={{ alignItems: 'center', paddingVertical: 16 }}
              >
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
```

#### ai-plan-result-screen.tsx 수정 (Module-4 부분)

**WorkoutDayCard props 확장**:

```typescript
function WorkoutDayCard({
  day,
  colors,
  onSwap,    // ← 신규 optional
}: {
  day: WorkoutDay;
  colors: any;
  onSwap?: (exIdx: number, exerciseName: string) => void;
}) {
  // 종목 행에 교체 버튼 추가
  {day.exercises.map((ex, i) => (
    <View key={i} style={[wdStyles.exRow, ...]}>
      <View style={{ flex: 1 }}>
        <Text style={[wdStyles.exName, { color: colors.text }]}>{ex.name}</Text>
        <Text style={[wdStyles.exDetail, { color: colors.textSecondary }]}>
          {ex.sets}세트 × {ex.repsRange}회{ex.note ? `  · ${ex.note}` : ''}
        </Text>
      </View>
      {onSwap && (
        <TouchableOpacity
          onPress={() => onSwap(i, ex.name)}
          style={{ padding: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 12, color: colors.accent }}>교체</Text>
        </TouchableOpacity>
      )}
    </View>
  ))}
}
```

**결과화면 state 및 swap 핸들러**:

```typescript
// 신규 state
const [swapSheet, setSwapSheet] = useState<{
  visible: boolean;
  dayOfWeek: string;
  exIdx: number;
  exerciseName: string;
} | null>(null);

// swap 핸들러
const handleSwapOpen = (dayOfWeek: string, exIdx: number, exerciseName: string) => {
  setSwapSheet({ visible: true, dayOfWeek, exIdx, exerciseName });
};

const handleSwapSelect = async (newName: string) => {
  if (!swapSheet || !currentPlan) return;
  const updatedPlan: AIPlan = {
    ...currentPlan,
    weeklyWorkout: currentPlan.weeklyWorkout.map((day) =>
      day.dayOfWeek === swapSheet.dayOfWeek
        ? {
            ...day,
            exercises: day.exercises.map((ex, i) =>
              i === swapSheet.exIdx ? { ...ex, name: newName } : ex
            ),
          }
        : day
    ),
  };
  setCurrentPlan(updatedPlan);
  setSwapSheet(null);
  // Supabase 저장 (fire-and-forget)
  if (user?.id) saveAIPlanToSupabase(user.id, updatedPlan).catch(() => {});
};
```

**WorkoutDayCard 렌더링 수정**:

```typescript
{sortedWorkout.map((day) => (
  <WorkoutDayCard
    key={day.dayOfWeek}
    day={day}
    colors={colors}
    onSwap={(exIdx, exerciseName) => handleSwapOpen(day.dayOfWeek, exIdx, exerciseName)}
  />
))}

{/* SwapExerciseSheet */}
{swapSheet && (
  <SwapExerciseSheet
    exerciseName={swapSheet.exerciseName}
    visible={swapSheet.visible}
    onSelect={handleSwapSelect}
    onClose={() => setSwapSheet(null)}
    colors={colors}
  />
)}
```

---

### 3.5 Module-5: workout-session-screen Swap

**신규 state**:

```typescript
const [swapSheet, setSwapSheet] = useState<{
  visible: boolean;
  exIdx: number;
  exerciseName: string;
} | null>(null);
```

**종목 헤더에 교체 버튼 추가** (SessionExercise 렌더링 영역):

```typescript
// 종목 헤더 행에 교체 버튼
<TouchableOpacity
  onPress={() => setSwapSheet({ visible: true, exIdx, exerciseName: ex.name })}
  style={{ padding: 6 }}
>
  <Text style={{ fontSize: 12, color: colors.accent }}>교체</Text>
</TouchableOpacity>
```

**swap 핸들러** (세션에만 적용, 스토어 원본 불변):

```typescript
const handleSessionSwap = (newName: string) => {
  if (!swapSheet) return;
  setExercises((prev) =>
    prev.map((ex, i) =>
      i === swapSheet.exIdx ? { ...ex, name: newName } : ex
    )
  );
  setSwapSheet(null);
};
```

**SwapExerciseSheet 렌더링**:

```typescript
{swapSheet && (
  <SwapExerciseSheet
    exerciseName={swapSheet.exerciseName}
    visible={swapSheet.visible}
    onSelect={handleSessionSwap}
    onClose={() => setSwapSheet(null)}
    colors={colors}
  />
)}
```

> **세션 Swap 원칙**: `workout_sets`에 INSERT 시 교체된 종목명으로 저장됨. 원본 AI 플랜(`ai-plan-store`)은 변경 없음.

---

## 4. 데이터 흐름

```
온보딩 → gymType 선택 → EquipmentDetailSheet (선택적) → OnboardingData에 저장
→ Supabase ai_plans.onboarding_json (JSONB) 직렬화 저장

AI 플랜 결과 화면 → 교체 버튼 클릭 → SwapExerciseSheet
→ 선택 시 setCurrentPlan (previousPlan 유지) + saveAIPlanToSupabase

운동 세션 화면 → 교체 버튼 클릭 → SwapExerciseSheet
→ 선택 시 로컬 exercises 배열만 업데이트 (ai-plan-store 불변)
→ workout_sets INSERT 시 교체된 이름으로 DB 저장
```

---

## 5. 기존 사용자 호환성

| 상황 | 처리 방식 |
|------|---------|
| `gymType` 없는 기존 OnboardingData | `buildPrompt`에서 `data.gymType ?? 'full_gym'` fallback |
| 기존 플랜 교체 버튼 미노출 | `onSwap` prop이 undefined이면 버튼 숨김 (optional prop) |
| 기존 workout-session에서 exercises 상태 | 기존 SessionExercise 타입 그대로 사용, name 필드만 교체 |

---

## 6. 성공 기준 매핑

| 요구사항 | 설계 근거 | 검증 방법 |
|---------|---------|---------|
| ExplanationCard 최상단 펼침 상태 | `useState(true)` + 렌더링 순서 변경 | 결과화면 진입 시 즉시 확인 |
| gymType → 시설 맞춤 종목 | buildPrompt gym 섹션 + Gemini 지침 강화 | 맨몸 선택 후 플랜 재생성 확인 |
| AI 결과화면 교체 버튼 동작 | SwapExerciseSheet + setCurrentPlan | 교체 후 화면 업데이트 확인 |
| 세션 교체 → 기록에만 반영 | 로컬 state 교체 + DB 저장 시 교체명 사용 | workout_sets 테이블 확인 |
| 기존 사용자 크래시 없음 | gymType fallback + optional props | 기존 계정 로그인 테스트 |

---

## 7. 스키마 변경

**없음.** `OnboardingData`의 `gymType`/`equipmentList` 필드는:
- Zustand AsyncStorage에 JSON 직렬화
- Supabase `ai_plans.plan_json` (JSONB) 내 `onboarding_json`으로 저장
- 신규 필드이므로 기존 레코드와 하위 호환 (undefined = 무시)

---

## 8. 의존성

신규 npm 패키지 없음. 기존 React Native `Modal`, `ScrollView`, `TouchableOpacity` 활용.

---

## 9. 구현 리스크 재검토

| 리스크 | 대응 설계 |
|--------|---------|
| 종목명 불일치 | `findAlternatives` partial match + fallback 빈 배열 (graceful) |
| gymType 질문 후 장비시트로 흐름 단절 | `handleNext` 내 분기 + `handleEquipmentClose`에서 `setStep(s+1)` 자동 진행 |
| WorkoutDayCard의 기존 사용처 영향 | `onSwap` optional prop → 기존 호출부 변경 없음 |
| workout-session의 exercises 타입 | 기존 `SessionExercise` 사용, name 필드만 교체 |

---

## 10. 구현 순서 (Session Guide)

### Module Map

| 모듈 | 파일 | 예상 시간 |
|------|------|---------|
| M1-type | `ai-plan-store.ts` — GymType 타입 추가 | 5분 |
| M1-prompt | `ai-planner.ts` — buildPrompt gym 섹션 | 10분 |
| M1-onboarding | `ai-onboarding-screen.tsx` — gymType 질문 + EquipmentDetailSheet | 25분 |
| M2 | `ai-plan-result-screen.tsx` — ExplanationCard UX | 10분 |
| M3 | `src/lib/exercise-alternatives.ts` — 정적 테이블 | 20분 |
| M4 | `SwapExerciseSheet.tsx` + result-screen 연동 | 25분 |
| M5 | `workout-session-screen.tsx` — Swap 버튼 | 15분 |

### 권장 세션 계획

```
Session 1: M1 전체 (타입 + 프롬프트 + 온보딩) + M2 (레이아웃)
  → /pdca do ai-plan-trust-upgrade --scope M1,M2

Session 2: M3 + M4 + M5 (대체운동 + Swap UI)
  → /pdca do ai-plan-trust-upgrade --scope M3,M4,M5
```

### 11.3 Session Guide

**Session 1** (M1 + M2, ~50분):
1. `ai-plan-store.ts`: GymType 타입 + OnboardingData 필드 추가
2. `ai-planner.ts`: buildPrompt gym 섹션 추가
3. `ai-onboarding-screen.tsx`: gymType QUESTION 삽입 + EquipmentDetailSheet Modal
4. `ai-plan-result-screen.tsx`: ExplanationCard 상단 이동 + open=true + 제목/스타일

**Session 2** (M3 + M4 + M5, ~60분):
1. `src/lib/exercise-alternatives.ts`: 정적 테이블 (~30종목) 작성
2. `src/components/ai/SwapExerciseSheet.tsx`: 컴포넌트 작성
3. `ai-plan-result-screen.tsx`: WorkoutDayCard onSwap prop + SwapExerciseSheet 연동
4. `workout-session-screen.tsx`: Swap 버튼 + 핸들러 + SwapExerciseSheet 연동
