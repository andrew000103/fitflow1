# Plan: onboarding-inputs

> Feature: 온보딩 신체 정보 자동 채우기 + 안전 가드레일 완성
> Created: 2026-03-25
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | AI 온보딩에서 나이/키/체중 입력창이 있음에도 프로필 탭에 저장된 데이터를 가져오지 않아 사용자가 동일 정보를 중복 입력해야 하며, `validateSafety()`에 최소 칼로리 안전 체크가 없어 위험한 플랜이 생성될 수 있음 |
| **Solution** | 온보딩 화면 마운트 시 `user_profiles`에서 나이/키/체중을 pre-fill하고, `validateSafety()`에 BMR 기반 최소 칼로리(< 1200kcal) 체크를 추가 |
| **Function UX Effect** | 프로필 탭에서 이미 신체 정보를 입력한 사용자는 온보딩에서 해당 필드가 자동으로 채워져 바로 다음으로 진행 가능; 극단적 저칼로리 플랜 생성 자동 차단 |
| **Core Value** | 중복 입력 제거로 UX 개선 + 안전 가드레일 강화로 AI 플랜 신뢰도 향상 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | CLAUDE.md P0 — ai-planner Gap C-3/C-4 미수정. 하드코딩 폴백(`?? '30'` 등) + 최소 칼로리 미체크 |
| **WHO** | 프로필 탭에서 신체 정보를 이미 입력한 모든 로그인 유저 |
| **RISK** | `user_profiles` 조회 실패 시 빈 입력창으로 시작 — 기존과 동일한 UX, 크래시 없음 |
| **SUCCESS** | 프로필 데이터 있는 유저 → 온보딩 나이/키/체중 자동 채워짐; 1200kcal 미만 플랜 → 생성 차단 |
| **SCOPE** | `ai-onboarding-screen.tsx` (pre-fill), `ai-planner.ts` (validateSafety) — 2개 파일 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | 온보딩 화면 마운트 시 `user_profiles`에서 `age`, `height_cm`, `current_weight_kg` 조회 → `answers` state에 pre-fill | Must |
| FR-2 | `handleFinish()`의 폴백 하드코딩(`?? '30'`, `?? '170'`, `?? '70'`) 제거 — pre-fill된 값 또는 `undefined` 처리 | Must |
| FR-3 | `validateSafety()`에 BMR 기반 최소 칼로리 체크 추가: 체중 감량 목표 + 추정 일일 칼로리 < 1200kcal → blocked | Must |

### 1.2 비기능 요구사항

- **신규 패키지 없음**: `getLatestUserGoal()` 패턴 재사용, `user_profiles` 직접 쿼리
- **독립 try/catch**: 프로필 조회 실패 시 빈 입력창으로 시작 (기존 동작 유지)
- **UI 구조 변경 없음**: 기존 TextInput 그대로, 초기값만 주입
- **BMR 계산 간단 구현**: Mifflin-St Jeor 공식, 활동 계수 1.2 (최소 활동) 적용

---

## 2. 범위

### In Scope
- `src/screens/ai/ai-onboarding-screen.tsx`:
  - 마운트 시 `user_profiles` 조회 → `answers` state 초기 설정
  - `handleFinish()` 폴백 `?? '30'` 등 제거
- `src/lib/ai-planner.ts`:
  - `validateSafety()`에 BMR 기반 칼로리 체크 추가

### Out of Scope
- 프로필 탭 `user_profiles` 저장 로직 변경 없음
- 온보딩 완료 후 `user_profiles` 업데이트 없음 (온보딩 데이터는 `saveOnboardingDataToSupabase`로 별도 저장)
- 추천 칼로리 계산 UI 추가 없음

---

## 3. 기술 설계 방향

### 3.1 FR-1 — user_profiles pre-fill

```typescript
// ai-onboarding-screen.tsx — 마운트 시 프로필 조회
useEffect(() => {
  if (!user?.id) return;
  (async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('age, height_cm, weight_kg')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setAnswers((prev) => ({
          ...prev,
          ...(data.age       ? { age:    String(data.age) }       : {}),
          ...(data.height_cm ? { height: String(data.height_cm) } : {}),
          ...(data.weight_kg ? { weight: String(data.weight_kg) } : {}),
        }));
      }
    } catch {}
  })();
}, [user?.id]);
```

### 3.2 FR-2 — 하드코딩 폴백 제거

```typescript
// 변경 전
age:    parseInt(String(raw.age    ?? '30'),  10),
height: parseFloat(String(raw.height ?? '170')),
weight: parseFloat(String(raw.weight ?? '70')),

// 변경 후 (hasAnswer 체크가 이미 0 이하를 막으므로 폴백 불필요)
age:    parseInt(String(raw.age    ?? '0'),  10),
height: parseFloat(String(raw.height ?? '0')),
weight: parseFloat(String(raw.weight ?? '0')),
```

> `hasAnswer` 검증(`> 0`)이 이미 있으므로, UI 통해 접근 시 0이 입력될 수 없음.
> 폴백 0은 `validateSafety()`의 BMI 계산에서 잡힘 (0/height^2 = 0 → BMI 이상).

### 3.3 FR-3 — validateSafety 최소 칼로리 체크

```typescript
// ai-planner.ts — Mifflin-St Jeor BMR 추가
function estimateDailyCalories(data: OnboardingData): number {
  // BMR (Mifflin-St Jeor)
  const bmr =
    data.gender === 'female'
      ? 10 * data.weight + 6.25 * data.height - 5 * data.age - 161
      : 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
  return bmr * 1.2; // 최소 활동 계수 (sedentary)
}

// validateSafety() 내 추가
if (data.goal === 'weight_loss') {
  const tdee = estimateDailyCalories(data);
  const targetCalories = tdee - 500; // 표준 감량 적자
  if (targetCalories < 1200) {
    return {
      blocked: true,
      reason: 'below_minimum_calories',
      message:
        `신체 조건 기준 권장 감량 칼로리(${Math.round(targetCalories)}kcal)가\n` +
        '안전 기준(1,200kcal) 미만입니다.\n' +
        '목표 조정 또는 전문가 상담을 권장합니다.',
    };
  }
}
```

---

## 4. 성공 기준

| ID | 기준 |
|----|------|
| SC-1 | 프로필 탭에 나이/키/체중 입력한 유저 → 온보딩 해당 필드 자동 채워짐 |
| SC-2 | 프로필 미설정 유저 → 빈 입력창으로 시작, 앱 크래시 없음 |
| SC-3 | `?? '30'`, `?? '170'`, `?? '70'` 코드 0건 |
| SC-4 | 1200kcal 미만 감량 조건 → `validateSafety()` blocked: true 반환 |

---

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| `user_profiles` 컬럼명 — 확인 완료: `height_cm`, `weight_kg`, `age`, `.eq('id', userId)` | Plan에 반영됨 |
| 프로필 미설정 유저 — 컬럼값 null | 각 필드 조건부 spread `...(data.age ? ... : {})` |
| BMR 계산 시 age=0 엣지케이스 | `validateSafety()` 상단에서 age > 0 검증 추가 |

---

## 6. 구현 모듈 (Session Guide)

| 모듈 | 파일 | 내용 |
|------|------|------|
| module-1 | `src/screens/ai/ai-onboarding-screen.tsx` | useEffect 추가 + 폴백 제거 |
| module-2 | `src/lib/ai-planner.ts` | `estimateDailyCalories()` + `validateSafety()` 칼로리 체크 |
