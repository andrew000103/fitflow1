# AI 맞춤 플랜 생성 — Design Spec

> 작성일: 2026-03-24
> 아키텍처: Option C (실용적 균형)
> 단계: Design (PDCA)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 정체기(벌크/다이어트) 돌파 + 운동 입문자 길잡이. 기존 앱에 AI 개인화 가치 추가 |
| WHO | Persona A(정체기 벌커, 숫자 중심 피드백 기대) / Persona B(입문 다이어터, 쉬운 코치 느낌 기대) |
| RISK | LLM JSON 불안정, 의료 책임, 잘못된 입력값 → 엉터리 계획, PII 전송 |
| SUCCESS | 처음 쓰는 사람이 5분 안에 계획을 받고 이해할 수 있음 |
| SCOPE | 온보딩 + 플랜 생성 + 결과 화면 + 홈 카드. 챗봇/웨어러블/사진 인식 제외 |

---

## 1. 아키텍처 개요 (Option C)

```
root-navigator.tsx
├── AuthNavigator (기존)
└── MainNavigator (기존 + 변경)
    ├── AI 동의 모달 스택 (신규: 로그인 직후 최초 1회)
    │   ├── AIConsentScreen
    │   └── AIOnboardingScreen
    └── 기존 탭 (홈/운동/식단/프로필)
        └── 홈 탭: AI 플랜 카드 → AIPlanResultScreen (모달)
```

### 파일 목록

| 구분 | 경로 | 역할 |
|------|------|------|
| 신규 | `src/screens/ai/ai-consent-screen.tsx` | 동의 + 데이터 활용 범위 설명 |
| 신규 | `src/screens/ai/ai-onboarding-screen.tsx` | Phase1 + Phase2 질문 수집 |
| 신규 | `src/screens/ai/ai-plan-result-screen.tsx` | 플랜 결과 표시 (운동+식단+이유) |
| 신규 | `src/screens/ai/ai-plan-weekly-screen.tsx` | 주간 재생성 결과 확인 화면 |
| 신규 | `src/stores/ai-plan-store.ts` | AI 플랜 상태 관리 (Zustand) |
| 신규 | `src/lib/ai-planner.ts` | LLM API 호출 + 프롬프트 관리 |
| 수정 | `src/navigation/root-navigator.tsx` | 동의 여부 체크 → 온보딩 모달 분기 |
| 수정 | `src/navigation/main-navigator.tsx` | AI 모달 스택 추가 |
| 수정 | `src/screens/home/home-screen.tsx` | AI 플랜 카드 추가 |

---

## 2. 네비게이션 설계

### 2-1. 타입 정의 추가 (`src/types/navigation.ts`)

```typescript
// 기존 MainTabParamList에 변경 없음
// 신규 모달 스택 파라미터 추가

export type AIModalParamList = {
  AIConsent: undefined;
  AIOnboarding: undefined;
  AIPlanResult: { planId?: string };   // planId 없으면 신규 생성
  AIPlanWeekly: { weekStart: string };
};
```

### 2-2. root-navigator.tsx 변경

```typescript
// 로직 추가: 로그인 완료 후 ai_consent가 null인 사용자 → AIConsent 먼저 보여줌
// MainNavigator에 isAIOnboardingRequired prop 전달
```

### 2-3. main-navigator.tsx 변경

```typescript
// 기존 Tab.Navigator를 Stack.Navigator로 감싸기
// AI 모달 스크린을 Stack에 추가 (presentation: 'modal')
```

---

## 3. 화면별 UX 명세

---

### Screen 1 — AIConsentScreen

**경로**: `src/screens/ai/ai-consent-screen.tsx`
**진입**: 로그인 완료 직후 (ai_consent = null 유저만), 또는 프로필 > AI 기능 켜기

#### 레이아웃

