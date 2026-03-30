# Design: ai-onboarding-improvements

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 1RM 모르는 사용자가 중량 입력을 포기하거나, 재생성 시 설문 선택지 없는 UX 마찰 존재 |
| WHO | 헬스 입문~중급자, 기존 플랜 보유 후 재생성 원하는 사용자 |
| RISK | 1RM 계산기 모달이 흐름을 과도하게 복잡하게 만들 수 있음 → 최소한의 UI로 제한 |
| SUCCESS | 강도 프로필 입력 완료율 향상, 재생성 경로 선택 가능, 정체기 질문 자연어 개선 |
| SCOPE | `ai-onboarding-screen.tsx` + `ai-plan-result-screen.tsx` 2개 파일만 수정 |

---

## 1. 선택된 아키텍처: Option C (Pragmatic Balance)

각 파일 상단에 로컬 컴포넌트로 선언. 별도 파일 없음.

```
수정 파일 (2개):
  src/screens/ai/ai-onboarding-screen.tsx
  src/screens/ai/ai-plan-result-screen.tsx
```

---

## 2. FR-1: 1RM 계산기 (`ai-onboarding-screen.tsx`)

### 2.1 데이터 흐름

```
isStrengthStep 화면
  └─ 각 종목 행
       ├─ TextInput (현재 중량)          ← 기존
       └─ TouchableOpacity "1RM 계산"   ← 신규
            └─ onPress → setRmCalcTarget(ex.id)

rmCalcTarget !== null
  └─ OneRMCalcModal 렌더링
       ├─ useState: rmWeight (무게), rmReps (횟수)
       ├─ 계산: epley1RM = rmWeight × (1 + rmReps / 30)
       ├─ '이 값으로 입력' → setStrengthInputs(prev → { ...prev, [rmCalcTarget]: String(Math.round(epley1RM)) })
       └─ 닫기 → setRmCalcTarget(null)
```

### 2.2 신규 state

```tsx
// isStrengthStep 화면에서 추가
const [rmCalcTarget, setRmCalcTarget] = useState<string | null>(null);
// rmCalcTarget: MAIN_EXERCISES의 ex.id ('squat' | 'bench' | 'deadlift' | 'ohp' | 'row')
```

### 2.3 `OneRMCalcModal` 컴포넌트 설계

```tsx
function OneRMCalcModal({
  exerciseLabel,   // ex: '스쿼트'
  visible,
  onClose,
  onApply,         // (rounded1RM: number) => void
  colors,
}: {
  exerciseLabel: string;
  visible: boolean;
  onClose: () => void;
  onApply: (value: number) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
})
```

**내부 state**: `rmWeight: string`, `rmReps: string`

**1RM 계산식** (Epley):
```
const w = parseFloat(rmWeight);
const r = parseInt(rmReps, 10);
const valid = w > 0 && r > 0 && r <= 30;  // r > 30이면 공식 신뢰도 낮음
const estimated = valid ? Math.round(w * (1 + r / 30)) : null;
```

**경고 조건**: reps > 30이면 "횟수는 1~30 사이로 입력해주세요" 인라인 텍스트

**UI 구조** (React Native `Modal`):
```
Modal (transparent, animationType: 'slide')
  └─ dim overlay (TouchableWithoutFeedback → onClose)
       └─ bottomSheet View
            ├─ 타이틀: "{exerciseLabel} 1RM 계산기"
            ├─ 설명: "Epley 공식: 무게 × (1 + 횟수/30)"
            ├─ Row: [무게 TextInput] kg × [횟수 TextInput] 회
            ├─ 추정 1RM 표시: "추정 1RM: {estimated} kg" (or 빈칸)
            ├─ 경고 텍스트 (reps > 30일 때)
            ├─ '이 값으로 입력' Button (disabled when estimated === null)
            └─ '취소' TextButton
```

### 2.4 강도 입력 행 변경 (`isStrengthStep` 렌더)

```
기존:
  [종목명]  [TextInput kg]

변경:
  [종목명]  [TextInput kg]  [1RM 계산 버튼]
```

버튼 스타일: 작은 보조 텍스트 버튼 (`fontSize: 12`, `color: colors.accent`)

---

## 3. FR-2: 플랜 재생성 선택 (`ai-plan-result-screen.tsx`)

### 3.1 현재 상태 분석

- 이미 `handleRegenerate()` 함수 존재 (line 284): `onboardingData`로 직접 `generateAIPlan` 호출
- 이미 헤더에 "재생성" `TouchableOpacity` 존재 (line 344-352)

### 3.2 변경 방향

"재생성" 버튼의 `onPress`를 `handleRegenerate` 직접 호출 → `setRegenSheetVisible(true)`로 교체

### 3.3 신규 state

```tsx
const [regenSheetVisible, setRegenSheetVisible] = useState(false);
```

### 3.4 `RegenBottomSheet` 컴포넌트 설계

```tsx
function RegenBottomSheet({
  visible,
  hasOnboardingData,  // onboardingData !== null
  onRegenSame,        // 기존 정보로 재생성
  onRegenNew,         // 새로 설문하기
  onClose,
  colors,
}: { ... })
```

