# ai-plan-loading-ux Design Document

> **Summary**: AI 플랜 생성 대기 시간을 단계별 진행 메시지 + 슬라이드 카드로 풍성하게 구성
>
> **Project**: fit
> **Version**: 0.1
> **Author**: Claude
> **Date**: 2026-03-25
> **Status**: Draft
> **Planning Doc**: [ai-plan-loading-ux.plan.md](../../01-plan/features/ai-plan-loading-ux.plan.md)

---

## Context Anchor

> Copied from Plan document. Ensures strategic context survives Design→Do handoff.

| Key | Value |
|-----|-------|
| **WHY** | 플랜 생성 대기 이탈 → 피처 효용 0. 로딩을 "뭔가 되고 있다"는 확신과 "앱이 재미있다"는 인상으로 전환 |
| **WHO** | AI 플랜 온보딩 완료 후 처음 생성하는 신규 사용자 (특히 앱에 익숙하지 않은 입문자) |
| **RISK** | 카드 UI 구현 복잡도 상승 / 타이머와 실제 API 완료 타이밍 불일치 시 UX 어색함 |
| **SUCCESS** | 로딩 화면에서 스와이프 인터랙션 1회 이상 발생. 앱 종료 없이 플랜 결과 화면까지 도달 |
| **SCOPE** | P0: 로딩 화면 UX 개선 (C+A+E). P1: 백그라운드 생성 + 푸시 알림 (별도 피처) |

---

## 1. Overview

### 1.1 Design Goals

- `AILoadingScreen` 컴포넌트를 독립 파일로 분리해 `ai-onboarding-screen.tsx`의 인라인 로딩 부분 교체
- 상태 머신(step progress + card index)을 컴포넌트 내부에 캡슐화 — 외부 store 변경 없음
- 콘텐츠 데이터를 `ai-loading-content.ts`에 분리해 유지보수성 확보

### 1.2 Design Principles

- **단순 의존성**: 데이터 → 컴포넌트 → 화면. 역방향 없음
- **타이머 격리**: `setInterval` 은 컴포넌트 마운트/언마운트에 맞춰 생성/해제 (`useEffect` cleanup)
- **API 완료 우선**: `isComplete` prop이 `true`가 되는 순간 즉시 `onComplete()` 호출 — 타이머 무시

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 인라인으로 직접 수정 | 별도 화면 라우트 추가 | 독립 컴포넌트, 인라인 마운트 |
| **New Files** | 0 | 3 (+ navigator 변경) | 2 |
| **Modified Files** | 1 | 3 | 1 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | 파일 비대 | 라우팅 복잡도 증가 | 없음 |

**Selected**: **Option C — Pragmatic Balance**
**Rationale**: 독립 컴포넌트로 재사용성·테스트 용이성 확보. Navigator 변경 없이 인라인 조건부 렌더링으로 단순 통합.

### 2.1 Component Diagram

```
ai-onboarding-screen.tsx
  │
  ├── [generating === false]  →  온보딩 UI (질문 카드)
  │
  └── [generating === true]   →  <AILoadingScreen
                                    isComplete={planReady}
                                    onComplete={handleNavigate}
                                  />
                                    │
                                    ├── StepProgress  (useStepTimer)
                                    └── CardCarousel  (useCardTimer)
                                          │
                                          └── ai-loading-content.ts (데이터)
```

### 2.2 Data Flow

```
[handleFinish 호출]
    │
    ├── setGenerating(true)     → AILoadingScreen 마운트
    │   └── step timer 시작 (setInterval)
    │   └── card timer 시작 (setInterval)
    │
    ├── generateAIPlan()        → API 호출 (비동기)
    │
    └── API 완료 → setPlanReady(true)
                      │
                      └── AILoadingScreen.isComplete = true
                              → onComplete() 호출
                              → navigate to result screen
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `AILoadingScreen` | `ai-loading-content.ts` | 슬라이드/팁/단계 데이터 |
| `AILoadingScreen` | React Native `ScrollView`, `Animated` | 카드 캐러셀 + 점 애니메이션 |
| `ai-onboarding-screen.tsx` | `AILoadingScreen` | 로딩 화면 렌더링 |

---

## 3. Data Model

### 3.1 `ai-loading-content.ts` 타입 정의

```typescript
// src/constants/ai-loading-content.ts

