# WEB APP PLAN

## 마지막 업데이트
- 날짜: 2026-03-30
- 목적: 기존 Expo 네이티브 앱을 같은 코드베이스로 웹에서도 실행 가능하게 확장하기 위한 실행 계획
- 대상 독자: Codex, Claude Code, Gemini CLI 등 프로젝트를 이어받는 다른 AI 에이전트

---

## 한 줄 요약
- 이 프로젝트는 이미 `Expo + React Native + react-native-web` 기반이라 웹앱 전환은 **실현 가능성이 높음**
- `npx expo export --platform web` 기준 웹 번들은 성공함
- 핵심 과제는 새 웹 앱을 만드는 것이 아니라 **웹 호환성 안정화, 저장소 계층 정리, 외부 API 안전화, 웹 UX 보정**

---

## 현재 확인된 사실

### 1. 웹 진입점은 이미 존재함
- `package.json`
  - `web` script: `expo start --web`
  - `react-dom`, `react-native-web` 의존성 포함
- `app.json`
  - `expo.web.favicon` 설정 존재
- `metro.config.js`
  - 웹에서 `zustand` CJS 우회 설정 존재

### 2. 실제 웹 번들 검증 결과
- 2026-03-30 로컬 검증:
  - 실행 명령: `npx expo export --platform web`
  - 결과: 성공
- 결론:
  - "웹에서 아예 안 되는 구조"는 아님
  - 현재 상태는 "웹 배포 전 안정화가 필요한 상태"로 보는 것이 정확함

### 3. 현재 코드 구조상 강점
- 대부분의 UI가 React Native 공용 컴포넌트 기반
- Expo managed workflow 유지 중
- 웹 분기 코드 일부 이미 존재
- React Navigation / React Native Paper / react-native-svg 모두 웹 호환 가능성이 높음

### 4. 현재 코드 구조상 주요 리스크
- 외부 음식 검색 API를 브라우저에서 직접 호출하는 구조
- 저장소 계층이 `AsyncStorage`, `localStorage`, Zustand persist로 혼합됨
- UI가 모바일 우선이라 데스크톱 웹 UX가 아직 정리되지 않음
- 날짜/타임존 계산이 브라우저 환경에서 어긋날 수 있음

---

## 범위 정의

### 웹 MVP 범위
- 로그인 / 회원가입 / 게스트 로그인
- 홈 탭
- 운동 탭 핵심 조회 및 세션 진입
- 식단 탭 조회 / 음식 검색 / 식단 추가
- 프로필 탭 조회
- AI 플랜 조회 또는 생성 진입

### MVP에서 제외 가능
- 고급 반응형 polish
- SEO / PWA / 설치형 웹앱
- 공유 미리보기, 분석 툴, 마케팅 페이지

---

## 권장 전략

### 선택지 A. 기존 코드베이스 확장
- 권장
- 이유:
  - 현재 구조와 가장 잘 맞음
  - 이미 웹 번들 성공
  - 유지보수 비용이 가장 낮음

### 선택지 B. 별도 웹 프론트 신설
- 비권장
- 이유:
  - 구현 비용 큼
  - 모바일/웹 기능 분기 증가
  - 동일 도메인 로직 중복 가능성 큼

최종 전략:
- **기존 Expo 앱을 웹까지 확장하는 방식으로 진행**

---

## 단계별 작업 계획

## Phase 0. 사전 검증
- 목표:
  - 현재 앱이 웹에서 어디까지 동작하는지 기준선 확보
- 해야 할 일:
  - `expo start --web` 또는 `expo export --platform web` 기준 실행 확인
  - 로그인 전 화면 진입 확인
  - 로그인 후 메인 탭 진입 확인
  - 새로고침 후 세션 복원 여부 확인
  - 주요 화면 첫 렌더링 에러 유무 확인
- 완료 기준:
  - 웹에서 앱이 열리고 로그인 후 탭 이동이 가능함
- 예상 이슈:
  - 브라우저 콘솔 경고
  - 특정 화면만 렌더 실패

## Phase 1. 저장소 계층 정리
- 목표:
  - 웹/모바일에서 세션, 캐시, 로컬 상태 저장 방식 통일
- 현재 이슈:
  - `diet-store`는 웹에서 `localStorage` 사용
  - `supabase auth`, `ai-plan-store`, `food-search`는 `AsyncStorage` 중심
