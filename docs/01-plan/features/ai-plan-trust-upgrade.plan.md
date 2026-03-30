# Plan: ai-plan-trust-upgrade

**Feature**: ai-plan-trust-upgrade
**Date**: 2026-03-28
**Phase**: Plan
**Status**: In Progress

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | AI 플랜 결과에 대한 신뢰도가 낮고, 운동 환경 차이(헬스장/홈짐/맨몸)가 반영되지 않으며, 생성된 플랜을 유연하게 커스터마이즈할 수 없음 |
| **Solution** | 플랜 설명 카드 상단 배치 + 제목 개선, 시설 질문 2단계 추가(카테고리→세부장비), 종목별 대체 운동 Swap 기능 |
| **Function UX Effect** | 플랜 생성 이유가 첫 화면에서 바로 보이고, 내 헬스장 환경에 맞는 종목이 생성되며, 세션 중 종목을 즉시 교체 가능 |
| **Core Value** | AI 플랜의 개인화 수준과 신뢰도를 높여 장기 유지율 향상 |

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

## 1. 배경 및 현황

### 현재 상태
- `ExplanationCard` ("왜 이 플랜인가요?")가 운동 목록 **최하단**에 위치 → 대부분 사용자가 보지 않음
- 온보딩에 시설/장비 질문 없음 → 모든 사용자에게 Full Gym 기준 종목 생성
- 운동 세션 중 특정 종목을 바꾸고 싶어도 대안 없음 → 플랜 포기 또는 임의 변경
- `OnboardingData` 타입에 `gymType` 없음

### 원인 분석
- 플랜 설명이 하단에 있어 스크롤해야 볼 수 있음 → 신뢰 신호 노출 실패
- Gemini 프롬프트에 장비 컨텍스트 없음 → 집에서 못 하는 종목 생성
- 대체 운동 인프라(정적 테이블, UI) 미구현

---

## 2. 요구사항

### FR-01: ExplanationCard 상단 배치 + UX 강화
- 운동 탭 렌더링 순서: `ExplanationCard` → `WorkoutDayCard[]` (현재 반대)
- 제목 변경: "왜 이 플랜인가요?" → **"이 플랜이 당신에게 맞는 이유"** (또는 유사한 신뢰 유도 표현)
- 기본 상태: **펼쳐진 상태(open=true)** 로 초기화 (현재는 closed)
- 디자인 강조: accent 색상 border 또는 배경 미묘하게 다르게 하여 시각적 차별화

### FR-02: 온보딩 시설 질문 추가 (2단계)
**Step 1 — 카테고리 선택** (Phase 1 질문에 추가, `workoutDaysPerWeek` 이후)

| 선택지 | 설명 | value |
|--------|------|-------|
| 헬스장 (Full Gym) | 바벨, 덤벨, 머신 전체 이용 가능 | `full_gym` |
| 홈짐 / 파워랙 | 바벨, 스쿼트랙, 덤벨 일부 | `garage_gym` |
| 덤벨·케틀벨만 | 덤벨 또는 케틀벨 운동 | `dumbbell_only` |
| 맨몸 운동 | 장비 없이 자체 중량 | `bodyweight` |

**Step 2 — 세부 장비 커스터마이즈 (선택)**
- "세부 장비를 직접 지정할까요?" Yes/No
- Yes 선택 시: 장비 체크리스트 화면 (다중 선택)
  - **프리웨이트**: 덤벨, 케틀벨, 바벨, EZ바, 트랩바
  - **랙·벤치**: 스쿼트랙, 플랫벤치, 인클라인벤치, 풀업바
  - **케이블·머신**: 케이블 크로스오버, 랫풀다운, 로우케이블, 렉프레스, 레그익스텐션, 레그컬
- No 선택 시: 카테고리 기준으로만 프롬프트에 반영
- 장비 목록은 `equipmentList: string[]`로 `OnboardingData`에 저장

**타입 변경**:
```typescript
// OnboardingData에 추가
gymType: 'full_gym' | 'garage_gym' | 'dumbbell_only' | 'bodyweight';
equipmentList?: string[];  // Step 2 선택 시 세부 장비 목록
```

**Gemini 프롬프트 반영**:
- `gymType` + `equipmentList` → 프롬프트에 "사용 가능한 장비: ..."로 주입
- 없는 장비가 필요한 종목은 생성하지 않도록 지시

### FR-03: Swap Exercise — AI 플랜 결과 화면
- `WorkoutDayCard` 내 각 종목 행에 **"교체" 버튼** (또는 종목명 탭)
- 탭 시 `SwapExerciseSheet` (바텀시트) 표시:
  - **추천 대체 운동**: 정적 테이블 기반 유사 종목 2~3개
  - **다른 운동으로 변경**: 부위별 전체 운동 목록 (기존 `exercises` DB 또는 정적 목록)
  - 선택 시 해당 day의 해당 종목이 교체됨 → `ai-plan-store` 업데이트 + Supabase 저장

