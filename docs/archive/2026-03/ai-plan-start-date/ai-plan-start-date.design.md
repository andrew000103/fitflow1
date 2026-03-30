# Design: ai-plan-start-date

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | weekStart 항상 이번 주 월요일 고정 → 오늘이 휴식일이면 즉시 운동 불가 |
| WHO | AI 플랜 생성/재생성 후 시작일을 원하는 날로 조정하고 싶은 사용자 |
| RISK | DatePicker 패키지 미사용 → 커스텀 주간 네비게이터로 대체 (신규 패키지 없음) |
| SUCCESS | 주간 네비게이터에서 날짜 선택 → weekStart 갱신 → 결과 화면 날짜 정확 표시 |
| SCOPE | `ai-plan-result-screen.tsx`, `ai-plan-store.ts`, `ai-planner.ts` 3개 파일 수정 |

---

## 1. 선택된 아키텍처: Option B (주간 내비게이터)

- 신규 패키지 없음
- `ai-plan-result-screen.tsx` 상단에 `StartDateSheet` 로컬 컴포넌트 추가
- 주 단위 이동 + 요일별 버튼 (운동일 하이라이트 / 휴식일 dim)

```
수정 파일 (3개):
  src/lib/ai-planner.ts               (getMondayOf 헬퍼 export 추가)
  src/stores/ai-plan-store.ts         (updateWeekStart 액션 추가)
  src/screens/ai/ai-plan-result-screen.tsx  (StartDateSheet + 버튼 추가)
```

---

## 2. FR-3: 헬퍼 & 스토어 (`ai-planner.ts`, `ai-plan-store.ts`)

### 2.1 `getMondayOf` 헬퍼 (`ai-planner.ts` export 추가)

```ts
// 임의의 날짜 문자열(YYYY-MM-DD 또는 Date) → 그 주 월요일 YYYY-MM-DD
export function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 이동
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
```

기존 `getThisMonday()`는 `getMondayOf(new Date())`로 교체 (하위 호환 유지, 내부만 변경).

### 2.2 `updateWeekStart` 액션 (`ai-plan-store.ts` 추가)

```ts
// AIPlanState 인터페이스에 추가
updateWeekStart: (weekStart: string) => void;

// 구현
updateWeekStart: (weekStart) =>
  set((state) => ({
    currentPlan: state.currentPlan
      ? { ...state.currentPlan, weekStart }
      : null,
  })),
```

---

## 3. FR-1: `StartDateSheet` 컴포넌트 (`ai-plan-result-screen.tsx` 파일 상단)

### 3.1 Props

```ts
function StartDateSheet({
  visible,
  currentWeekStart,  // 현재 plan.weekStart (YYYY-MM-DD)
  weeklyWorkout,     // WorkoutDay[] (운동일/휴식일 판별용)
  onConfirm,         // (newWeekStart: string) => void
  onClose,
  colors,
}: { ... })
```

### 3.2 내부 state

```ts
const [sheetOffset, setSheetOffset] = useState(0);
// 0 = currentWeekStart 기준 주, +1 = 다음 주, -1 = 이전 주
// 범위: -4 ~ +12 (최대 12주 뒤)

const [selectedDow, setSelectedDow] = useState<number | null>(null);
// 0=Sun, 1=Mon, ..., 6=Sat (JS getDay 기준)
// null = 아직 미선택
```

### 3.3 주간 날짜 계산

```ts
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_KO_SHORT = ['일', '월', '화', '수', '목', '금', '토'];
const DOW_OFFSET_FROM_MON = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

// sheetOffset이 바뀔 때마다 재계산
const sheetMonday = new Date(currentWeekStart + 'T00:00:00');
sheetMonday.setDate(sheetMonday.getDate() + sheetOffset * 7);

// 7일 배열: [월, 화, 수, 목, 금, 토, 일]
const weekDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(sheetMonday);
  d.setDate(sheetMonday.getDate() + i); // i=0→월, 1→화, ... 6→일
  const dow = d.getDay(); // JS요일(0=일)
  const dayKey = DAY_KEYS[dow];
  const workoutDay = weeklyWorkout.find(w => w.dayOfWeek === dayKey);
  return {
    date: d,
    dateLabel: `${d.getMonth()+1}/${d.getDate()}`,
    dow,
    dayKey,
    dayKo: DAY_KO_SHORT[dow],
    isRestDay: workoutDay?.isRestDay ?? true,
    focus: workoutDay?.focus ?? null,
  };
});

// 주간 범위 레이블
const rangeLabel = `${weekDays[0].dateLabel} ~ ${weekDays[6].dateLabel}`;
```

### 3.4 휴식일 충돌 처리

```ts
const selectedDay = selectedDow !== null
  ? weekDays.find(d => d.dow === selectedDow)
  : null;

const isConflict = selectedDay?.isRestDay ?? false;

// 다음 운동일 탐색 (선택일 기준 최대 7일 앞)
const nextWorkoutDay = useMemo(() => {
  if (!selectedDay) return null;
  for (let i = 1; i <= 7; i++) {
    const candidate = weekDays[(weekDays.findIndex(d => d.dow === selectedDow) + i) % 7];
    if (!candidate.isRestDay) return candidate;
  }
  return null;
}, [selectedDow, weekDays]);
```

### 3.5 확정 로직

```ts
const handleConfirm = () => {
  if (selectedDow === null) return;
  // 선택한 날짜의 주 월요일을 newWeekStart로
  const selectedDate = weekDays.find(d => d.dow === selectedDow)!.date;
  const monday = getMondayOf(selectedDate);
  onConfirm(monday);
};

const handleConfirmNext = () => {
  if (!nextWorkoutDay) return;
  const monday = getMondayOf(nextWorkoutDay.date);
  onConfirm(monday);
};
```

