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
- 퍼소나 시스템: 현재는 온보딩 + 최근 행동을 섞는 휴리스틱 추정치이며, 사용자 정체성의 확정 판정이 아니다. QA/운영에서는 결과가 재계산 시 달라질 수 있다는 전제와 함께, 중립적/격려형 문구 유지 여부를 수동 확인해야 한다.

---

## 기술 스택 메모
- React Native + Expo (managed workflow)
- Supabase (PostgreSQL, Auth, RLS)
- Zustand + AsyncStorage persist
- React Navigation v6 (Stack + Tab 중첩)
- AI: Google Gemini (`gemini-2.5-flash`) — Supabase Edge Function 경유 (`supabase/functions/generate-ai-plan/`)
- Gemini API 키: Supabase Secret (`GEMINI_API_KEY`) — 클라이언트 번들 미포함

---

## 오늘 작업 로그 (2026-03-30)

### 1. 웹앱 접근 경로 추가 및 배포 정리
- 목표: 기존 Expo 네이티브 앱 코드를 최대한 유지하면서 웹 URL로도 접속 가능하게 만들기
- 원칙:
  - **네이티브 iOS/Android UI/동작은 건드리지 않기**
  - 웹 전용 변경은 `Platform.OS === 'web'` 또는 웹 빌드 후처리로만 처리
- 적용 내용:
  - `package.json`
    - `build`: `expo export --platform web && node scripts/postprocess-web-export.js`
  - `App.tsx`
    - 웹에서만 중앙 정렬 + 모바일 폭 컨테이너 적용
    - 웹에서만 아이콘 폰트 preload
  - `scripts/postprocess-web-export.js`
    - Expo web export 후 `@expo/vector-icons` 폰트 경로를 Cloudflare Pages에서 안전하게 서빙되는 경로로 재작성
- 배경:
  - Cloudflare Pages에서 `MaterialCommunityIcons.ttf`가 HTML로 잘못 응답되어 아이콘이 네모 박스로 보이거나 폰트 decode 에러가 발생했음
  - 후처리 스크립트로 `dist/assets/expo-vector-icons/Fonts/` 경로로 복사/치환해서 해결

### 2. Cloudflare Pages 배포 관련 메모
- Pages에서 반드시 넣어야 하는 공개 환경변수:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- 선택:
  - `EXPO_PUBLIC_MFDS_API_KEY`
  - `EXPO_PUBLIC_USDA_API_KEY`
- **절대 넣으면 안 되는 것**:
  - `SUPABASE_SERVICE_ROLE_KEY`
- Cloudflare Pages build 설정:
  - Build command: `npm run build`
  - Build output directory: `dist`
- 참고:
  - 웹은 `.env`를 자동으로 읽지 않으므로 Pages 설정에서 직접 등록해야 함

### 3. AI 플랜 기존 계정 진입 오류 수정
- 증상:
  - 예전에 생성한 AI 플랜이 있는 계정에서 결과 화면 진입 시 `dayLabel.replace(...)` 크래시
- 원인:
  - 구버전 플랜은 `weeklyWorkout[].dayOfWeek`
  - 현재 코드는 `weeklyWorkout[].dayLabel`만 기대
- 수정:
  - `src/stores/ai-plan-store.ts`
    - legacy 포맷 자동 정규화 추가
    - `dayOfWeek -> dayLabel` 변환
    - persist rehydrate/migrate 시 구플랜 자동 변환
    - `setCurrentPlan()` / `restorePreviousPlan()`에서도 normalize 적용
- 결과:
  - 예전 계정/로컬 캐시의 AI 플랜도 현재 포맷으로 읽힘

### 4. 음식 검색: DB 우선, 웹 CORS 회피, 관련도 랭킹 개선
- 배경 문제:
  - `foods` 테이블에 있는 음식이 검색 결과에 잘 안 뜸
  - 웹에서는 MFDS / OpenFoodFacts / USDA가 CORS로 자주 막힘
  - `"닭가슴살"` 검색 시 순수 닭가슴살보다 가공식품이 위에 오는 문제

#### 4-1. 웹 검색 안정화
- `src/lib/food-search.ts`
  - DB 검색을 최우선으로 수행
  - DB 결과가 있으면 바로 반환
  - 웹에서는 외부 API CORS 실패 때문에 전체 검색이 깨지지 않도록, DB 결과가 없으면 외부 API를 강하게 의존하지 않게 조정

#### 4-2. 검색 관련도 랭킹 설계/구현
- 목표:
  - 정확 일치 > 정규화 일치 > 접두 일치 > 부분 일치
  - 원식품 > 가공식품
  - 브랜드 없는 기본 식품 우선