```
┌─────────────────────────────────────┐
│  ← (닫기)                           │
│                                     │
│  ✨                                 │
│  AI가 나만의 플랜을                  │
│  만들어드릴게요                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ AI가 활용하는 데이터         │    │
│  │                             │    │
│  │ • 입력하신 신체 정보         │    │
│  │ • 최근 7일 운동 기록         │    │
│  │ • 최근 7일 식단 기록         │    │
│  │ • 체중 변화 추이             │    │
│  │                             │    │
│  │ ※ 이름 등 개인 식별 정보는   │    │
│  │   AI에 전달되지 않습니다     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  AI 플랜 시작하기  ← 동의    │    │
│  └─────────────────────────────┘    │
│                                     │
│  지금은 건너뛰기 (나중에 켜기 가능)   │
│                                     │
└─────────────────────────────────────┘
```

#### 동작
- **[AI 플랜 시작하기]**: `user_profiles.ai_consent = true` 저장 → AIOnboarding으로 이동
- **[지금은 건너뛰기]**: `user_profiles.ai_consent = false` 저장 → 홈으로 이동
- 닫기(×): 건너뛰기와 동일 처리

---

### Screen 2 — AIOnboardingScreen

**경로**: `src/screens/ai/ai-onboarding-screen.tsx`
**진입**: AIConsentScreen 동의 후

#### 레이아웃 — 스텝 인디케이터 + 단일 질문 방식

