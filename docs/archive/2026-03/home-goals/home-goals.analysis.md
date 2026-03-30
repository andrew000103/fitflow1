# Analysis: home-goals

> Feature: 홈 목표값 연결 (user_goals 테이블)
> Analyzed: 2026-03-25
> Match Rate: **100%**

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 프로필 탭 목표 저장 기능이 완성됐으나 홈 탭에 연결이 안 돼 있음 |
| **WHO** | 프로필 탭에서 목표 칼로리/매크로를 설정한 모든 로그인 유저 |
| **RISK** | `user_goals` 미설정 유저는 기본값으로 폴백 — 기존 동작 유지 |
| **SUCCESS** | 프로필에서 목표 저장 → 홈 탭 목표값 갱신 + 탭 전환 시 즉시 반영 |
| **SCOPE** | `src/screens/home/home-screen.tsx` 1개 파일만 수정 |

---

## 1. Gap 분석 결과

### 1.1 Match Rate

| 항목 | 수 |
|------|----|
| 계획 요구사항 | 6 |
| 구현 완료 | 6 |
| Gap | 0 |
| **Match Rate** | **100%** |

---

## 2. 요구사항 검증

### 2.1 기능 요구사항 (FR)

| ID | 요구사항 | 상태 | 확인 근거 |
|----|---------|------|----------|
| FR-1 | `fetchRemote()`에서 `getLatestUserGoal(userId)` 호출 → goals state 설정 | ✅ | `home-screen.tsx:401-411` — 독립 try/catch 내 `getLatestUserGoal(user.id)` 호출 |
| FR-2 | 하드코딩 상수 제거 → goals state 사용 (CalorieRing, MacroBars, WeeklyCalorieChart) | ✅ | `CAL_GOAL` 등 4개 상수 0건. `goals.*` 7곳 사용 확인 |
| FR-3 | `user_goals` 미설정 유저 → 기본값 폴백 (2200/150/250/60) | ✅ | `DEFAULT_GOALS` 상수 + `goal.calories_target ?? DEFAULT_GOALS.calories` |

### 2.2 비기능 요구사항 (NFR)

| ID | 요구사항 | 상태 | 확인 근거 |
|----|---------|------|----------|
| NFR-1 | 신규 패키지 없음 | ✅ | `getLatestUserGoal()` 재사용 (`profile.ts` 기존 함수) |
| NFR-2 | goals 쿼리 실패 시 기본값 유지 (독립 try/catch) | ✅ | `home-screen.tsx:401-411` — 별도 try/catch 블록 |
| NFR-3 | 기존 UI 컴포넌트 시그니처 변경 없음 | ✅ | CalorieRing, MacroBars, WeeklyCalorieChart props 변경 없음 |

---

## 3. 성공 기준 검증 (SC)

| ID | 기준 | 결과 |
|----|------|------|
| SC-1 | `user_goals` 데이터 있는 유저 → 저장된 값으로 표시 | ✅ `setGoals({ calories: goal.calories_target ?? ... })` |
| SC-2 | `user_goals` 미설정 유저 → 기본값(2200/150/250/60) 표시 | ✅ `useState(DEFAULT_GOALS)` + null 가드 |
| SC-3 | goals 쿼리 오류 → 기본값 유지, 앱 크래시 없음 | ✅ 독립 catch `{}` |
| SC-4 | 하드코딩 상수(`CAL_GOAL` 등) 완전 제거 | ✅ 0건 확인 |

---

## 4. 계획 외 추가 구현 (보너스)

Plan 범위를 초과하지 않으며, 모두 UX 품질 향상 또는 버그 수정입니다.

| 항목 | 내용 |
|------|------|
| `useFocusEffect` 적용 | `useEffect` → `useFocusEffect` — 프로필 탭에서 돌아올 때 즉시 갱신 (사용자 추가 요청) |
| `ringOverlay` 제거 | CalorieRing 내부 텍스트와 중복 오버레이 제거 (UI 버그 수정) |
| `ProfileNavigator` import 추가 | `main-navigator.tsx` ReferenceError 버그 수정 |
| `isDark` destructure 추가 | `WeightLineChart`의 TDZ 오류 수정 |
| `goals` state 선언 위치 수정 | TDZ 오류 수정 (선언 전 사용) |

---

## 5. Gap 목록

없음. 계획된 모든 요구사항이 구현됐습니다.

---

## 6. 결론

Match Rate **100%**. 계획된 모든 FR/NFR/SC가 구현됐으며 추가 버그 5건도 함께 수정됐습니다.

다음 단계: `/pdca report home-goals`