- 핵심 구현 파일:
  - `src/lib/food-search-ranking.ts`
    - 랭킹 공용 helper 신설
    - `normalizeSearchText`
    - `hasWordBoundaryPrefixMatch`
    - `scoreFoodRow`
    - `scoreFoodItem`
    - tie-break helper
  - `src/lib/diet-search.ts`
    - Supabase `foods` 검색 후보 추출 + 점수 기반 정렬
  - `src/lib/food-search.ts`
    - DB/외부 API 결과 dedupe 후 공용 랭킹으로 최종 재정렬
- 반영된 랭킹 규칙:
  - exact match / normalized exact match
  - word-boundary prefix match
  - startsWith / includes
  - 이름 길이 보너스
  - 원식품 보너스
  - `닭가슴살`, `고구마`, `현미밥`, `계란`, `달걀`, `바나나`, `두부`, `오트밀`, `감자`, `쌀` 검색어 우대
  - 가공식품 키워드 패널티
  - 브랜드 없는 기본 식품 우선
  - source 소폭 가중치
- 현재 판단:
  - 설계안 대비 구현 일치율은 **약 97~98%**
  - 남은 건 “검색어별 추가 예외 사전 튜닝” 수준

### 5. 앱 타입체크 정리
- 문제:
  - `npx tsc --noEmit` 시 `supabase/functions/generate-ai-plan/index.ts`의 Deno import 때문에 타입에러
- 수정:
  - `tsconfig.json`
    - `"exclude": ["supabase/functions"]`
- 의미:
  - 앱(TypeScript/Expo) 검증과 Supabase Edge Function(Deno) 검증 경로를 분리
  - 앱 코드 타입체크는 정상 통과

---

## 오늘 검증 결과
- `npm run build`: 통과
- `npx tsc --noEmit`: 통과
- GitHub push 완료

### 오늘 주요 커밋
- `4ac175a` `build: add web export script for cloudflare pages`
- `99cb588` `fix: rewrite web icon font assets for cloudflare pages`
- `2501b24` `fix: migrate legacy ai plans to dayLabel format`
- `c5322e9` `feat: refine food search relevance ranking`
- `55306c3` `refactor: share food search ranking rules`

---

## 현재 우려 사항 / 다음 AI가 먼저 확인할 것

### A. 네이티브 앱 불변 원칙
- 사용자가 강하게 요청한 조건:
  - **웹 작업 때문에 네이티브 앱이 바뀌면 안 됨**
- 따라서 이후 작업 원칙:
  - 웹 전용 변경만 허용
  - 공통 컴포넌트 수정 시 네이티브 영향 여부 먼저 확인
  - 가능하면 `Platform.OS === 'web'` 분기 또는 웹 export 후처리 사용

### B. 웹 음식 검색의 구조적 한계
- 웹에서 MFDS / OpenFoodFacts / USDA는 CORS 이슈가 여전히 있음
- 현재는 DB 우선으로 UX를 방어하고 있지만, 장기적으로는 아래가 필요:
  - Supabase Edge Function 또는 서버 프록시로 외부 음식 API 중계
- 즉, 현재 웹 검색은 “DB 중심으로 안정화”된 상태이지, 외부 API까지 완전 해결된 상태는 아님

### C. 검색 품질은 앞으로 튜닝 가능
- 현재 랭킹은 꽤 좋아졌지만, 아래 검색어는 실제 수동 테스트 추천:
  - `닭가슴살`

---

## 추가 작업 로그 (2026-03-30)

### 6. 퍼소나 시스템 1차 구현 및 안정화
- 목표:
  - 온보딩 + 최근 행동 데이터를 함께 써서, 초반에는 부담 없이 동기를 주고 데이터가 쌓일수록 정교해지는 퍼소나 시스템 추가
- 신규 파일:
  - `src/lib/persona-engine.ts`
  - `src/stores/persona-store.ts`
  - `src/components/home/persona-summary-card.tsx`
- 반영 화면:
  - `src/screens/home/home-screen.tsx`
- 핵심 내용:
  - `starter / learning / established` 단계 기반 퍼소나 계산
  - `dailyState`, `headlineMessage`, `confidence`, `sourceBreakdown`, `dataCompleteness` 계산
  - 홈 상단에 퍼소나 요약 카드 추가
  - `"활기찬 리트리버 페르소나"` 같은 표기에서 접미사 `"페르소나"` 제거
  - `RESTING`, `ACTIVE`, `HUNGRY` 같은 상태 기반 아이콘 사용

