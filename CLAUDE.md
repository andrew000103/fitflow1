## 마지막 업데이트
- 날짜: 2026-03-29

---

## AI 플랜 기능 개발 현황

### 핵심 모듈 (완료)
- **module-1** 완료: DB 마이그레이션(`ai_plans` 테이블, `user_profiles.ai_consent` 컬럼), navigation 타입, `ai-plan-store.ts`, `ai-planner.ts`
- **module-2** 완료: `ai-consent-screen.tsx`, `ai-onboarding-screen.tsx` (9문항, Phase1+2), 네비게이터 모달 스택, root-navigator ai_consent 체크
- **module-3** 완료: `ai-plan-result-screen.tsx` (운동/식단 탭), 홈 `AIPlanCard` (3가지 상태)
- **module-4** 완료: `ai-plan-weekly-screen.tsx` (지난 주 vs 이번 주 비교, 플랜 적용/유지 버튼), `ai-plan-store.ts`에 `previousPlan` + `restorePreviousPlan()` 추가, `root-navigator`에서 앱 재시작 시 Supabase `ai_plans` 로드

### 추가 개선 완료 (2026-03-27)
- **ai-plan-start-date** (PDCA 완료, 93%): 플랜 시작일 커스텀 설정
  - `ai-plan-result-screen.tsx`: `StartDateSheet` 하단 모달
  - `ai-planner.ts`: `getMondayOf(date)` 헬퍼 export
  - `ai-plan-store.ts`: `updateWeekStart(weekStart)` 액션
- **ai-onboarding-improvements** (PDCA 완료, 98%): 온보딩 UX 개선
  - `ai-onboarding-screen.tsx`: 1RM 계산기 모달 (`OneRMCalcModal`, Epley 공식)
  - `ai-plan-result-screen.tsx`: `RegenBottomSheet` 재생성 선택 모달
  - `plateauHistory` 질문 문구 개선

### 버그 수정 완료 (2026-03-29)
- **AI 플랜 생성 버그 4종 수정** (다계정 환경 포함):
  1. Edge Function `thinkingBudget: 0` — gemini-2.5-flash thinking 활성화로 인한 파싱 실패 수정
  2. 온보딩 마지막 스텝 버튼 항상 활성화 (`canProceed = isLastStep || hasAnswer`)
  3. 계정 전환 시 AI 플랜 스토어 리셋 (`onAuthStateChange`에서 다른 user_id 감지 시 reset)
  4. `validateSafety` 과도한 칼로리 사전 차단 제거 (정상 여성 사용자 차단 문제) — post-generation minCalories 보정으로 대체

### Day1~Day7 포맷 변경 완료 (2026-03-29)
- **`WorkoutDay` 타입 변경**: `dayOfWeek: 'mon'|...|'sun'` → `dayLabel: 'day1'|...|'day7'`
- **`ai-planner.ts`**: Gemini 프롬프트 JSON 스키마 → `dayLabel: "day1"~"day7"`, `weekStart` = 플랜 생성 당일 (Day 1 기본값)
- **`ai-plan-result-screen.tsx`**: WorkoutDayCard → "Day 1 / 3/29 (토)" 형식 표시, StartDateSheet 재작성 (아무 날이나 Day 1로 설정, Day 1~7 날짜 미리보기)
- **`home-screen.tsx` / `workout-screen.tsx`**: 오늘 날짜와 weekStart 차이로 오늘 dayLabel 계산
- 기존 AsyncStorage 플랜(dayOfWeek 포맷)은 재생성 시 자동 교체됨

### API 결정 사항 (최종)
- **LLM 엔진**: Google Gemini (`gemini-2.5-flash`) — Supabase Edge Function 경유 호출
- **보안**: `EXPO_PUBLIC_GEMINI_API_KEY` 클라이언트 번들에서 완전 제거
- **Edge Function**: `supabase/functions/generate-ai-plan/index.ts` 배포 완료 (ACTIVE)
  - `thinkingConfig: { thinkingBudget: 0 }` 적용 (thinking 비활성화로 타임아웃 방지)
  - `responseMimeType` 미사용 (Gemini 400 오류 유발)

### P2 안정화 완료 (2026-03-26)
- **테이블 통일**: `program-review-screen.tsx` — `profiles` → `user_profiles`, `birthYear` → `age` 교체
- **버그 수정**: `ai-planner.ts` — `workout_sessions.completed_at` → `ended_at`, `user_profiles` `.eq('user_id')` → `.eq('id')`
- **버그 수정**: `profile-screen.tsx` Zustand 무한루프 수정 (object selector → separate selectors)
- **버그 수정**: `AppButton` `loading` prop TypeScript 오류 수정

### 주요 파일 구조 (AI 플랜)
```
src/
  lib/ai-planner.ts              # Gemini Edge Function 호출, 안전성 검증, Supabase 저장, getMondayOf 헬퍼
  stores/ai-plan-store.ts        # Zustand + AsyncStorage (WorkoutDay.dayLabel, previousPlan, updateWeekStart)
  screens/ai/
    ai-consent-screen.tsx        # 데이터 동의 화면
    ai-onboarding-screen.tsx     # 9문항 온보딩 + 1RM 계산기 모달 (Phase1 필수 + Phase2 선택)
    ai-plan-result-screen.tsx    # 플랜 결과 (Day1~7 표시) + StartDateSheet + RegenBottomSheet
    ai-plan-weekly-screen.tsx    # 주간 플랜 비교 (지난 주 vs 이번 주)
  navigation/
    main-navigator.tsx           # RootStack: Main(탭) + AI 모달 화면들
    root-navigator.tsx           # 로그인 후 ai_consent 체크, 앱 재시작 시 플랜 로드
```