export interface LoadingStep {
  icon: string;       // 이모지
  message: string;    // "신체 정보 분석 중..."
  startAt: number;    // 초 단위 (0, 5, 10, 16, 22)
}

export interface LoadingCard {
  type: 'feature' | 'tip';
  icon: string;
  title: string;
  body: string;
  category?: string;  // tip 전용: '운동' | '식단' | '멘탈'
}

export const LOADING_STEPS: LoadingStep[] = [
  { icon: '🔍', message: '신체 정보 분석 중...', startAt: 0 },
  { icon: '🍽️', message: '식단 구성 중...', startAt: 5 },
  { icon: '💪', message: '운동 계획 수립 중...', startAt: 10 },
  { icon: '✨', message: '플랜 최적화 중...', startAt: 16 },
  { icon: '🎯', message: '마무리 중...', startAt: 22 },
];

export const LOADING_CARDS: LoadingCard[] = [
  // Feature cards (4장)
  { type: 'feature', icon: '💪', title: '운동 기록', body: '세트·반복·중량을 한 번에. 휴식 타이머 자동 시작' },
  { type: 'feature', icon: '🍽️', title: '식단 검색', body: '국내외 식품 DB + 직접 입력. 매크로 자동 계산' },
  { type: 'feature', icon: '📊', title: '홈 대시보드', body: '칼로리·운동·체중 변화를 한눈에' },
  { type: 'feature', icon: '🤖', title: 'AI 주간 플랜', body: '매주 월요일 새 플랜. 지난 주와 비교해서 진화' },
  // Tip cards (10장)
  { type: 'tip', icon: '💡', category: '운동', title: '단백질 최소 기준', body: '근성장을 위한 최소 단백질: 체중(kg) × 1.6g/일' },
  { type: 'tip', icon: '💡', category: '식단', title: '수분 섭취', body: '하루 체중(kg) × 30ml. 공복감의 30%는 갈증' },
  { type: 'tip', icon: '💡', category: '운동', title: '점진적 과부하', body: '매주 중량 2.5~5% 증가가 목표' },
  { type: 'tip', icon: '💡', category: '식단', title: '포만감 차이', body: '단백질은 포만감 지속 시간이 탄수화물의 2배' },
  { type: 'tip', icon: '💡', category: '운동', title: '수면과 근성장', body: '수면 7시간 이상이 테스토스테론 생성의 기본 조건' },
  { type: 'tip', icon: '💡', category: '식단', title: '혈당 관리', body: '식사 직전 채소 → 혈당 스파이크 20~30% 감소' },
  { type: 'tip', icon: '💡', category: '운동', title: '다관절 운동', body: '데드리프트·스쿼트 같은 다관절 운동이 단시간 효율 최고' },
  { type: 'tip', icon: '💡', category: '식단', title: '현미 vs 백미', body: '혈당지수 55 vs 72. 포만감 2배 차이' },
  { type: 'tip', icon: '💡', category: '운동', title: '근육통 오해', body: '근육통(DOMS)은 성장 신호가 아님. 회복의 신호' },
  { type: 'tip', icon: '💡', category: '멘탈', title: '21일 법칙', body: '3주 지속 시 습관 형성 시작. 처음 21일이 가장 중요' },
];
```

---

## 4. Component Spec: `AILoadingScreen.tsx`

### 4.1 Props Interface

```typescript
interface AILoadingScreenProps {
  isComplete: boolean;   // API 완료 신호 — true 되면 즉시 onComplete() 호출
  onComplete: () => void; // 결과 화면 이동 콜백
}
```

### 4.2 Internal State

```typescript
const [elapsedSeconds, setElapsedSeconds] = useState(0); // 경과 시간 (초)
const [currentStep, setCurrentStep] = useState(0);       // 현재 활성 단계 (0~4)
const [currentCard, setCurrentCard] = useState(0);       // 현재 카드 인덱스 (0~13)
const scrollRef = useRef<ScrollView>(null);               // 카드 스크롤 ref
```

### 4.3 Step Progress 로직

```typescript
// 경과 시간 타이머 — 1초마다 tick
useEffect(() => {
  const ticker = setInterval(() => {
    setElapsedSeconds(s => s + 1);
  }, 1000);
  return () => clearInterval(ticker);
}, []);