#### 6-1. 퍼소나 안정화 후속 수정
- `user goal > onboarding > default` 우선순위로 목표 적용
- 입력 sanity check 추가 (age/height/weight/workoutDays)
- 계산 실패 시 stale persona clear
- low readiness / low completeness 시 confidence 보수화
- `supportingMessage`, `reliabilityState`, `validationWarnings` 추가
- 홈 포커스/원격 fetch에 latest-request guard 추가
- 운영 메모:
  - 퍼소나는 현재 휴리스틱 기반 추정치이며 확정 판정이 아님
  - QA/운영 시 중립적/격려형 문구 유지 여부 수동 검증 필요

### 7. 홈 탭 목표 칼로리/매크로 반영 순서 수정
- 문제:
  - 홈 탭 목표값이 AI 플랜보다 `user_goals` 또는 기본값 위주로 보일 수 있었음
- 수정:
  - `src/screens/home/home-screen.tsx`
  - 우선순위 변경:
    1. 승인된 AI 플랜 목표
    2. `user_goals`
    3. 기본값

### 8. AI 플랜 승인 적용 UX 도입
- 목표:
  - AI 플랜 결과를 단순 참고가 아니라 사용자가 승인 후 실제 계획으로 채택하도록 변경
- 핵심 파일:
  - `src/screens/ai/ai-plan-result-screen.tsx`
  - `src/stores/ai-plan-store.ts`
  - `src/screens/home/home-screen.tsx`
  - `src/screens/workout/workout-screen.tsx`
  - `src/screens/diet/diet-screen.tsx`
  - `src/screens/profile/profile-screen.tsx`

#### 8-1. 결과 화면 UX 변경
- 상단 우측 액션:
  - `재생성` → `완료`
- 하단 액션:
  - primary: `이 플랜 적용하기`
  - secondary: `다른 플랜 받아보기`
  - 보조: `플랜 시작일 변경`
- 적용 시트:
  - `운동`
  - `식단`
  - `목표`
  - 3개 섹션을 개별 선택 후 승인 가능

#### 8-2. 승인 상태 메타 저장
- `src/stores/ai-plan-store.ts`
  - `AIPlan`에 아래 메타 추가:
    - `isApplied`
    - `appliedAt`
    - `appliedSections`
  - `markCurrentPlanApplied()` 액션 추가
  - persist version 2로 마이그레이션

#### 8-3. 실제 반영 규칙
- **목표 적용**:
  - 승인 시 `user_goals`에 `calories_target`, `protein_target_g`, `carbs_target_g`, `fat_target_g` 저장
- **운동 적용**:
  - 승인된 `workout` 섹션이 있어야 운동 탭에서 현재 AI 운동 계획 표시/시작 가능
- **식단 적용**:
  - 승인된 `diet` 섹션이 있어야 식단 탭에서 AI 식단 가이드 표시
- **미적용 플랜**:
  - 홈/운동/식단에서 실사용 플랜처럼 자동 반영되지 않음

#### 8-4. 정합성 보강
- 적용 직후 성공 피드백 추가:
  - 어떤 섹션이 반영됐는지 Alert로 명시
- 홈 카드:
  - `검토 중인 AI 플랜` vs `반복 중인 AI 플랜` 구분
  - 적용 섹션 요약 표시
- 운동 탭:
  - `현재 적용 중인 AI 운동 계획`
  - 몇 주차 / Day 몇 기준인지 표시
- 식단 탭:
  - `적용된 AI 식단 가이드`
  - 몇 주차 / Day 몇 기준 추천인지 표시
- 프로필 탭:
  - `AI 플랜 초안` vs `AI 플랜 목표` 구분
  - 승인 시점(`appliedAt`) 표시

### 9. Codex용 PDCA 운영 기반 추가
- 목적:
  - 이 프로젝트와 이후 작업에서 `plan / design / do / analyze` 흐름을 Codex 기준으로 재사용 가능하게 만들기
- 추가 경로:
  - `.codex/skills/pdca-orchestrator/`
  - `.codex-pdca/`
  - `scripts/pdca.js`
  - `bin/pdca`
  - `scripts/install-pdca-shell.sh`
- 포함 내용:
  - Codex 전용 `pdca-orchestrator` skill
  - 상태/메모리/룰 디렉터리
  - `pdca plan`, `pdca design`, `pdca do`, `pdca analyze`
  - `pdca status`, `pdca next`, `pdca report`, `pdca team`
- 참고:
  - 이 시스템은 Codex 로컬/전역 skill + 프로젝트 규칙 기반 운영 레이어이며, Claude Code의 네이티브 slash command와 동일한 구현은 아님

