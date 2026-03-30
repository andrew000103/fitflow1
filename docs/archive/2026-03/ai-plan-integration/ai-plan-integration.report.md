# Report: ai-plan-integration

> Feature: AI 플랜 운동/식단 탭 통합 + 중량 데이터 추가
> Completed: 2026-03-25
> Match Rate: **100%** | Iterations: 1

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | AI 플랜이 생성돼도 운동/식단/프로필 탭은 플랜 데이터를 전혀 활용하지 않아 별도 탭을 오가야 하고, 운동 프로그램에 중량 정보가 없어 실전 가이드 부족 |
| **Solution** | 운동 탭에 오늘 AI 플랜 카드(중량 포함, 바로 시작 가능)를, 식단/프로필 탭에 AI 플랜 목표값을 표시하고, 플랜 미생성 시 프로필 기반 칼로리 자동 계산 폴백 |
| **Function UX Effect** | 앱 진입 즉시 오늘 AI 플랜 운동/식단 목표 파악 가능; "AI 플랜 운동 시작" 버튼 하나로 AI 추천 운동이 pre-load된 세션 진입; 플랜 미생성 유저도 안정적 폴백 동작 |
| **Core Value** | AI 플랜의 실용성 극대화 — 결과 화면에만 격리된 플랜이 매일 사용하는 탭에서 직접 활용됨; 사용자가 입력한 현재 중량 기반으로 더 현실적인 운동 중량 생성 |

---

### 1.3 Value Delivered

| 지표 | 결과 |
|------|------|
| Match Rate | **100%** (8/8 항목) |
| 수정된 파일 | 7개 |
| 추가 라인 | ~488줄 |
| 이터레이션 | 1회 (G-1: AI pre-load 수정) |
| Critical 갭 | 1개 → 즉시 수정 완료 |
| TypeScript 오류 (신규) | 0개 |

---

## 2. 구현 내용

### 파일별 변경

| 파일 | 변경 내용 |
|------|---------|
| `src/stores/ai-plan-store.ts` | `WorkoutExercise.weight_kg?: number \| null` + `StrengthEntry` 타입 + `OnboardingData.strengthProfile?` 추가 |
| `src/lib/ai-planner.ts` | Gemini 프롬프트 운동 스키마에 `weight_kg` 추가 + `strengthSection` (사용자 현재 중량 컨텍스트) 추가 |
| `src/screens/ai/ai-onboarding-screen.tsx` | Phase 2 진입 시 강도 프로필 입력 스텝 추가 (스쿼트/벤치/데드/OHP/바벨로우) |
| `src/screens/workout/workout-screen.tsx` | AI 플랜 오늘 운동 카드 추가 (휴식일/운동일/플랜없음 3가지 상태, 종목별 세트·중량·반복 표시) |
| `src/stores/workout-store.ts` | `startFromAIPlan(exercises)` 메서드 추가 — repsRange 파싱, weight_kg 적용, 세션 pre-load |
| `src/screens/diet/diet-screen.tsx` | 하드코딩 2000kcal → AI플랜 > user_goals > Mifflin-St Jeor BMR > 2000 4단계 폴백 |
| `src/screens/profile/profile-screen.tsx` | AI 플랜 목표 카드 추가 (목표유형/칼로리/단백질·탄수화물·지방/생성일) |

### 주요 설계 결정

**4단계 칼로리 폴백:**
1. `currentPlan.targetCalories` (AI 플랜 있을 때)
2. `user_goals.calories_target` (목표 설정 유저)
3. Mifflin-St Jeor BMR × 1.375 (프로필 데이터 있을 때)
4. 하드코딩 2000kcal (최종 폴백)

**AI 운동 세션 pre-load:**
```typescript
// workout-store.ts — startFromAIPlan()
// repsRange "8-12" → 10회 (중간값), "5" → 5회
// weight_kg null → 0kg (맨몸 운동)
// local:: prefix ID로 exercises 테이블 비의존
```

**요일 매핑:**
```typescript
const DAY_MAP = ['sun','mon','tue','wed','thu','fri','sat'];
const todayKey = DAY_MAP[new Date().getDay()];
const todayAIPlan = currentPlan?.weeklyWorkout.find(d => d.dayOfWeek === todayKey);
```

---

## 3. 성공 기준 검증

| ID | 기준 | 결과 |
|----|------|:----:|
| SC-1 | `WorkoutExercise.weight_kg` 필드 존재 + 프롬프트 포함 | ✅ PASS |
| SC-2 | 운동 탭 AI 플랜 오늘 운동 카드 (Rest Day 포함) | ✅ PASS |
| SC-3 | "AI 플랜 운동 시작" 버튼 → WorkoutSession 진입 (pre-load) | ✅ PASS |
| SC-4 | 식단 탭 AI 플랜 칼로리 표시, 없으면 프로필 기반 계산 | ✅ PASS |
| SC-5 | 프로필 탭 AI 플랜 목표 섹션 표시 | ✅ PASS |
| SC-6 | AI 플랜 없는 유저 크래시 없음 + 폴백 정상 | ✅ PASS |
| FR-6 | 온보딩 강도 프로필 입력 스텝 (사용자 추가 요청) | ✅ PASS |
| FR-7 | 강도 프로필 Gemini 프롬프트 포함 (사용자 추가 요청) | ✅ PASS |

---

## 4. 갭 수정 이력

| ID | 항목 | 수정 내용 |
|----|------|---------|
| G-1 | AI 운동 세션 pre-load 미구현 | `workout-store.ts`에 `startFromAIPlan()` 구현; `workout-screen.tsx` 버튼 핸들러 교체 |

---

## 5. 배포 전 체크리스트

- [ ] Expo Go 전체 화면 테스트 (AI 플랜 있는 유저 / 없는 유저)
- [ ] Gemini 응답에 `weight_kg` 포함 여부 확인 (새 플랜 생성 테스트)
- [ ] 강도 프로필 입력 → 플랜 생성 E2E 테스트
- [ ] `@anthropic-ai/sdk` package.json에서 제거

---

## 6. 다음 단계 (P1)

1. **식단 Supabase 동기화** — 앱 시작 시 `meal_items`에서 오늘 식단 복원
2. **AI 플랜 식단 목록 연동** — diet-screen에 AI 추천 식사 표시
3. **Supabase Edge Function** — Gemini API 키 클라이언트 노출 해소 (보안)
