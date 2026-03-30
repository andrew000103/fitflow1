# AI Planner — Gap Analysis Report

> **분석일**: 2026-03-25 (2차 분석, 1차 68% 대비 업데이트)
> **전체 Match Rate**: **88%** ⚠️
> **Phase**: Check

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 정체기(벌크/다이어트) 돌파 + 운동 입문자 길잡이. 기존 앱에 AI 개인화 가치 추가 |
| WHO | Persona A(정체기 벌커, 숫자 중심 피드백) / Persona B(입문 다이어터, 쉬운 코치 느낌) |
| RISK | LLM JSON 불안정, 의료 책임, 잘못된 입력값 → 엉터리 계획, PII 전송 |
| SUCCESS | 처음 쓰는 사람이 5분 안에 계획을 받고 이해할 수 있음 |
| SCOPE | 온보딩 + 플랜 생성 + 결과 화면 + 홈 카드. 챗봇/웨어러블/사진 인식 제외 |

---

## Overall Match Rate: 88% ⚠️

| 카테고리 | 가중치 | Score | 가중 점수 |
|---------|:------:|:-----:|:---------:|
| 파일 존재 | 15% | 100% | 15.0 |
| 네비게이션 | 15% | 100% | 15.0 |
| UX 화면 | 20% | 85% | 17.0 |
| 데이터 모델 | 10% | 85% | 8.5 |
| AI 서비스 로직 | 15% | 75% | 11.25 |
| Store 상태 | 10% | 100% | 10.0 |
| 안전 가드레일 | 10% | 70% | 7.0 |
| 환경 설정 | 5% | 80% | 4.0 |
| **전체** | **100%** | | **87.75%** |

### 1차 → 2차 변화 요약

| 카테고리 | 1차 (68%) | 2차 (88%) | 변화 | 원인 |
|---------|:---------:|:---------:|:----:|------|
| UX 화면 | 80% | 85% | +5 | 나이/키/체중 number 입력 추가 (C-3 해결) |
| AI 서비스 로직 | 60% | 75% | +15 | 1200kcal 보정 로직 + Anthropic SDK 제거 (C-4, I-6 해결) |
| Store 상태 | 63% | 100% | +37 | 확장 필드를 유익한 추가로 재평가 |
| 안전 가드레일 | 38% | 70% | +32 | 극단 저체중 체크 + 1200kcal 하한 추가 |
| 환경 설정 | 25% | 80% | +55 | @anthropic-ai/sdk 제거, .env.example 정비 |

---

## 이전 Gap 해결 현황

| ID | Gap | 상태 | 검증 내역 |
|----|-----|:----:|-----------|
| C-3 | 온보딩 나이/키/체중 하드코딩 | ✅ 해결 | `ai-onboarding-screen.tsx`에 `type:'number'` 질문 3개 추가. 하드코딩 완전 제거. |
| C-4 | 안전 가드레일 미완성 | ⚠️ 부분 해결 | BMI<15 차단 + 1200kcal 미만 자동 보정 추가. 성별 분화 최소 칼로리 미완. |
| I-6 | @anthropic-ai/sdk 잔존 | ✅ 해결 | package.json에서 완전 제거 확인. |

---

## 잔여 Gap 목록

### Critical (1개)

#### C-1. LLM 엔진 변경 — 설계 문서 미반영 (의도적 변경)

- **설계**: `@anthropic-ai/sdk`, `claude-sonnet-4-6`, `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- **구현**: `fetch()` → `generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash`, `EXPO_PUBLIC_GEMINI_API_KEY`
- **영향**: Design Doc Section 5/7 전체 코드 블록 무효. CLAUDE.md는 이미 Gemini 반영 완료.
- **조치**: Design Doc Section 5, 7을 Gemini REST fetch 기준으로 업데이트 필요.

---

### Important (5개)

| # | 항목 | 설계 | 구현 |
|---|------|------|------|
| I-1 | 로딩 화면 | 단계별 진행 표시 + 애니메이션 | 이모지 + 텍스트 2줄 |
| I-2 | Plan ID 형식 | `crypto.randomUUID()` | `Math.random().toString(36)` |
| I-3 | 온보딩 프로필 pre-fill | user_profiles 데이터로 자동 채움 | 매번 처음부터 입력 |
| I-4 | 나이 입력 방식 | 슬라이더 (15~80 범위) | TextInput (범위 검증 없음, 0~999 허용) |
| I-5 | 성별 분화 최소 칼로리 | 여 1200 / 남 1500 분리 | flat 1200kcal 하한만 적용 |

---

### Minor (5개)

| # | 항목 | 설계 | 구현 |
|---|------|------|------|
| M-1 | 동의 화면 데이터 목록 | "최근 7일 식단 기록" 포함 | "체중 변화 추이"로 대체 |
| M-2 | JSON 파싱 실패 재시도 | 1회 자동 재시도 | Alert 수동 재시도만 |
| M-3 | avgDailyCalories | 실제 집계 | 하드코딩 `0` 반환 |
| M-4 | 주당 운동 일수 | 1~7일 개별 선택 | 4개 버킷 선택 |
| M-5 | 정체기 질문 | 선택 + 자유 텍스트 | 4개 프리셋만 |

---

## 추가된 기능 (설계 외 구현 — 유익한 변경)

| 항목 | 위치 | 설명 |
|------|------|------|
| `previousPlan` + `restorePreviousPlan()` | `ai-plan-store.ts` | 이전 플랜 보존/복원 |
| `needsOnboarding` + 자동 동의 체크 | `root-navigator.tsx` | 로그인 후 ai_consent=null 시 트리거 |
| Supabase 활성 플랜 로드 | `root-navigator.tsx` | 앱 재시작 시 ai_plans 복원 |
| AIOnboardingTrigger 컴포넌트 | `main-navigator.tsx` | 네비게이션 마운트 후 안정적 모달 이동 |
| 저체중 여성 추가 체크 | `ai-planner.ts` | 여성 45kg 미만 + 감량 목표 시 차단 |
| DietDay.MealEntry.macros 필드 | `ai-plan-store.ts` | 설계의 DietDay보다 상세한 영양 정보 |

---

## 90% 달성을 위한 즉시 액션

| # | 항목 | 예상 효과 | 파일 |
|---|------|----------|------|
| 1 | **Design Doc Section 5/7 Gemini REST로 업데이트** | C-1 해소, +10% | `ai-planner.design.md` |
| 2 | **성별 분화 최소 칼로리** (남 1500/여 1200) | +5% | `ai-planner.ts` |

→ 두 항목 완료 시 예상 Match Rate: **~93%**

---

## 설계 문서 업데이트 필요 항목

- [ ] Section 5: `@anthropic-ai/sdk` → Gemini REST fetch 코드로 교체
- [ ] Section 7: `EXPO_PUBLIC_ANTHROPIC_API_KEY` → `EXPO_PUBLIC_GEMINI_API_KEY`
- [ ] Section 4: Store에 `previousPlan`, `needsOnboarding`, `restorePreviousPlan()`, `reset()` 반영

---

## Version History

| Version | Date | Changes | Match Rate |
|---------|------|---------|:----------:|
| 1.0 | 2026-03-25 | 최초 분석 | 68% |
| 2.0 | 2026-03-25 | C-3/I-6 해결, C-4 부분 해결, 전체 재평가 | 88% |