### 10. 오늘 검증 메모
- `npm exec tsc -- --noEmit`: 통과
- AI 플랜 승인 적용 설계 대비 구현 정합성:
  - 초기 구현 후 약 `93%`
  - 정합성 보강 후 `95%+` 수준으로 판단
  - `훈제 닭가슴살`

---

## 모바일 최적화 업데이트 (2026-03-30)

### 요약
- 웹 URL로 모바일에서 접속했을 때 비율이 깨지고, AI 플로우 화면 일부가 화면 밖으로 밀리는 문제를 정리함
- 작업은 **Phase 1 → Phase 2 → Phase 3**로 나눠서 진행했고, 각 phase 완료 후 설계안 대비 일치도 검토/보완까지 수행함
- 최종적으로 AI 플로우 주요 화면은 모바일 웹 + 네이티브 공통 기준으로 재정리됨

### 이번 작업의 핵심 원칙
- 기존 기능 로직은 최대한 유지하고, **레이아웃 구조와 모바일 UX만 정리**
- 네이티브 앱과 모바일 웹이 모두 안정적으로 동작하도록 공통 레이아웃 기준 도입
- absolute footer 제거, safe area 반영, 작은 화면 compact 대응을 우선 적용

### Phase 1 — 기반 레이아웃 정비 완료
- `App.tsx`
  - 웹 프레임을 **모바일 웹 / 데스크톱 웹**으로 분기
  - 모바일 웹에서는 기존 `maxWidth: 430` 카드 프레임을 사실상 해제하고 full-bleed에 가깝게 동작하도록 조정
- `src/components/ai/AIFlowScreen.tsx`
  - 신규 공통 레이아웃 컴포넌트 추가
  - 구조: `header + scroll body + footer`
  - `SafeAreaView`, `KeyboardAvoidingView`, footer inset, 공통 scroll 규칙 통합
- `src/screens/ai/ai-consent-screen.tsx`
- `src/screens/ai/ai-onboarding-screen.tsx`
- `src/screens/ai/ai-plan-weekly-screen.tsx`
  - 기존 `position: 'absolute'` 하단 CTA 제거
  - 공통 `AIFlowScreen` 위로 옮겨 footer가 본문을 덮지 않도록 정리

### Phase 2 — 온보딩 모바일 UX 정리 완료
- 대상 파일: `src/screens/ai/ai-onboarding-screen.tsx`
- 반영 내용:
  - compact 화면 기준 (`width < 380 || height < 760`) 도입
  - 질문 화면 패딩/타이포/옵션 카드 spacing 반응형 조정
  - 숫자 입력 화면에서 단위 라벨이 작은 화면에 맞게 자연스럽게 내려가도록 정리
  - 입력 포커스 시 `scrollTo` 보정 추가로 키보드 가림 리스크 완화
  - 강도 프로필 입력을 한 줄 배치에서 **카드형 세로 구조**로 변경
  - `1RM` 계산기 모달도 작은 화면에서는 세로 배치로 동작하도록 조정
  - 장비 선택 sheet는 스크롤 본문 + 하단 완료 액션 구조로 재작성
- 설계안 대비 최종 일치도 판단: **약 97%**

### Phase 3 — AI 플로우 마감 정리 완료
- 대상 파일:
  - `src/components/ai/AILoadingScreen.tsx`
  - `src/screens/ai/ai-consent-screen.tsx`
  - `src/screens/ai/ai-plan-result-screen.tsx`
- 반영 내용:
  - `AILoadingScreen.tsx`
    - compact 모드 추가
    - 타이틀/단계/카드 캐러셀 패딩 및 폰트 축소
  - `ai-consent-screen.tsx`
    - 작은 화면에서 아이콘, 타이틀, 설명 카드 여백 축소
  - `ai-plan-result-screen.tsx`
    - 결과 화면을 `AIFlowScreen` 구조로 정리
    - 헤더/탭/본문 구조 통일
    - 목표 요약 카드 compact 대응
    - 식단 탭 compact 대응
    - `StartDateSheet`, `RegenBottomSheet` compact 대응
- 설계안 대비 최종 일치도 판단: **약 97%**

### 최종 수정 파일
- `App.tsx`
- `src/components/ai/AIFlowScreen.tsx`
- `src/components/ai/AILoadingScreen.tsx`
- `src/screens/ai/ai-consent-screen.tsx`
- `src/screens/ai/ai-onboarding-screen.tsx`
- `src/screens/ai/ai-plan-result-screen.tsx`
- `src/screens/ai/ai-plan-weekly-screen.tsx`

### 검증 결과
- `npx tsc --noEmit`: 통과
- 각 phase마다 설계안 대비 일치도 검토 후 부족한 부분 추가 보완
- 최종 점검 기준:
  - 큰 구조적 버그는 확인되지 않음
  - 남은 리스크는 주로 **실기기에서의 미세 spacing / 주소창 높이 변화 / 아주 짧은 화면에서의 체감 밀도** 수준