**UI 구조** (React Native `Modal`):
```
Modal (transparent, animationType: 'slide')
  └─ dim overlay
       └─ bottomSheet View
            ├─ 핸들바 (시각적 드래그 힌트)
            ├─ 타이틀: "플랜 다시 만들기"
            ├─ 설명: "어떻게 새 플랜을 만들까요?"
            ├─ Option Row 1: "기존 정보로 재생성"
            │     설명: "이전에 입력한 정보 그대로 새 플랜 생성"
            │     disabled if !hasOnboardingData
            ├─ Option Row 2: "새로 설문하기"
            │     설명: "질문에 다시 답해서 더 정확한 플랜 만들기"
            └─ '취소' TextButton
```

### 3.5 각 옵션 동작

**기존 정보로 재생성** (`onRegenSame`):
```
1. setRegenSheetVisible(false)
2. handleRegenerate() 기존 로직 그대로 (이미 onboardingData 사용)
```

**새로 설문하기** (`onRegenNew`):
```
1. setRegenSheetVisible(false)
2. navigation.navigate('AIOnboarding')
```

---

## 4. FR-3: 정체기 질문 개선 (`ai-onboarding-screen.tsx`)

### 4.1 변경 내용 (QUESTIONS 배열)

```diff
- question: '이전에 비슷한 목표에서 정체기를 겪은 적 있나요?',
+ question: '운동이나 식단을 꾸준히 하다가 막힌 적이 있나요?',

  options: [
    { label: '없어요', value: '없음' },          // 동일
-   { label: '식단이 문제였어요', value: '식단 유지 실패' },
+   { label: '식단 관리가 힘들었어요', value: '식단 유지 실패' },
-   { label: '운동이 지루해졌어요', value: '운동 루틴 정체' },
+   { label: '루틴이 지겨워졌어요', value: '운동 루틴 정체' },
-   { label: '의지력이 떨어졌어요', value: '동기 부족' },
+   { label: '의욕이 떨어졌어요', value: '동기 부족' },
  ],
```

`value` 값은 그대로 유지 → Supabase 저장 데이터 및 AI 프롬프트 호환성 보장.

---

## 5. StyleSheet 추가 항목

### 5.1 ai-onboarding-screen.tsx 추가 스타일

```ts
rmCalcBtn: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: colors.accent,
},
rmCalcBtnText: {
  fontSize: 11,
  color: colors.accent,
  fontWeight: '600',
},
// Modal 내부
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'flex-end',
},
modalSheet: {
  backgroundColor: colors.card,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 24,
  paddingBottom: 40,
},
modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
modalDesc:  { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
rmRow:      { flexDirection: 'row', gap: 12, marginBottom: 20 },
rmInput:    { flex: 1, fontSize: 24, fontWeight: '700', textAlign: 'center',
              borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 8, color: colors.text },
rmResult:   { fontSize: 18, fontWeight: '700', color: colors.accent, textAlign: 'center', marginBottom: 20 },
rmWarn:     { fontSize: 13, color: colors.error ?? '#ff4444', textAlign: 'center', marginBottom: 12 },
```

### 5.2 ai-plan-result-screen.tsx 추가 스타일

```ts
// 기존 regenBtn 스타일 유지 (변경 없음)
// Modal 내부 스타일 추가
sheetOption: {
  paddingVertical: 18,
  paddingHorizontal: 4,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: colors.border,
},
sheetOptionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
sheetOptionDesc:  { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
sheetCancel:      { paddingVertical: 16, alignItems: 'center' },
sheetCancelText:  { fontSize: 15, color: colors.textSecondary },
handleBar:        { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20 },
```

---

## 6. 구현 가이드 (Module Map)

| 모듈 | 파일 | 변경 유형 | 예상 라인 |
|------|------|----------|----------|
| M1: FR-3 정체기 질문 | `ai-onboarding-screen.tsx` | 텍스트 수정 (4줄) | ~5줄 |
| M2: FR-1 1RM 모달 컴포넌트 | `ai-onboarding-screen.tsx` | 함수 추가 (상단) | ~80줄 |
| M3: FR-1 강도 입력 행 버튼 | `ai-onboarding-screen.tsx` | JSX 수정 + state 추가 | ~20줄 |
| M4: FR-2 재생성 바텀시트 컴포넌트 | `ai-plan-result-screen.tsx` | 함수 추가 (상단) | ~70줄 |
| M5: FR-2 헤더 버튼 교체 | `ai-plan-result-screen.tsx` | onPress 교체 + state 추가 | ~10줄 |

**권장 세션 순서**: M1 → M2 → M3 → M4 → M5

---

## 7. 성공 기준

- [ ] M1: `plateauHistory` 질문/선지 자연어 표현, value 동일
- [ ] M2: `OneRMCalcModal` 렌더 시 Epley 공식 실시간 계산, 30회 초과 경고
- [ ] M3: 각 종목 행에 '1RM 계산' 버튼 표시, 탭 → 해당 종목 모달, '이 값으로 입력' → 해당 필드 자동 채움
- [ ] M4: `RegenBottomSheet` 렌더, 2개 옵션 정상 표시
- [ ] M5: 헤더 "재생성" 탭 → 바텀시트 표시, "기존 정보로 재생성" → 직접 재생성, "새로 설문하기" → AIOnboarding 이동