### 3.6 UI 구조

```
Modal (transparent, animationType: 'slide')
  └─ dim overlay
       └─ bottomSheet View
            ├─ 핸들바
            ├─ 타이틀: "운동 시작 주간 선택"
            ├─ 부제목: "운동일을 탭해서 그 주부터 시작하세요"
            │
            ├─ 주 네비게이터 Row
            │    [< 이전] | "3/23 ~ 3/29" | [다음 >]
            │
            ├─ 요일 버튼 Row (7개)
            │    각 버튼:
            │      - 요일 (월/화/수/목/금/토/일)
            │      - 날짜 (3/27)
            │      - 운동일: accent 색 테두리, 선택 시 배경 채움
            │      - 휴식일: dim (opacity 0.4)
            │      - 선택됨: accent 배경
            │
            ├─ [충돌 경고 — 선택이 휴식일일 때만 표시]
            │    "선택한 날은 휴식일입니다."
            │    "다음 운동일: {nextWorkoutDay.dateLabel} ({nextWorkoutDay.focus})"
            │    [다음 운동일로 설정] 버튼
            │
            ├─ [이 주로 설정] 기본 확정 버튼 (selectedDow !== null이면 활성)
            └─ [취소] 텍스트 버튼
```

---

## 4. FR-1 연결: AIPlanResult 헤더 변경

### 4.1 신규 state 추가

```ts
const [startDateSheetVisible, setStartDateSheetVisible] = useState(false);
```

### 4.2 weekLabel 수정

현재:
```ts
const weekLabel = (() => { ... })(); // plan.weekStart 기준
```

`plan.weekStart`가 store에서 업데이트되면 자동으로 재계산됨 (currentPlan 반응형).

### 4.3 헤더에 버튼 추가

```
[← 닫기]  |  이번 주 AI 플랜 (3/23~3/29)  |  [재생성]
             [시작일 변경]  ← 헤더 하단 서브텍스트 버튼
```

구현: `headerSub` Text를 `TouchableOpacity`로 교체 → `setStartDateSheetVisible(true)`

```tsx
// 변경 전
<Text style={[s.headerSub, { color: colors.textSecondary }]}>{weekLabel}</Text>

// 변경 후
<TouchableOpacity onPress={() => setStartDateSheetVisible(true)}>
  <Text style={[s.headerSub, { color: colors.accent }]}>
    {weekLabel}  ✎
  </Text>
</TouchableOpacity>
```

### 4.4 onConfirm 처리

```ts
const handleStartDateConfirm = (newWeekStart: string) => {
  updateWeekStart(newWeekStart);
  setStartDateSheetVisible(false);
  // Supabase 비동기 업데이트 (결과 무시)
  if (user?.id && currentPlan) {
    supabase
      .from('ai_plans')
      .update({ week_start: newWeekStart })
      .eq('id', currentPlan.id)
      .then(() => {});
  }
};
```

---

## 5. StyleSheet 추가 항목 (`ai-plan-result-screen.tsx`)

```ts
// 주간 네비게이터
weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
weekNavBtn: { padding: 8 },
weekNavBtnText: { fontSize: 20, color: colors.accent },
weekNavLabel: { fontSize: 15, fontWeight: '600', color: colors.text },

// 요일 버튼 행
dowRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
dowBtn: {
  flex: 1, alignItems: 'center', paddingVertical: 10,
  borderRadius: 10, borderWidth: 1.5,
},
dowBtnWorkout: { borderColor: colors.accent },
dowBtnRest: { borderColor: colors.border, opacity: 0.4 },
dowBtnSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
dowBtnLabel: { fontSize: 12, fontWeight: '600' },    // 월/화/수...
dowBtnDate: { fontSize: 10, marginTop: 2 },           // 3/27
dowBtnLabelSelected: { color: '#fff' },
dowBtnLabelWorkout: { color: colors.accent },
dowBtnLabelRest: { color: colors.textSecondary },

// 충돌 경고
conflictWrap: { backgroundColor: colors.accentMuted, borderRadius: 10, padding: 12, marginBottom: 16 },
conflictText: { fontSize: 13, color: colors.text, marginBottom: 8 },
conflictNextBtn: { alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.accent },
conflictNextText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
```

---

## 6. 구현 가이드 (Module Map)

| 모듈 | 파일 | 변경 유형 | 예상 라인 |
|------|------|----------|----------|
| M1: `getMondayOf` 헬퍼 export | `ai-planner.ts` | 함수 추가 + `getThisMonday` 내부 수정 | ~10줄 |
| M2: `updateWeekStart` 스토어 액션 | `ai-plan-store.ts` | 인터페이스 + 구현 추가 | ~15줄 |
| M3: `StartDateSheet` 컴포넌트 | `ai-plan-result-screen.tsx` | 로컬 컴포넌트 추가 (파일 상단) | ~120줄 |
| M4: 헤더 weekLabel 버튼 교체 + 연결 | `ai-plan-result-screen.tsx` | JSX 수정 + state + onConfirm | ~20줄 |

**권장 세션 순서**: M1 → M2 → M3 → M4

---

## 7. 성공 기준

- [ ] M1: `getMondayOf(date)` 임의 날짜 → 해당 주 월요일 반환 정확
- [ ] M2: `updateWeekStart` 호출 시 `currentPlan.weekStart` 갱신, persist 유지
- [ ] M3: 주간 네비게이터 < / > 클릭 시 주간 이동, 요일 버튼 운동/휴식 시각 구분
- [ ] M3: 휴식일 탭 시 충돌 경고 + 다음 운동일 표시, "다음 운동일로 설정" 동작
- [ ] M4: `weekLabel` 탭 → 시트 오픈, 확정 후 헤더 날짜 범위 즉시 갱신