### Git 반영 정보
- GitHub push 완료
- 브랜치: `main`
- 모바일 AI 플로우 작업 커밋: `9e45221` `Improve mobile AI flow layouts`

### 다음 AI가 이어받을 때 우선 확인할 것
1. 실제 모바일 브라우저(iPhone Safari / Android Chrome)에서 AI 동의 → 온보딩 → 로딩 → 결과 → 주간 플랜 순서로 눌러보며 spacing 검증
2. 특히 아래 화면을 소형 기기 기준으로 확인
   - `ai-onboarding-screen.tsx`
   - `ai-plan-result-screen.tsx`
   - `AILoadingScreen.tsx`
3. 현재는 코드 구조/타입 기준으로는 안정화됐고, 이후 작업은 **실기기 polish 단계**로 보면 됨
4. 이번 작업과 무관한 `CLAUDE.md` 기존 변경 이력은 유지했으며, 별도 삭제/정리는 하지 않았음
  - `고구마`
  - `계란`
  - `현미밥`
  - `두부`
- 특정 키워드에서 기대와 다르면 `food-search-ranking.ts` 상수/보너스/패널티만 조정하면 됨

### D. Cloudflare Pages 재확인 포인트
- 아이콘 네모 박스가 다시 보이면 먼저 확인:
  - `scripts/postprocess-web-export.js`가 build 후 정상 실행됐는지
  - 배포된 폰트 URL이 `/assets/expo-vector-icons/Fonts/...` 형태인지
  - Cloudflare 캐시가 이전 산출물을 잡고 있지 않은지

---

## 다음 AI를 위한 추천 시작 순서
1. `CLAUDE.md`와 `WEB_APP_PLAN.md` 먼저 읽기
2. 사용자가 웹 이슈를 말하면:
   - 네이티브 영향 0 원칙 유지
   - `App.tsx`, `scripts/postprocess-web-export.js`, `package.json` build 스크립트 먼저 확인
3. 사용자가 음식 검색 품질을 말하면:
   - `src/lib/food-search-ranking.ts`부터 보기
   - 그 다음 `src/lib/diet-search.ts`, `src/lib/food-search.ts`
4. 사용자가 AI 플랜 기존 계정 오류를 말하면:
   - `src/stores/ai-plan-store.ts`의 legacy normalize/migrate 로직 먼저 확인

---

## 지금 시점의 한 줄 요약
- 웹 URL 접속 경로는 만들어졌고, Cloudflare Pages용 아이콘 폰트 문제까지 우회함
- AI 플랜 구계정 호환 문제 해결됨
- 음식 검색은 DB 우선 + 관련도 랭킹 개선 완료
- 앱 타입체크/웹 빌드 모두 통과

---

## AI 플랜 근력 강화 목표 업데이트 (2026-03-30)

### 요약
- AI 플랜 온보딩 목표에 `strength_gain`을 추가해서, 벌크업과 구분되는 `근력 강화 (파워리프팅/힘 증가)` 흐름을 만들었음
- 작업은 **Phase 1 → Phase 2**로 나눠 진행했고, 각 phase마다 설계안 대비 일치도 점검 후 부족한 부분을 보완했음
- 최종적으로 타입/질문/UI 저장 흐름과 AI 프롬프트/검증 로직까지 반영 완료

### Phase 1 — 목표 체계 및 온보딩 확장 완료
- `src/stores/ai-plan-store.ts`
  - `AIGoal`에 `strength_gain` 추가
  - 공통 라벨 상수 `AI_GOAL_LABEL` 추가
  - `OnboardingData.primaryStrengthFocus` 추가
- `src/screens/ai/ai-onboarding-screen.tsx`
  - 목표 선택지에 `근력 강화 (파워리프팅/힘 증가)` 추가
  - `strength_gain` 선택 시에만 `primaryStrengthFocus` 질문 노출
  - 질문 흐름을 고정 배열 기준이 아닌 동적 visible question 기준으로 재구성
  - 저장 시 `primaryStrengthFocus`가 실제 온보딩 데이터에 포함되도록 연결
- `src/screens/profile/profile-screen.tsx`
  - AI 목표 라벨을 공통 상수 기반으로 표시
- `src/screens/ai/ai-plan-result-screen.tsx`
  - 결과 화면 목표 카드에 선택한 AI 목표 badge 표시
  - `strength_gain`이면 우선 리프트도 함께 표시
- Phase 1 설계안 대비 최종 일치도 판단: **약 97~98%**