- 해야 할 일:
  - 공용 storage adapter 작성
  - `Platform.OS === 'web'`일 때 `localStorage`
  - 그 외는 `AsyncStorage`
  - 스토어/캐시 계층이 같은 인터페이스를 쓰도록 정리
- 우선 대상 파일:
  - `src/lib/supabase.ts`
  - `src/stores/diet-store.ts`
  - `src/stores/ai-plan-store.ts`
  - `src/lib/food-search.ts`
- 완료 기준:
  - 웹 새로고침 후 인증 세션 유지
  - AI 플랜 / 식단 / 최근 검색 복원 안정화
- 주요 리스크:
  - hydrate 타이밍 꼬임
  - 사용자 전환 시 이전 데이터 잔존

## Phase 2. 외부 음식 API 웹 안전화
- 목표:
  - 브라우저에서 직접 외부 API를 때리는 구조 제거 또는 최소화
- 현재 이슈:
  - MFDS / USDA / OpenFoodFacts 호출이 클라이언트에서 직접 수행됨
  - `EXPO_PUBLIC_*` 키는 웹 번들에 노출될 수 있음
  - CORS 또는 rate limit 문제가 생길 가능성이 큼
- 권장 방안:
  - Supabase Edge Function 또는 서버 프록시 도입
  - 웹과 모바일 모두 같은 서버 경유 경로 사용
- 우선 대상 파일:
  - `src/lib/mfds.ts`
  - `src/lib/usda.ts`
  - `src/lib/openfoodfacts.ts`
  - `src/lib/food-env.ts`
- 완료 기준:
  - 웹에서 음식 검색이 안정적으로 동작
  - 민감 키가 클라이언트 번들에 남지 않음
- 주요 리스크:
  - 일부 API는 브라우저 직접 호출만 막히고 네이티브에선 정상일 수 있음
  - 응답 포맷 차이로 검색 결과 파싱 실패 가능

## Phase 3. 웹 UI/UX 보정
- 목표:
  - 모바일 우선 레이아웃을 웹에서도 usable 하게 보정
- 해야 할 일:
  - 주요 화면에 `maxWidth`, 중앙 정렬, 데스크톱 여백 적용
  - 폼 화면 폭 제한
  - 모달과 하단 고정 버튼의 웹 배치 보정
  - 긴 리스트/스크롤 화면의 레이아웃 확인
- 우선 대상:
  - 로그인 / 회원가입
  - 홈
  - 식단 메인 / 음식 검색
  - 운동 메인 / 운동 세션 / 프로그램 상세
  - AI 온보딩 / AI 결과 화면
- 완료 기준:
  - 390px 모바일 웹과 1280px 이상 데스크톱 웹에서 모두 화면 붕괴가 없음
- 주요 리스크:
  - 지나치게 넓은 레이아웃
  - SafeArea 기반 여백 어색함
  - fixed 성격 버튼이 콘텐츠를 가림

## Phase 4. 웹 전용 인터랙션 정리
- 목표:
  - 삭제/중단/경고/모달 UX를 웹에서도 자연스럽게 정리
- 현재 확인된 사실:
  - 일부 화면은 이미 `Platform.OS === 'web'`일 때 `window.confirm`, `window.alert` 사용
  - 아직 전역 정책은 없음
- 해야 할 일:
  - 공용 confirm/alert helper 도입 여부 결정
  - 브라우저 기본 dialog와 앱 내 modal 중 하나로 기준 통일
- 우선 대상 파일:
  - `src/screens/workout/program-detail-screen.tsx`
  - 그 외 `Alert.alert` 의존 화면 전수 점검
- 완료 기준:
  - 주요 destructive action이 웹에서도 명확히 동작
- 주요 리스크:
  - 브라우저 기본 confirm UX 일관성 부족
  - 비동기 작업 중 뒤로가기/중복 클릭 이슈

## Phase 5. 날짜 / 타임존 안정화
- 목표:
  - 웹 브라우저 환경에서도 "오늘", "이번 주" 계산이 안정적이어야 함
- 현재 이슈:
  - `new Date()` + `toISOString()` 조합 사용 지점 존재
  - 브라우저 로컬 타임존과 DB UTC 저장이 엇갈리면 하루 밀릴 수 있음
- 해야 할 일:
  - 날짜 유틸 공통화
  - "로컬 기준 YYYY-MM-DD"와 "DB timestamp" 변환 로직 분리
  - 식단/운동/AI 플랜 기준 날짜 계산 점검
