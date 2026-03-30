# Analysis: ai-plan-integration

> Feature: AI 플랜 운동/식단 탭 통합 + 중량 데이터 추가
> Analyzed: 2026-03-25
> Match Rate: **100%** (8 / 8 항목) — G-1 수정 완료 후

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | AI 플랜이 결과 화면에만 격리돼 일상적 활용 불가; 운동 중량 미포함으로 실전 가이드 부족 |
| **WHO** | AI 플랜을 생성한 모든 유저, 미생성 유저는 프로필 기반 폴백 |
| **RISK** | Gemini 프롬프트 변경 → weight_kg 미포함 응답 시 graceful null 처리 필요 |
| **SUCCESS** | 운동 탭 AI 카드 표시, 식단/프로필 탭 목표값 동적화, AI 운동 바로 시작 |

---

## 성공 기준 검증

| ID | 기준 | 결과 | 근거 |
|----|------|:----:|------|
| SC-1 | `WorkoutExercise.weight_kg` 필드 존재 + 프롬프트 포함 | **PASS** | `ai-plan-store.ts:38`, `ai-planner.ts:277` |
| SC-2 | 운동 탭 AI 플랜 오늘 운동 카드 (Rest Day 포함) | **PASS** | `workout-screen.tsx:183-231` 3가지 상태 처리 |
| SC-3 | "AI 플랜 운동 시작" 버튼 → WorkoutSession 진입 (운동 pre-load) | **PASS** | `workout-store.ts` `startFromAIPlan()` 추가, 세트/중량/반복 pre-load |
| SC-4 | 식단 탭 AI 플랜 칼로리 표시, 없으면 프로필 기반 계산 | **PASS** | `diet-screen.tsx:123-149` 4단계 폴백 구현 |
| SC-5 | 프로필 탭 AI 플랜 목표 섹션 표시 | **PASS** | `profile-screen.tsx:148-181` 목표/칼로리/매크로/생성일 |
| SC-6 | AI 플랜 없는 유저 크래시 없음 + 폴백 정상 | **PASS** | 전체 화면 `{currentPlan && ...}` 가드 적용 |
| FR-6 | 온보딩 강도 프로필 입력 스텝 (5개 종목) | **PASS** | `ai-onboarding-screen.tsx:177-441` |
| FR-7 | 강도 프로필 Gemini 프롬프트 포함 | **PASS** | `ai-planner.ts:198-205` strengthSection |

---

## 갭 수정 이력

| ID | 항목 | 상태 | 수정 내용 |
|----|------|:----:|---------|
| G-1 | AI 운동 세션 pre-load | **FIXED** | `workout-store.ts`에 `startFromAIPlan(exercises)` 추가 — repsRange 파싱, weight_kg 적용 |

---

## 추가 구현 (Plan 외)

| 항목 | 위치 | 설명 |
|------|------|------|
| 프로필 데이터 자동 채움 | `ai-onboarding-screen.tsx:203-222` | Supabase `user_profiles`에서 나이/키/체중 자동 로드 |
| 최소 칼로리 후처리 | `ai-planner.ts:355-362` | 성별 분화 하한(여성 1200/남성 1500) 응답 후 적용 |
| 강도 프로필 입력 (FR-6/7) | `ai-onboarding-screen.tsx`, `ai-planner.ts` | 사용자 요청으로 추가 — 운동별 현재 중량 입력 → Gemini 프롬프트 반영 |

---

## Match Rate 산출

| 항목 | 점수 |
|------|------|
| SC-1~6, FR-6~7 총 8항목 | |
| PASS: 8항목 (G-1 수정 후) | 8.0 |
| **합계** | **8 / 8 = 100%** |