### Phase 2 — 근력 강화 전용 AI 생성 품질 보강 완료
- `src/lib/ai-planner.ts`
  - 목표별 프롬프트 지침 `goalInstructionMap` 추가
  - `strength_gain`일 때:
    - 메인 리프트 중심
    - 3~6회 저반복/고중량 성향
    - 보조운동 최소화
    - 회복 우선
    - 유지칼로리 또는 소폭 흑자 기준
    - 머신 위주 보디빌딩식 분할 지양
  - `primaryStrengthFocus`를 프롬프트에 포함
  - `strengthProfile` 미입력 시에도 `strength_gain`에 맞는 보수적 중량 지시 추가
  - 생성 결과 검증 함수 `validateGeneratedPlanForGoal()` 추가
    - 메인 리프트 비중
    - 저반복 세트 존재 여부
    - 과도한 볼륨 여부
    - 우선 리프트 반영 여부
  - 결과가 기준에 미달하면 보정 프롬프트로 **1회 재생성**
- `src/screens/ai/ai-plan-result-screen.tsx`
  - 결과 화면에서 `재생성` 시에도 최근 운동 히스토리(`buildWorkoutHistorySection`)를 동일하게 주입하도록 보완
- Phase 2 설계안 대비 최종 일치도 판단: **약 96~97%**

### 최종 수정 파일
- `src/stores/ai-plan-store.ts`
- `src/screens/ai/ai-onboarding-screen.tsx`
- `src/lib/ai-planner.ts`
- `src/screens/profile/profile-screen.tsx`
- `src/screens/ai/ai-plan-result-screen.tsx`

### 검증 결과
- `npx tsc --noEmit`: 통과
- 구현 후 review 관점 재점검 완료
- 명확한 치명 버그는 발견되지 않았고, 재생성 흐름의 히스토리 주입 누락은 추가 보완함

### Git 반영 정보
- GitHub push 완료
- 브랜치: `main`
- 관련 커밋: `5e242d5` `Add strength-focused AI plan flow`

### 다음 AI가 이어받을 때 먼저 알 것
1. 이번 작업의 핵심은 `muscle_gain`과 `strength_gain`을 **UI 라벨 수준이 아니라 실제 생성 품질 수준에서 분리**한 것
2. 가장 중요한 파일은 `src/lib/ai-planner.ts`
   - 목표별 프롬프트 분기
   - 생성 결과 검증
   - 보정 재생성
3. 온보딩 질문 흐름은 이제 고정 step 수가 아니라 `getVisibleQuestions()` 기반이므로, 목표별 조건부 질문을 추가할 때 이 구조를 유지해야 함
4. 남은 리스크는 코드 오류보다 **LLM 응답 품질의 편차**
   - 실제 기기에서 `muscle_gain`과 `strength_gain`으로 각각 플랜을 생성해 비교 검증하는 게 좋음
5. 추천 수동 테스트 시나리오
   - `strength_gain + bench`
   - `strength_gain + squat`
   - `muscle_gain`
   - 각 케이스에서 메인 리프트 비중, 반복수, 설명 문구 차이를 확인

---

## AI 플랜 강도 입력 UX / 근력 증가 안정화 업데이트 (2026-03-30)

### 요약
- AI 플랜의 강도 입력 화면에서 하단 종목(`오버헤드프레스`, `바벨로우`) 입력이 어렵던 문제를 완화했고, 1RM 입력 구조를 더 안정적으로 정리했음
- `strength_gain` 플랜 생성이 과도한 검증 때문에 자주 실패하던 문제를 완화함
- 이후 추가로 강도 입력 화면 자체를 더 compact하게 재구성해서 직접 입력 중심 UX로 바꿨음

### 1. 강도 입력/1RM 입력 안정화
- `src/screens/ai/ai-onboarding-screen.tsx`
  - `OneRMCalcModal`이 이제 `targetId`를 직접 받아 적용하도록 변경
  - 모달이 열릴 때마다 내부 입력값 초기화
  - 카드별 `onLayout` 좌표를 저장해서 입력 포커스 시 해당 카드로 스크롤
  - 강도 입력 화면 하단 여백(`strengthContent`)과 footer spacing(`strengthFooter`) 추가
  - `1RM 계산` 버튼 `hitSlop` 적용
- 효과:
  - 하단 종목 접근성 개선
  - 특정 종목에서 상태가 꼬여 입력이 반영 안 될 가능성 축소