### FR-04: Swap Exercise — 운동 세션 화면
- 세션 중 각 종목 행에 **"종목 교체" 버튼** (스왑 아이콘)
- 탭 시 동일한 `SwapExerciseSheet` 표시
- **세션에만 적용**: `ai-plan-store` 원본 플랜 불변, 해당 세션 기록에만 교체된 종목으로 저장
- 세션 중 교체 시 교체된 종목의 이름으로 기록 (workout_sets에 저장)

### FR-05: 정적 대체 운동 테이블 (신규 파일)
`src/lib/exercise-alternatives.ts` 신규 생성:
```typescript
// 예시
export const EXERCISE_ALTERNATIVES: Record<string, { similar: string[], alternatives: string[] }> = {
  '벤치프레스': {
    similar: ['덤벨 프레스', '푸시업'],
    alternatives: ['인클라인 덤벨 프레스', '체스트 플라이', '딥스'],
  },
  '스쿼트': {
    similar: ['고블릿 스쿼트', '박스 스쿼트'],
    alternatives: ['렉프레스', '불가리안 스플릿 스쿼트', '런지'],
  },
  // ... 주요 종목 ~30개
};
```

### FR-06 (추천 방안 — 선택적 구현)
아래는 추가로 제안하는 개선사항으로, 이번 구현 범위에 포함 여부는 협의:

| # | 제안 | 효과 |
|---|------|------|
| A | **플랜 확신도 배지**: 목표·경험·시설 조합 기반으로 "이 플랜의 적합도: 높음" 배지 표시 | 신뢰도 직접 수치화 |
| B | **온보딩 진행률 표시**: 상단에 "3/8 완료" 형태 progress bar | 온보딩 이탈 감소 |
| C | **부상/제한 질문 추가**: "불편한 부위가 있나요?" (어깨/무릎/허리 등) → 해당 부위 종목 제외 지시 | 안전성 강화 |
| D | **플랜 요약 카드 강화**: GoalSummaryCard에 "체지방 감소 예상" 같은 예상 효과 표시 | 동기 부여 |

---

## 3. 기술 상세

### 3.1 ExplanationCard 레이아웃 변경
```tsx
// ai-plan-result-screen.tsx 운동 탭 렌더링 순서 변경
{activeTab === 'workout' && (
  <>
    <ExplanationCard plan={currentPlan} colors={colors} />  // 상단으로 이동
    {sortedWorkout.map((day) => (
      <WorkoutDayCard key={day.dayOfWeek} day={day} colors={colors} />
    ))}
  </>
)}
```

`ExplanationCard`:
- `useState(true)` → 기본 펼쳐진 상태
- 제목: "이 플랜이 당신에게 맞는 이유"
- `wrap` style에 `borderWidth: 1.5, borderColor: colors.accent` 추가로 강조

### 3.2 OnboardingData 타입 + 질문 추가

`ai-plan-store.ts`:
```typescript
export type GymType = 'full_gym' | 'garage_gym' | 'dumbbell_only' | 'bodyweight';

export interface OnboardingData {
  // ... 기존 필드
  gymType: GymType;
  equipmentList?: string[];
}
```

`ai-onboarding-screen.tsx` QUESTIONS 배열:
- `workoutDaysPerWeek` 이후에 `gymType` 질문 삽입 (type: 'single', phase: 1)
- gymType 선택 후 Step 2 모달: `EquipmentDetailSheet` 컴포넌트 신규

### 3.3 Gemini 프롬프트 업데이트
`ai-planner.ts` `buildPrompt()` 함수:
```typescript
const gymDesc = {
  full_gym: '헬스장 (바벨, 덤벨, 머신 모두 이용 가능)',
  garage_gym: '홈짐 (바벨, 스쿼트랙, 덤벨)',
  dumbbell_only: '덤벨·케틀벨만 사용 가능',
  bodyweight: '장비 없이 자체 중량만 가능',
}[data.gymType];

// 프롬프트에 추가:
// "사용 가능한 운동 환경: {gymDesc}"
// "장비 목록: {equipmentList.join(', ')}"  // equipmentList 있을 때만
// "위 장비가 없는 종목은 절대 포함하지 마세요."
```

### 3.4 SwapExerciseSheet 컴포넌트
신규: `src/components/ai/SwapExerciseSheet.tsx`
- Props: `exerciseName`, `visible`, `onSelect(newName)`, `onClose`, `colors`
- 2섹션:
  - "유사 종목" (EXERCISE_ALTERNATIVES의 similar 배열, 최대 3개)
  - "다른 종목으로 변경" (EXERCISE_ALTERNATIVES의 alternatives 배열 + 텍스트 검색)