```
┌─────────────────────────────────────┐
│  ←   ●●●●●○○  (7/12)              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │           Question Card     │    │
│  │                             │    │
│  │  주요 목표가 무엇인가요?      │    │
│  │                             │    │
│  │  ○ 체중 감량                │    │
│  │  ● 근육 증가                │    │  ← 선택된 상태
│  │  ○ 체형 유지                │    │
│  │  ○ 건강 개선                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         다음 →              │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### 질문 순서 및 입력 타입

| Step | 질문 | 입력 타입 | 기존 프로필 pre-fill |
|------|------|-----------|---------------------|
| 1 | 주요 목표 | 단일 선택 (4개) | - |
| 2 | 성별 | 단일 선택 (3개) | user_profiles.gender |
| 3 | 나이 | 숫자 슬라이더 (15~80) | user_profiles.age |
| 4 | 키 (cm) | 숫자 입력 | user_profiles.height |
| 5 | 체중 (kg) | 숫자 입력 | body_weights 최근값 |
| 6 | 운동 경험 | 단일 선택 (3개) | - |
| 7 | 주당 운동 가능 일수 | 칩 선택 (1~7) | - |
| 8 | 식이 제한 | 다중 선택 (5개) | - |
| — | Phase 2 구분선 (스킵 가능 안내) | 안내 카드 | - |
| 9 | 운동 다음날 피로도 | 단일 선택 (3개) | - |
| 10 | 습관적 과식 | 단일 선택 (3개) | - |
| 11 | 수면 회복 느낌 | 단일 선택 (3개) | - |
| 12 | 이전 정체기 경험 | 단일 선택 + 텍스트 입력 | - |

#### Phase 2 구분 카드 (Step 8 → 9 사이)

```
┌─────────────────────────────────────┐
│  💡 선택 사항                        │
│                                     │
│  다음 4가지를 추가로 알려주시면      │
│  AI 플랜의 정확도가 높아집니다.      │
│                                     │
│  [건너뛰고 플랜 받기]  [계속 입력]   │
└─────────────────────────────────────┘
```

#### 입력값 검증 (안전 가드레일)

```typescript
// 이 체크는 온보딩 완료 시 실행
function validateInputs(data: OnboardingData): SafetyCheckResult {
  const { goal, gender, weight, height, targetWeeklyLoss } = data;
  const bmi = weight / ((height / 100) ** 2);

  if (goal === 'weight_loss' && bmi < 17.5) {
    return { blocked: true, reason: 'underweight_loss_risk' };
  }
  if (goal === 'weight_loss' && targetWeeklyLoss > 1) {
    return { blocked: true, reason: 'aggressive_deficit' };
  }
  return { blocked: false };
}
```

#### 위험 목표 차단 화면

```
┌─────────────────────────────────────┐
│  ⚠️  AI 플랜을 생성할 수 없습니다   │
│                                     │
│  입력하신 목표는 건강에 위험할 수    │
│  있어 AI 플랜 생성이 제한됩니다.    │
│                                     │
│  • 현재 BMI(16.8)가 저체중 기준     │
│    미만입니다                        │
│  • 이 상태에서 감량은 근손실과       │
│    영양 결핍 위험이 있습니다         │
│                                     │
│  전문 영양사 또는 의사와 상담 후     │
│  목표를 설정해주세요.               │
│                                     │
│  [목표 수정하기]  [닫기]            │
└─────────────────────────────────────┘
```

---

### Screen 2-5 — AI 생성 중 (인라인 로딩)

온보딩 완료 후 AIPlanResultScreen으로 이동하면서 로딩 상태 표시.
별도 화면 없이 AIPlanResultScreen 내 로딩 인디케이터로 처리.

```
┌─────────────────────────────────────┐
│                                     │
│     🤖                             │
│                                     │
│  AI가 플랜을 만들고 있어요...        │
│                                     │
│  • 신체 정보 분석 중 ✓              │
│  • 목표 칼로리 계산 중 ✓            │
│  • 운동 계획 구성 중 ...            │
│                                     │
│  (애니메이션 진행 바)                │
│                                     │
└─────────────────────────────────────┘
```

---

### Screen 3 — AIPlanResultScreen

**경로**: `src/screens/ai/ai-plan-result-screen.tsx`
**진입**: 온보딩 완료 후, 또는 홈 AI 카드 탭

#### 레이아웃 — 탭 구조 (운동 / 식단)

```
┌─────────────────────────────────────┐
│  ←   이번 주 AI 플랜    ⟳ 재생성   │
│                                     │
│  [운동 계획]  [식단 계획]           │  ← 탭
│  ─────────────────                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🎯 목표                    │    │
│  │  칼로리 2,650kcal            │    │
│  │  단백질 130g  탄수 290g  지방 70g│    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  월요일  상체 (가슴/삼두)    │    │
│  │  • 벤치프레스 4×6~8         │    │
│  │  • 인클라인 덤벨 프레스 3×10 │    │
│  │  • 케이블 플라이 3×12~15     │    │
│  │  • 트라이셉스 푸시다운 3×12  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  화요일  하체 (대퇴/햄스트링)│    │
│  │  • 스쿼트 4×5               │    │
│  │  • 루마니안 데드 3×8~10     │    │
│  │  ...                        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  [왜 이 플랜인가요?] ▼      │    │  ← 접기/펼치기
│  │  (펼치면 상세 이유 표시)     │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

#### 식단 탭 레이아웃

```
┌─────────────────────────────────────┐
│  [운동 계획]  [식단 계획]           │
│  ─────────────────────              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  📊 하루 목표               │    │
│  │  2,650 kcal                 │    │
│  │  단백질 ████░░ 130/150g     │    │
│  │  탄수화물 ████░░ 290/300g   │    │
│  │  지방 ████░░ 70/80g         │    │
│  └─────────────────────────────┘    │
│                                     │
│  아침 (07:00~09:00)                 │
│  • 닭가슴살 삶은 것 150g            │
│  • 고구마 100g                      │
│  • 달걀 2개                         │
│  약 480kcal / 단 45g / 탄 38g / 지 12g│
│                                     │
│  점심 (12:00~13:00)                 │
│  • 현미밥 200g                      │
│  • 두부구이 100g                    │
│  • 브로콜리 150g                    │
│  약 620kcal / 단 35g / 탄 82g / 지 10g│
│                                     │
│  ...                                │
│                                     │
│  ⚠️  이 식단은 예시이며 정확한      │
│  영양 분석을 위해 식단 탭에서       │
│  직접 기록하세요                    │
│                                     │
└─────────────────────────────────────┘
```