### 2. `strength_gain` 생성 실패 완화
- `src/lib/ai-planner.ts`
  - `parseRepsRangeForValidation()` 확장
    - `5회`
    - `4-6회`
    - `4~6회`
    - `5x5`
    - `5 x 5`
    형식까지 허용
  - `validateGeneratedPlanForGoal()`을 hard fail / soft fail 구조로 변경
  - 기존의 너무 빡빡한 기준을 score 기반으로 완화
  - 재생성 후에도 구조가 정상이면 바로 throw하지 않고 `safetyFlags`에 경고를 남기고 반환
- 효과:
  - `strength_gain` 플랜 생성 실패율 감소
  - 근력 강화 성향 검증은 유지하되, 모델 표현 다양성을 더 허용

### 3. 강도 입력 화면 compact 리디자인
- `src/screens/ai/ai-onboarding-screen.tsx`
  - 강도 입력 화면을 큰 카드형에서 compact row형 UI로 재구성
  - 상단 안내 문구를 다음 흐름으로 축약:
    - 현재 사용 중량을 바로 입력
    - 1RM을 모르면 오른쪽 계산기 사용
  - 각 운동 row를 `종목명 + 작은 입력창 + kg + 1RM 계산` 구조로 변경
  - 각 카드 아래의 큰 `1RM 계산기로 입력하기` 버튼 제거
  - footer의
    - `모르면 건너뛰기 (맨몸 기준으로 설정)`
    - `건너뛰고 플랜 받기`
    를 중앙 정렬로 변경
- 효과:
  - 직접 입력이 메인 행동으로 더 명확해짐
  - 화면 밀도가 줄고 모바일 입력 속도가 개선됨

### 검증 결과
- `npx tsc --noEmit`: 통과
- 설계안 대비 일치도:
  - 강도 입력 안정화/생성 완화 작업: 약 **96~98%**
  - compact 리디자인 작업: 약 **97%**

### 이번 후속 작업의 핵심 파일
- `src/screens/ai/ai-onboarding-screen.tsx`
- `src/lib/ai-planner.ts`

### 다음 AI가 이어받을 때 먼저 알 것
1. 강도 입력 화면은 이제 “직접 입력 중심 + 계산기 보조” 구조임
2. `strength_gain` 생성 로직은 더 이상 과도한 strict fail이 아니라 soft fail 허용 구조임
3. 여전히 실제 기기에서 아래 케이스는 수동 확인 권장
   - `오버헤드프레스` 직접 입력
   - `오버헤드프레스` 계산기 입력
   - `바벨로우` 직접 입력
   - `strength_gain + bench/squat/balanced` 생성

---

## AI 플랜 반복 주기 / 적용 UX 개선 업데이트 (2026-03-30)

### 요약
- AI 플랜을 더 이상 “이번 주 1회성”으로만 해석하지 않고, `weekStart`를 Day 1 anchor로 삼아 7일 주기로 반복되도록 보완했음
- 결과 화면에서 시작일 변경 진입을 더 명시적으로 바꾸고, 적용 전/적용 후 CTA를 분리했음
- 전주 기록 기반 자동 조정이 실제로는 rolling 7일을 보던 문제를 수정해서, 이제 직전 cycle 범위만 기준으로 반영하게 했음
- 적용 상태, 시작일 변경, 자동 조정 메타데이터가 재실행 후에도 유지되도록 `plan_json` 스냅샷 저장을 보완했음
- 이후 헤더 보조 문구는 사용성 피드백에 따라 최종적으로 제거했음

### 1. 반복형 AI 플랜 스케줄 도입
- `src/lib/ai-plan-schedule.ts` 신규 추가
  - `getPlanCycleInfo(plan, targetDate)`
  - `getRecurringDayLabel(plan, targetDate)`
  - `isPlanStarted(plan, targetDate)`
  - `getCycleStartDate(plan, targetDate)`
  - `getCycleDateRange(plan, cycle)`
- 의미:
  - `weekStart`는 “이번 주 범위”가 아니라 Day 1 기준점
  - 오늘 날짜는 `diffDays % 7`로 day1~day7에 매핑
  - 자동 조정용 직전 cycle 날짜 범위도 공용 helper로 계산

### 2. 적용 전/후 UX 분리
- `src/screens/ai/ai-plan-result-screen.tsx`
  - 헤더 타이틀을 `이번 주 AI 플랜` → `내 AI 플랜`으로 변경
  - 시작일 변경을 날짜 텍스트 편집이 아니라 명시적 액션 `플랜 시작일 변경`으로 노출
  - 적용 전:
    - `이 플랜 적용하기`
    - `다른 플랜 받아보기`
  - 적용 후:
    - `플랜 시작일 변경`
    - `플랜 재설정`
  - 적용 확인 시트도 최초 적용 / 재설정 문구를 분리
  - 헤더 하단 보조 설명은 최종적으로 삭제