### 3.5 운동 세션 Swap 연동
`workout-session-screen.tsx`:
- 각 종목 헤더에 `SwapExerciseSheet` 연결
- 선택 시 로컬 state에서 해당 종목명만 교체
- `workout_sets` INSERT 시 교체된 종목명으로 저장 (플랜 원본 불변)

---

## 4. 파일 변경 목록

| 파일 | 변경 | 내용 |
|------|------|------|
| `src/stores/ai-plan-store.ts` | 수정 | `GymType` 타입, `gymType`/`equipmentList` 필드 추가 |
| `src/screens/ai/ai-onboarding-screen.tsx` | 수정 | gymType 질문 + EquipmentDetailSheet 추가 |
| `src/lib/ai-planner.ts` | 수정 | buildPrompt에 gymType/equipmentList 반영 |
| `src/screens/ai/ai-plan-result-screen.tsx` | 수정 | ExplanationCard 상단 배치, open=true 기본값, 제목 변경, 강조 스타일 |
| `src/components/ai/SwapExerciseSheet.tsx` | 신규 | 대체 운동 선택 바텀시트 |
| `src/lib/exercise-alternatives.ts` | 신규 | 정적 대체 운동 테이블 (~30종목) |
| `src/screens/ai/ai-plan-result-screen.tsx` | 수정 | WorkoutDayCard에 교체 버튼 + SwapExerciseSheet 연동 |
| `src/screens/workout/workout-session-screen.tsx` | 수정 | 종목 행에 Swap 버튼 + 세션 내 종목 교체 |

---

## 5. 스키마 변경

없음. `OnboardingData`는 Zustand AsyncStorage persist에만 저장되며, Supabase `ai_plans.onboarding_json` (JSONB)에 직렬화됨 → 신규 필드는 하위 호환.

---

## 6. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| Swap 테이블 종목명이 Gemini 출력 이름과 불일치 | 높음 | 정규화 함수(`normalizeExerciseName`) 또는 키를 영문으로 통일 |
| 온보딩 질문 추가로 이탈 증가 | 중 | Phase 1에 포함하되 "건너뛰기" 불가 (필수) — 짧고 직관적 UI |
| 기존 사용자의 OnboardingData에 gymType 없음 | 낮음 | `gymType`을 `full_gym` 기본값으로 fallback |
| EquipmentDetailSheet 복잡도 | 중 | 2단계 방식이라 Step 2 건너뛰기 쉬움 |

---

## 7. 성공 기준

- [ ] AI 플랜 결과화면 최초 진입 시 "이 플랜이 당신에게 맞는 이유" 카드가 펼쳐진 상태로 최상단에 표시
- [ ] 온보딩 시 gymType 선택 가능, Gemini 출력 종목이 선택한 환경에 맞음 (예: 맨몸 선택 시 바벨 종목 없음)
- [ ] AI 플랜 결과화면에서 종목 교체 버튼 탭 → 유사 종목 + 다른 종목 목록 표시 → 선택 시 교체
- [ ] 운동 세션 화면에서 Swap 버튼 탭 → 동일 시트 표시 → 선택 시 세션 기록에만 반영
- [ ] 기존 사용자 (gymType 없음) 앱 크래시 없이 정상 동작

---

## 8. 구현 순서 (권장)

1. **Module-1** (20분): `OnboardingData` 타입 + `gymType` 질문 추가 + Gemini 프롬프트 반영
2. **Module-2** (15분): `ExplanationCard` 상단 배치 + 제목/스타일 개선
3. **Module-3** (30분): `exercise-alternatives.ts` 정적 테이블 작성
4. **Module-4** (30분): `SwapExerciseSheet` 컴포넌트 + AI 플랜 결과화면 연동
5. **Module-5** (20분): 운동 세션 화면 Swap 버튼 추가
6. 앱에서 전체 플로우 검증

---

## 9. 추가 추천 방안 (FR-06 상세)

### A. 플랜 적합도 배지
```
목표 + 경험 + 시설 + 일정 조합을 규칙 기반으로 평가
→ "높음 / 중간 / 낮음" 배지를 GoalSummaryCard 옆에 표시
```
예: 근육증가 + 중급+ + Full Gym + 4일 이상 = "높음"

### B. 온보딩 진행률
```
현재: 페이지 전환만, 몇 단계인지 모름
개선: 상단에 "4 / 9" 또는 progress bar
```

### C. 부상/제한 질문
```
Phase 2 질문으로 추가: "불편하거나 통증 있는 부위가 있나요?"
어깨 / 무릎 / 허리 / 손목 / 없음 (다중 선택)
→ Gemini: "해당 부위에 강한 부하가 가는 종목 제외"
```

### D. 운동 세션 → 플랜 피드백 루프
```
세션 완료 후: "이 종목을 앞으로도 계속 할까요?" 간단 질문
→ 다음 주 플랜 재생성 시 선호도 반영 (Gemini 프롬프트에 history로 추가)
```