#### 이유 설명 카드 (펼친 상태)

```
┌─────────────────────────────────────┐
│  [왜 이 플랜인가요?] ▲              │
│                                     │
│  📊 당신의 수치 분석                │
│  • 추정 TDEE: 2,380kcal             │
│  • 근육 증가 목표 → +270kcal 서플러스│
│  • 단백질: 체중 1kg당 1.8g → 130g  │
│                                     │
│  📈 지난 주 데이터 (동의 사용자만)  │
│  • 평균 섭취 칼로리: 2,100kcal      │
│  • 현재 약 280kcal 부족 상태        │
│  • 운동 완료율: 5/7일               │
│                                     │
│  📚 참고 기준                       │
│  • 단백질 목표: 근비대 메타분석     │
│    (Schoenfeld & Grgic, 2018)       │
│  • 칼로리 서플러스: NSCA 가이드라인  │
│                                     │
│  ⚠️ 이 계획은 의료적 조언이 아닙니다│
└─────────────────────────────────────┘
```

---

### Screen 4 — AIPlanWeeklyScreen

**경로**: `src/screens/ai/ai-plan-weekly-screen.tsx`
**진입**: 주간 재생성 알림 → 홈 카드

```
┌─────────────────────────────────────┐
│  ←   새로운 주간 플랜               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  지난 주 vs 이번 주 변경사항 │    │
│  │                             │    │
│  │  • 목표 칼로리: 2,650 → 2,700│    │
│  │  • 운동 볼륨 소폭 증가      │    │
│  │  (지난 주 완료율 100% 반영)  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  [이번 주 플랜 적용하기]    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [지난 주 플랜 유지]                │
│                                     │
└─────────────────────────────────────┘
```

---

### 홈 화면 AI 카드 (home-screen.tsx 수정)

#### AI 미동의 상태

```
┌─────────────────────────────────────┐
│  ✨ AI 맞춤 플랜                    │
│  나에게 딱 맞는 식단·운동 계획을    │
│  AI가 만들어드립니다               │
│                  [시작하기 →]       │
└─────────────────────────────────────┘
```

#### AI 동의 + 플랜 없음

```
┌─────────────────────────────────────┐
│  🤖 AI 플랜 준비 중                 │
│  정보를 입력하면 맞춤 계획을        │
│  생성합니다                         │
│                [플랜 생성하기 →]    │
└─────────────────────────────────────┘
```

#### AI 플랜 활성 상태

```
┌─────────────────────────────────────┐
│  📋 이번 주 AI 플랜    3/25~3/31    │
│                                     │
│  운동  월·수·금·토 (4일)            │
│  목표  2,650kcal · 단 130g          │
│                                     │
│  오늘: 상체 (가슴/삼두)  [보기 →]  │
└─────────────────────────────────────┘
```

#### 정체기 감지 배너 (P2)

```
┌─────────────────────────────────────┐
│  ⚡ 정체기가 감지됐어요             │
│  3주 연속 체중 변화 없음            │
│  AI가 새로운 플랜을 제안합니다      │
│                  [새 플랜 보기 →]   │
└─────────────────────────────────────┘
```

---

## 4. 상태 관리 — ai-plan-store.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export interface OnboardingData {
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health';
  gender: 'male' | 'female' | 'undisclosed';
  age: number;
  height: number;       // cm
  weight: number;       // kg
  experience: 'beginner' | 'intermediate' | 'advanced';
  workoutDaysPerWeek: number;
  dietaryRestrictions: string[];
  // Phase 2 (optional)
  recoveryLevel?: 'easy' | 'moderate' | 'hard';
  overeatingHabit?: 'rarely' | 'sometimes' | 'often';
  sleepQuality?: 'good' | 'average' | 'poor';
  plateauHistory?: string;
}