// 경과 시간 → currentStep 계산
useEffect(() => {
  const nextStep = [...LOADING_STEPS]
    .reverse()
    .find(s => elapsedSeconds >= s.startAt);
  if (nextStep) {
    const idx = LOADING_STEPS.indexOf(nextStep);
    // 마지막 단계(4)에서는 루프: 계속 4 유지
    setCurrentStep(Math.min(idx, LOADING_STEPS.length - 1));
  }
}, [elapsedSeconds]);
```

**단계 상태 판별**:

| 조건 | 표시 |
|------|------|
| `index < currentStep` | 완료 — 체크마크(✓) + opacity 0.4 |
| `index === currentStep` | 진행 중 — 강조 + `...` 점멸 애니메이션 |
| `index > currentStep` | 대기 — opacity 0.25 |

### 4.4 Card Carousel 로직

```typescript
// 3초 자동 전환
useEffect(() => {
  const auto = setInterval(() => {
    setCurrentCard(c => {
      const next = (c + 1) % LOADING_CARDS.length;
      scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
      return next;
    });
  }, 3000);
  return () => clearInterval(auto);
}, []);
```

**스와이프 수동 전환**:
- `ScrollView` 의 `onMomentumScrollEnd` 이벤트로 `currentCard` 동기화
- 스와이프 발생 시 자동 타이머를 리셋 (clearInterval + setInterval) — 사용자 스와이프와 자동 전환 충돌 방지

```typescript
const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
  setCurrentCard(idx);
  // 타이머 리셋
  clearInterval(autoTimerRef.current);
  autoTimerRef.current = setInterval(...);
};
```

### 4.5 API 완료 처리

```typescript
useEffect(() => {
  if (isComplete) {
    onComplete();
  }
}, [isComplete]);
```

- `isComplete` prop이 `true`로 바뀌는 즉시 `onComplete()` 호출
- 진행 중인 단계나 카드 위치와 무관하게 즉시 이동

### 4.6 레이아웃 구조

```
┌─────────────────────────────────────┐
│  🤖 AI가 플랜을 만들고 있어요       │  ← 타이틀 (상단 고정)
├─────────────────────────────────────┤
│                                     │
│  Step Progress (5개 단계)           │
│  ─────────────────────────          │
│  ✓ 🔍 신체 정보 분석 중...  (완료) │
│  ▶ 🍽️ 식단 구성 중...      (진행) │
│    💪 운동 계획 수립 중...  (대기) │
│    ✨ 플랜 최적화 중...     (대기) │
│    🎯 마무리 중...          (대기) │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  💪                           │  │
│  │  운동 기록                    │  ← Card Carousel
│  │  세트·반복·중량을 한 번에...  │
│  └───────────────────────────────┘  │
│         ● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ │  ← 페이지 인디케이터
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Integration: `ai-onboarding-screen.tsx` 변경

### 5.1 현재 로딩 코드 (제거 대상)

```tsx
// 현재: 인라인 로딩 UI
if (generating) {
  return (
    <View style={styles.loadingContainer}>
      <Text>🤖</Text>
      <Text>AI가 플랜을 만들고 있어요...</Text>
    </View>
  );
}
```

### 5.2 변경 후

```tsx
// 추가 import
import { AILoadingScreen } from '../../components/ai/AILoadingScreen';

// state 추가
const [planReady, setPlanReady] = useState(false);

// handleFinish 수정: API 완료 후 planReady = true
const handleFinish = async () => {
  setGenerating(true);
  try {
    // ...기존 API 호출 로직...
    setPlanReady(true); // ← 이 라인 추가
  } catch (e) {
    setGenerating(false);
    // 에러 처리 기존 코드
  }
};

// handleNavigate: planReady 시 결과 화면 이동
const handleNavigate = () => {
  navigation.replace('AIPlanResult');
};

// render: 조건부 렌더링
return (
  <View style={styles.container}>
    {generating ? (
      <AILoadingScreen isComplete={planReady} onComplete={handleNavigate} />
    ) : (
      // 기존 온보딩 UI
    )}
  </View>
);
```

---