- 우선 대상 파일:
  - `src/navigation/root-navigator.tsx`
  - `src/lib/diet-supabase.ts`
  - 홈/운동/식단 날짜 계산 관련 화면들
- 완료 기준:
  - 한국 시간 기준으로 오늘 식단/오늘 운동이 정확히 맞음
- 주요 리스크:
  - 자정 전후 기록이 다른 날짜로 보임

## Phase 6. 배포 설정
- 목표:
  - 실제 웹 URL에서 접근 가능한 상태 만들기
- 해야 할 일:
  - 웹 export 산출물 기준 배포 방식 결정
  - 정적 호스팅 또는 프론트 호스팅 서비스 선택
  - 환경변수 주입 방식 문서화
  - SPA fallback 확인
- 후보:
  - Vercel
  - Netlify
  - Supabase Hosting
  - S3 + CloudFront
- 완료 기준:
  - 배포 URL에서 앱 접근 가능
  - 새로고침 / 직접 URL 접근 시 404 없음

---

## 우선순위

### P0
- 웹 실행 확인
- 로그인 / 세션 유지 확인
- 저장소 계층 정리
- 음식 검색 API 웹 안전화 방향 결정

### P1
- 핵심 화면 웹 UX 보정
- 웹 전용 dialog / modal 정책 정리
- 날짜 / 타임존 안정화

### P2
- polished 반응형 개선
- PWA / SEO / 성능 최적화

---

## 예상 공수
- 빠른 웹 MVP 오픈: 1~2일
- 안정화 포함 1차 서비스 수준: 3~5일
- 디자인 polish 포함: 5~8일

주의:
- 음식 검색 API를 서버 프록시로 옮기면 단기 공수는 증가하지만 장기 안정성은 크게 좋아짐

---

## 주요 위험 요소
- 웹에서 외부 음식 API가 CORS로 막힐 수 있음
- 웹 새로고침 후 auth/session/store hydration 순서가 꼬일 수 있음
- 데스크톱 웹에서 모바일 전용 UI가 어색할 수 있음
- 타임존 차이로 오늘 식단/운동 날짜가 어긋날 수 있음
- `EXPO_PUBLIC_*` 환경변수 사용으로 웹 번들에 키가 노출될 수 있음

---

## 완료 판정 체크리스트
- [ ] 웹 첫 진입 성공
- [ ] 로그인 성공
- [ ] 회원가입 성공
- [ ] 게스트 로그인 성공
- [ ] 새로고침 후 세션 유지
- [ ] 홈 / 운동 / 식단 / 프로필 이동 가능
- [ ] 음식 검색 동작
- [ ] 식단 추가 / 수정 / 삭제 동작
- [ ] 운동 세션 진입 동작
- [ ] AI 플랜 진입 또는 조회 동작
- [ ] 모바일 웹 / 데스크톱 웹 모두 레이아웃 붕괴 없음
- [ ] 배포 URL에서 접근 가능

---

## 코드 탐색 시작점
- 앱 진입:
  - `App.tsx`
  - `index.ts`
- 웹 설정:
  - `package.json`
  - `app.json`
  - `metro.config.js`
- 인증 / 세션:
  - `src/lib/supabase.ts`
  - `src/stores/auth-store.ts`
- 상태 저장:
  - `src/stores/diet-store.ts`
  - `src/stores/ai-plan-store.ts`
  - `src/lib/food-search.ts`
- 네비게이션:
  - `src/navigation/root-navigator.tsx`
  - `src/navigation/main-navigator.tsx`
- 음식 API:
  - `src/lib/mfds.ts`
  - `src/lib/usda.ts`
  - `src/lib/openfoodfacts.ts`

---

## 다음 실행 추천
다음 AI 에이전트는 아래 순서로 진행하는 것이 가장 안전함.

1. 웹에서 실제 핵심 플로우를 수동 검증한다
2. storage adapter를 먼저 공통화한다
3. 음식 검색 API를 서버 프록시로 옮길지 결정한다
4. 로그인 / 홈 / 식단 / 운동 핵심 화면 웹 UX를 보정한다
5. 날짜 / 타임존 문제를 정리한다
6. 배포 설정과 최종 QA를 수행한다

---

## 참고 메모
- 현재 프로젝트 루트의 `CLAUDE.md`는 AI 플랜 기능 중심 상태 문서임
- 이 문서는 웹앱 전환 전용 브리프이며, 다른 AI 모델이 작업을 이어받을 때 빠르게 컨텍스트를 잡도록 작성함