export interface AIPlan {
  id: string;
  weekStart: string;   // ISO date (Monday)
  targetCalories: number;
  targetMacros: { protein: number; carbs: number; fat: number };
  weeklyWorkout: WorkoutDay[];
  weeklyDiet: DietDay[];
  explanation: {
    summary: string;
    detail: string;
    sources: string[];
  };
  safetyFlags: string[];
  generatedAt: string;
}

export interface WorkoutDay {
  dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  isRestDay: boolean;
  focus?: string;       // "상체 (가슴/삼두)"
  exercises: {
    name: string;
    sets: number;
    repsRange: string;   // "6~8"
    note?: string;
  }[];
}

export interface DietDay {
  targetCalories: number;
  meals: {
    timing: string;      // "아침 (07:00~09:00)"
    foods: string[];
    calories: number;
    macros: { protein: number; carbs: number; fat: number };
  }[];
}

interface AIPlanState {
  onboardingData: OnboardingData | null;
  currentPlan: AIPlan | null;
  isGenerating: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;

  setOnboardingData: (data: OnboardingData) => void;
  setCurrentPlan: (plan: AIPlan) => void;
  setGenerating: (v: boolean) => void;
  setError: (msg: string | null) => void;
  clearPlan: () => void;
}

export const useAIPlanStore = create<AIPlanState>()(
  persist(
    (set) => ({
      onboardingData: null,
      currentPlan: null,
      isGenerating: false,
      error: null,
      hasCompletedOnboarding: false,

      setOnboardingData: (data) =>
        set({ onboardingData: data, hasCompletedOnboarding: true }),
      setCurrentPlan: (plan) => set({ currentPlan: plan, error: null }),
      setGenerating: (v) => set({ isGenerating: v }),
      setError: (msg) => set({ error: msg, isGenerating: false }),
      clearPlan: () => set({ currentPlan: null }),
    }),
    {
      name: 'ai-plan-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## 5. AI 서비스 레이어 — ai-planner.ts

```typescript
// src/lib/ai-planner.ts
// LLM 엔진: Google Gemini REST API (gemini-2.5-flash) — 2026-03-25 업데이트

import { OnboardingData, AIPlan } from '../stores/ai-plan-store';
// SDK 없이 fetch() 직접 호출 (EXPO_PUBLIC_GEMINI_API_KEY 사용)

// ─── 히스토리 요약 타입 ────────────────────────────────────────────────────────
interface UserHistorySummary {
  avgDailyCalories: number;
  workoutCompletionRate: number;   // 0~1
  weightTrend: number;             // kg/week (음수=감소)
  recentWeight: number;
}

// ─── 안전 가드레일 ────────────────────────────────────────────────────────────
export function validateSafety(data: OnboardingData): {
  blocked: boolean;
  reason?: string;
  message?: string;
} {
  const bmi = data.weight / ((data.height / 100) ** 2);
  const minCalories = data.gender === 'female' ? 1200 : 1500;

  if (data.goal === 'weight_loss' && bmi < 17.5) {
    return {
      blocked: true,
      reason: 'underweight_loss_risk',
      message:
        `현재 BMI(${bmi.toFixed(1)})가 저체중 기준 미만입니다.\n` +
        '이 상태에서 감량은 근손실과 영양 결핍 위험이 있습니다.\n' +
        '전문 영양사 또는 의사와 상담 후 목표를 설정해주세요.',
    };
  }

  return { blocked: false };
}

// ─── 히스토리 요약 (동의자 한정) ──────────────────────────────────────────────
export async function fetchUserHistorySummary(
  userId: string
): Promise<UserHistorySummary | null> {
  // Supabase에서 최근 7일 데이터 집계
  // workout_sessions, meal_items, body_weights 쿼리
  // 이름 등 PII 미포함, 집계값만 반환
  try {
    // ... Supabase 쿼리 로직
    return null; // 구현 시 채움
  } catch {
    return null; // 히스토리 없어도 플랜 생성 가능
  }
}

// ─── 프롬프트 빌더 ────────────────────────────────────────────────────────────
function buildPrompt(
  data: OnboardingData,
  history: UserHistorySummary | null
): string {
  const goalLabel = {
    weight_loss: '체중 감량',
    muscle_gain: '근육 증가 (벌크업)',
    maintenance: '체형 유지',
    health: '건강 개선',
  }[data.goal];

  const experienceLabel = {
    beginner: '입문 (0~6개월)',
    intermediate: '초급~중급 (6개월~2년)',
    advanced: '중급 이상 (2년+)',
  }[data.experience];

  let historySection = '';
  if (history) {
    historySection = `
최근 7일 기록 요약:
- 평균 일일 칼로리 섭취: ${history.avgDailyCalories}kcal
- 운동 완료율: ${Math.round(history.workoutCompletionRate * 100)}%
- 체중 변화 추이: 주당 ${history.weightTrend > 0 ? '+' : ''}${history.weightTrend.toFixed(2)}kg
`;
  }

  return `
당신은 공인 영양사이자 개인 트레이너입니다.
아래 사용자 정보를 기반으로 1주일치 맞춤 식단·운동 계획을 작성해주세요.

[사용자 정보]
- 목표: ${goalLabel}
- 성별: ${data.gender === 'male' ? '남성' : data.gender === 'female' ? '여성' : '미공개'}
- 나이: ${data.age}세
- 키: ${data.height}cm
- 체중: ${data.weight}kg
- 운동 경험: ${experienceLabel}
- 주당 운동 가능 일수: ${data.workoutDaysPerWeek}일
- 식이 제한: ${data.dietaryRestrictions.length > 0 ? data.dietaryRestrictions.join(', ') : '없음'}
${data.recoveryLevel ? `- 운동 후 피로 회복: ${data.recoveryLevel}` : ''}
${data.overeatingHabit ? `- 습관적 과식: ${data.overeatingHabit}` : ''}
${data.sleepQuality ? `- 수면 품질: ${data.sleepQuality}` : ''}
${data.plateauHistory ? `- 정체기 경험: ${data.plateauHistory}` : ''}
${historySection}

[중요 지침]
- 전문용어를 최소화하고 한국어로 쉽게 설명하세요
- 숫자와 근거를 구체적으로 제시하세요
- 식단은 한국 음식 중심으로 제안하세요
- 운동 경험 수준에 맞는 난이도로 설계하세요

[출력 형식]
반드시 아래 JSON 스키마를 정확히 따르세요. JSON 외 다른 텍스트 없이 순수 JSON만 출력하세요:

{
  "targetCalories": number,
  "targetMacros": { "protein": number, "carbs": number, "fat": number },
  "weeklyWorkout": [
    {
      "dayOfWeek": "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun",
      "isRestDay": boolean,
      "focus": string | null,
      "exercises": [
        { "name": string, "sets": number, "repsRange": string, "note": string | null }
      ]
    }
  ],
  "weeklyDiet": [
    {
      "targetCalories": number,
      "meals": [
        {
          "timing": string,
          "foods": [string],
          "calories": number,
          "macros": { "protein": number, "carbs": number, "fat": number }
        }
      ]
    }
  ],
  "explanation": {
    "summary": string,
    "detail": string,
    "sources": [string]
  },
  "safetyFlags": [string]
}
`;
}

// ─── 메인 생성 함수 ────────────────────────────────────────────────────────────
export async function generateAIPlan(
  data: OnboardingData,
  history: UserHistorySummary | null
): Promise<AIPlan> {
  const prompt = buildPrompt(data, history);

  // Gemini REST API 호출
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API 오류 (${response.status}): ${err}`);
  }

  const json = await response.json();
  const responseText: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // JSON 파싱 (안전하게)
  let parsed: Omit<AIPlan, 'id' | 'weekStart' | 'generatedAt'>;
  try {
    const cleaned = responseText
      .replace(/^```json\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI 응답 파싱 실패. 다시 시도해주세요.');
  }

  // 최소 칼로리 안전 가드레일 (성별 분화)
  const minCalories = data.gender === 'female' ? 1200 : 1500;
  if (parsed.targetCalories < minCalories) {
    parsed.targetCalories = minCalories;
    parsed.safetyFlags = [
      ...(parsed.safetyFlags ?? []),
      `목표 칼로리가 ${minCalories}kcal 미만으로 설정되어 조정되었습니다.`,
    ];
  }

  const monday = getMonday(new Date());
  return {
    ...parsed,
    id: Math.random().toString(36).slice(2),
    weekStart: monday.toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
  };
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
```

---

## 6. Supabase 연동

### 6-1. 마이그레이션 SQL

```sql
-- ai_plans 테이블
CREATE TABLE ai_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  week_start DATE NOT NULL,
  target_calories INT,
  target_protein INT,
  target_carbs INT,
  target_fat INT,
  plan_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  generation_context JSONB
);

ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own ai plans"
  ON ai_plans FOR ALL USING (auth.uid() = user_id);

-- user_profiles 컬럼 추가
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ai_consent BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_onboarding_data JSONB;
```

### 6-2. ai-plan-store ↔ Supabase 동기화 흐름

```
플랜 생성 완료
  → AsyncStorage에 즉시 저장 (오프라인 대비)
  → Supabase ai_plans에 upsert (백그라운드)

앱 재시작
  → AsyncStorage에서 로컬 플랜 로드
  → Supabase에서 최신 플랜 확인 (is_active=true, 이번 주)
  → 최신 버전으로 덮어쓰기
```

---

## 7. 환경 변수

```bash
# .env.example에 추가
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

> **보안 주의**: `EXPO_PUBLIC_` prefix는 클라이언트에 노출됩니다.
> 프로덕션에서는 Supabase Edge Function으로 LLM 호출을 서버 사이드로 이전 권장.
> MVP에서는 클라이언트 호출로 빠르게 구현.

---

## 8. 에러 처리

| 상황 | 처리 |
|------|------|
| LLM JSON 파싱 실패 | 1회 자동 재시도 → 실패 시 "다시 시도" 버튼 표시 |
| 네트워크 오류 | 토스트 메시지 + 로컬 캐시 플랜 유지 |
| Supabase 저장 실패 | AsyncStorage만으로 동작 (사용자에게 오류 미노출) |
| 안전 가드레일 차단 | 모달 팝업 + 목표 수정 유도 |
| API 키 없음 (개발) | "AI 기능을 이용하려면 API 키 설정이 필요합니다" 안내 |

---

## 9. 타입 파일 변경

### navigation.ts 추가

```typescript
export type AIModalParamList = {
  AIConsent: undefined;
  AIOnboarding: undefined;
  AIPlanResult: { planId?: string };
  AIPlanWeekly: { weekStart: string };
};

// RootStackParamList에 추가
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  AIConsent: undefined;
  AIOnboarding: undefined;
  AIPlanResult: { planId?: string };
  AIPlanWeekly: { weekStart: string };
};
```

---

## 10. 컴포넌트 트리

```
AIPlanResultScreen
├── PlanHeader (주차 표시 + 재생성 버튼)
├── GoalSummaryCard (목표 칼로리/매크로)
├── TabBar (운동 / 식단)
├── WorkoutTab
│   ├── WorkoutDayCard (×7)
│   │   └── ExerciseRow (×N)
│   └── ExplanationCard (접기/펼치기)
│       ├── NumberAnalysis
│       ├── HistoryInsight (동의자만)
│       └── SourceList
└── DietTab
    ├── MacroProgressBar
    ├── MealCard (×3~5)
    │   └── FoodItem (×N)
    └── DietDisclaimer

AIOnboardingScreen
├── StepIndicator
├── QuestionCard (단일 질문 + 답변 옵션)
├── Phase2Separator (스킵 옵션 포함)
└── SafetyBlockModal
```

---

## 11. 구현 가이드

### 11.1 구현 순서

| 순서 | 모듈 | 파일 | 비고 |
|------|------|------|------|
| 1 | DB 마이그레이션 | Supabase SQL Editor | ai_plans 테이블 + user_profiles 컬럼 |
| 2 | 타입 정의 | navigation.ts | AIModalParamList 추가 |
| 3 | 스토어 | ai-plan-store.ts | Zustand + AsyncStorage persist |
| 4 | AI 서비스 | ai-planner.ts | validateSafety + generateAIPlan |
| 5 | 온보딩 화면 | ai-consent-screen.tsx | 동의 UI |
| 6 | 온보딩 화면 | ai-onboarding-screen.tsx | Phase1+2 질문 |
| 7 | 결과 화면 | ai-plan-result-screen.tsx | 운동/식단 탭 + 이유 카드 |
| 8 | 네비게이션 | root-navigator.tsx | 동의 분기 로직 |
| 9 | 네비게이션 | main-navigator.tsx | 모달 스택 추가 |
| 10 | 홈 카드 | home-screen.tsx | AI 플랜 카드 3가지 상태 |
| 11 | 주간 화면 | ai-plan-weekly-screen.tsx | 재생성 결과 확인 |

### 11.2 모듈 맵 (Session Guide)

| 모듈 | 내용 | 세션 |
|------|------|------|
| module-1 | DB + 타입 + 스토어 + AI 서비스 (백엔드 기반) | Session 1 |
| module-2 | 동의 + 온보딩 화면 + 네비게이션 연결 | Session 2 |
| module-3 | 플랜 결과 화면 + 홈 카드 | Session 3 |
| module-4 | 주간 재생성 + 에러 처리 + 마무리 | Session 4 |

### 11.3 Session Guide

**Session 1** — 데이터·로직 기반 (module-1)
- Supabase SQL 실행 (ai_plans 테이블, user_profiles 컬럼)
- `src/stores/ai-plan-store.ts` 작성
- `src/lib/ai-planner.ts` 작성 (validateSafety + generateAIPlan)
- `.env.example`에 EXPO_PUBLIC_GEMINI_API_KEY 추가
- 테스트: generateAIPlan 함수 직접 호출로 JSON 확인

**Session 2** — 온보딩 UX (module-2)
- `src/screens/ai/ai-consent-screen.tsx`
- `src/screens/ai/ai-onboarding-screen.tsx` (Phase1+2)
- `src/navigation/root-navigator.tsx` 수정 (동의 분기)
- `src/navigation/main-navigator.tsx` 수정 (모달 스택)
- 테스트: 온보딩 완료 후 store에 onboardingData 저장 확인

**Session 3** — 플랜 결과 표시 (module-3)
- `src/screens/ai/ai-plan-result-screen.tsx` (운동/식단 탭 + 이유 카드)
- `src/screens/home/home-screen.tsx` AI 카드 추가
- 테스트: 실제 LLM 호출 → 결과 화면 렌더링 확인

**Session 4** — 재생성 + 마무리 (module-4)
- `src/screens/ai/ai-plan-weekly-screen.tsx`
- Supabase 저장/로드 동기화
- 에러 처리 (파싱 실패 재시도, 네트워크 오류)
- 테스트: 앱 재시작 후 플랜 유지 확인

---

*이 문서는 Option C (실용적 균형) 아키텍처 기반 화면별 UX 명세입니다. Do 단계에서 session별로 구현합니다.*