## 6. Error Handling

| 케이스 | 동작 |
|--------|------|
| API 5초 이내 완료 | 단계 1 또는 2에서 즉시 결과 화면 이동 — 자연스러움 |
| API 60초 초과 | 기존 타임아웃 에러 처리 코드 동작 (`setGenerating(false)`, Alert 표시) |
| 타이머 컴포넌트 언마운트 | `useEffect` cleanup으로 `clearInterval` — 메모리 누수 없음 |
| 스와이프 중 자동 전환 | 스와이프 감지 후 자동 타이머 리셋으로 충돌 방지 |

---

## 7. Security Considerations

- 이 피처는 순수 클라이언트 UI — 외부 데이터 입력 없음. 보안 고려 불필요.
- 기존 `generateAIPlan()` 의 API 키 노출 이슈는 별도 P2 태스크 (Edge Function 이전).

---

## 8. Test Plan

### 8.1 Test Cases

- [ ] 온보딩 완료 후 `generating=true` 시 `AILoadingScreen` 렌더링 확인
- [ ] 5초 경과 후 단계 2로 자동 진행 확인
- [ ] 카드 3초마다 자동 전환 확인
- [ ] 좌우 스와이프로 카드 수동 이동 확인
- [ ] API 완료(`planReady=true`) 즉시 결과 화면 이동 확인
- [ ] API 빨리 끝날 때 (< 5초) 자연스럽게 이동 확인
- [ ] 에러 발생 시 로딩 화면 제거 + Alert 표시 확인

---

## 9. Clean Architecture

### 9.1 Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `AILoadingScreen` | Presentation | `src/components/ai/AILoadingScreen.tsx` |
| `ai-loading-content.ts` | Domain (static data) | `src/constants/ai-loading-content.ts` |
| `ai-onboarding-screen.tsx` | Presentation | `src/screens/ai/ai-onboarding-screen.tsx` |

---

## 10. Coding Convention

| Item | Convention |
|------|-----------|
| Component 파일 | PascalCase (`AILoadingScreen.tsx`) |
| 상수 파일 | kebab-case (`ai-loading-content.ts`) |
| Props interface | `{ComponentName}Props` |
| 내부 상수 | UPPER_SNAKE_CASE (`CARD_WIDTH`, `LOADING_STEPS`) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── constants/
│   └── ai-loading-content.ts         ← 신규 (module-1)
├── components/
│   └── ai/
│       └── AILoadingScreen.tsx        ← 신규 (module-2)
└── screens/
    └── ai/
        └── ai-onboarding-screen.tsx   ← 수정 (module-3)
```

### 11.2 Implementation Order

1. [ ] `ai-loading-content.ts` 데이터 파일 생성 (LOADING_STEPS 5개 + LOADING_CARDS 14개)
2. [ ] `AILoadingScreen.tsx` 컴포넌트 구현
   - [ ] Step Progress UI (타이머 기반)
   - [ ] Card Carousel UI (ScrollView + 자동 전환 + 스와이프)
   - [ ] `isComplete` → `onComplete()` 연결
3. [ ] `ai-onboarding-screen.tsx` 인라인 로딩 UI → `<AILoadingScreen />` 교체

### 11.3 Session Guide

> `/pdca do ai-plan-loading-ux --scope module-N` 으로 모듈별 구현 가능.

#### Module Map

| Module | Scope Key | Description | 예상 턴 |
|--------|-----------|-------------|:-------:|
| 데이터 파일 | `module-1` | `ai-loading-content.ts` — LOADING_STEPS + LOADING_CARDS | 5~8 |
| 로딩 컴포넌트 | `module-2` | `AILoadingScreen.tsx` — Step Progress + Card Carousel | 20~30 |
| 통합 | `module-3` | `ai-onboarding-screen.tsx` 교체 + 통합 테스트 | 8~12 |

#### Recommended Session Plan

| 세션 | 범위 | Scope | 예상 턴 |
|------|------|-------|:-------:|
| Session 1 (현재) | Plan + Design | 전체 | ~30 |
| Session 2 | Do | `--scope module-1,module-2` | 35~45 |
| Session 3 | Do + Check | `--scope module-3` + analyze | 25~35 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-25 | Initial draft (Option C selected) | Claude |