---

## 완료된 기능 (화면별)
- **홈 탭**: 메인 대시보드. 오늘 칼로리/매크로 요약, 주간 칼로리 차트, 오늘 운동 상태, 주간 운동 횟수, 최근 체중 트렌드, **AI 플랜 카드** 표시. 식단 합계는 `diet-store` 로컬, 운동/체중은 Supabase(`workout_sessions`, `body_weights`).
- **운동 탭**: 운동 시작, 세트/반복/중량 기록, 휴식 타이머, 운동 요약, 히스토리, 종목 검색, 프로그램 탐색/생성/상세/등록, nSuns Training Max 입력. nSuns 시작 시 TM 미설정이면 TrainingMaxSetup으로 리디렉트. AMRAP 결과 기반 TM 증가 제안 및 Supabase 저장 동작.
- **식단 탭**: 오늘 식단 요약, 식사 시간대별 목록, 음식 검색(커스텀 + MFDS + OpenFoodFacts + USDA), 직접 입력, 커스텀 음식 생성/수정.
- **프로필 탭**: `user_profiles`, `user_goals`, `body_weights` 기반 프로필/목표/체중 편집. 닉네임, 아바타, 나이, 키, 체중, 성별, 목표 칼로리/매크로, 체중 기록 추가/조회.
- **인증 화면**: 로그인, 회원가입, 익명 로그인. Supabase Auth 연동. `root-navigator`에서 세션 분기.

---

## Supabase 연동 현황
- **실제 데이터 연동**: 인증, 운동 세션/세트(`workout_sessions`, `workout_sets`), 종목(`exercises`), 프로그램(`programs`, `program_days`, `program_exercises`, `user_programs`, `user_program_tms`), 프로필(`user_profiles`, `user_goals`, `body_weights`), 음식(`foods`, `meal_items`), 리뷰(`program_reviews`), AI 플랜(`ai_plans`)
- **로컬 캐시**: 식단 일일 합계는 `diet-store` 로컬 기준 — 앱 재시작 시 `root-navigator`에서 `meal_items` 복원 동작함

---

## 다음 작업 (우선순위 순)

### P1 — 디바이스 검증 / 문서
1. **AI 플랜 생성 end-to-end 테스트**: 버그 수정 후 다계정(특히 여성/체중감량 목표) 재검증
2. **nSuns 디바이스 테스트**: 프로그램 등록 → TM 설정 → 세션 → AMRAP → 요약 end-to-end 검증
3. **`docs/schema.md` 최신화**: 실제 테이블과 불일치 — `body_weights`, `user_profiles`, `ai_plans` 미반영
4. **`profiles` 테이블 Supabase에서 삭제**: 코드 참조 제거 완료, DB 테이블만 잔존

### P2 — AI 플랜 고도화
5. **운동 종목 교체 기능** (ai-plan-trust-upgrade M3~M5 미완):
   - `src/lib/exercise-alternatives.ts`: 종목별 대체 운동 정적 테이블 (~30개 종목)
   - `SwapExerciseSheet` 컴포넌트 + `ai-plan-result-screen.tsx` 연동
   - `workout-session-screen.tsx`에 AI 플랜 세션 중 종목 교체 버튼
6. **AI 플랜 적응형 강도 고도화**: 현재 rule-based 조정 → 더 정교한 피드백 루프 (장기 과제)

### P3 — 구조 개선
7. **음식 스키마 통일**: `diet-search.ts`(평면) vs `custom-food-db.ts`(정규화) 하나로 정리 (PDCA `food-schema-unification` 설계 완료, 미적용)

---

## 알려진 버그/미완성
- 음식: `diet-search.ts`(평면) + `custom-food-db.ts`(정규화) 스키마 이중화로 구조 불안정
- `docs/schema.md` / `docs/spec.md` 실제 코드와 불일치 (문서 오래됨)
- `root-navigator` 로그인 시 `migrateLocalCustomFoodsToSupabase` 자동 실행 → 중복/혼선 주의
- `docs/seed_nsuns_programs.sql`: Supabase SQL Editor에서 수동 실행 필요. 중복 실행 안전.
- `profiles` 테이블: Supabase DB에 잔존 (코드 참조는 제거됨, DB에서 수동 삭제 필요)
- AI 플랜 `dayLabel` 포맷 변경: 기존 AsyncStorage에 저장된 플랜(`dayOfWeek` 포맷)은 재생성 필요

---

## 기술 스택 메모
- React Native + Expo (managed workflow)
- Supabase (PostgreSQL, Auth, RLS)
- Zustand + AsyncStorage persist
- React Navigation v6 (Stack + Tab 중첩)
- AI: Google Gemini (`gemini-2.5-flash`) — Supabase Edge Function 경유 (`supabase/functions/generate-ai-plan/`)
- Gemini API 키: Supabase Secret (`GEMINI_API_KEY`) — 클라이언트 번들 미포함