### 3. 홈/운동 화면의 반복 주기 반영
- `src/screens/home/home-screen.tsx`
  - 적용된 AI 플랜 카드가 7일이 지나도 끊기지 않고 반복 주기로 오늘 계획을 계산하도록 변경
  - `검토 중인 AI 플랜` / `반복 중인 AI 플랜` 상태를 구분
- `src/screens/workout/workout-screen.tsx`
  - 오늘의 AI 플랜이 2주차, 3주차에도 계속 정상 표시되도록 변경
  - 적용된 workout 섹션이 있는 플랜만 운동 탭에 노출

### 4. 전주 기록 기반 자동 조정 보완
- `src/stores/ai-plan-store.ts`
  - `lastAutoAdjustedCycle`
  - `lastAutoAdjustedAt`
  - `syncRecurringPlanForToday(userId, today?)`
    추가
- `src/lib/ai-planner.ts`
  - `adjustRepsRange()` 추가
  - weighted 운동은 `weight_kg`
  - 무중량 운동은 `repsRange`
    기준으로 보수적 조정
- 초기 구현에서는 최근 7일 rolling window를 사용했지만,
  이후 보완으로 `getCycleDateRange(plan, cycle - 1)` 범위만 조회하도록 수정
- 결과:
  - “전주 기록 반영”이 문구뿐 아니라 실제 데이터 범위도 직전 cycle 기준이 됨

### 5. Supabase 스냅샷 저장 일관성 보완
- `src/lib/ai-planner.ts`
  - `updateAIPlanSnapshotInSupabase(plan)` 추가
- `src/screens/ai/ai-plan-result-screen.tsx`
  - 플랜 적용 시 `plan_json`에 `isApplied`, `appliedAt`, `appliedSections`까지 저장
  - 시작일 변경 시 optimistic update를 제거하고, 서버 저장 성공 후 로컬 반영하도록 변경
  - 시작일 변경 실패 시 `Alert.alert('오류', ...)` 표시
- `src/stores/ai-plan-store.ts`
  - 수동 조정 / 자동 조정 후 변경된 플랜 스냅샷을 Supabase에도 저장
- 의미:
  - 앱 재시작 후에도 적용 상태와 조정 메타데이터가 유지됨
  - 시작일 변경 실패가 조용히 묻히지 않음

### 6. 비교 화면 문구 정리
- `src/screens/ai/ai-plan-weekly-screen.tsx`
  - `새로운 주간 플랜` → `새 플랜 비교`
  - `지난 주 vs 이번 주 변경사항` → `기존 플랜 vs 새 플랜`
  - `중량 자동 조정 (지난 주 기반)` → `전주 기록 반영하기`
  - `이번 주 플랜 적용하기` → `이 플랜으로 교체하기`

### 검증 결과
- `npx tsc --noEmit`: 통과
- 구현 후 분석에서 발견된 2개 문제 추가 보완 완료
  - 직전 cycle 대신 최근 7일을 보던 문제 수정
  - 시작일 변경 실패를 무시하던 문제 수정
- 최종 설계안 대비 일치도 판단:
  - 보완 전: 약 **85~90%**
  - 보완 후: 약 **99%**

### Git 반영 정보
- GitHub push 완료
- 브랜치: `main`
- 관련 커밋: `2cf23c5` `feat: refine recurring ai plan flow`

### 이번 작업의 핵심 파일
- `src/lib/ai-plan-schedule.ts`
- `src/lib/ai-planner.ts`
- `src/stores/ai-plan-store.ts`
- `src/screens/ai/ai-plan-result-screen.tsx`
- `src/screens/ai/ai-plan-weekly-screen.tsx`
- `src/screens/workout/workout-screen.tsx`

### 다음 AI가 이어받을 때 먼저 알 것
1. AI 플랜은 이제 `weekStart` 기준 Day 1~Day 7이 반복되는 구조임
2. 자동 조정은 “최근 7일”이 아니라 “직전 cycle” 범위만 사용함
3. 적용 상태와 시작일 변경은 `plan_json` 스냅샷까지 저장되므로, 관련 수정 시 Supabase 반영 경로를 같이 봐야 함
4. 결과 화면 헤더 보조 문구는 사용자 피드백으로 최종 삭제된 상태임
5. 남은 확인 포인트는 타입체크보다 실제 디바이스에서의 UX 확인
   - 적용 후 재진입 시 `플랜 적용하기`가 다시 보이지 않는지
   - 2주차/3주차에도 운동 탭의 오늘 AI 플랜이 정상 노출되는지
   - 시작일 변경 실패 시 오류 알림이 자연스러운지
