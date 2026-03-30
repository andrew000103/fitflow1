# Plan: adaptive-workout-intensity

> Feature: 적응형 운동 강도 조정 (초보자 스킵 + 룰 기반 + AI 히스토리 반영)
> Created: 2026-03-25
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | 운동 초보자(특히 다이어트 목표 여성)에게 강도 프로필 입력이 심리적 장벽으로 작용하며, 모든 레벨의 사용자가 실제 수행 데이터를 다음 운동에 반영하지 못해 AI 플랜이 정적인 한계 존재 |
| **Solution** | 강도 프로필 입력 스텝 건너뛰기 지원 (Skip 시 0kg 보수적 기본값) + 룰 기반 주간 중량 자동 조정 (AI 없이) + AI 재생성 시 최근 2주 운동 기록 프롬프트 주입 |
| **Function UX Effect** | 초보자: 부담 없이 온보딩 완료 → 맨몸 수준부터 시작 → 매주 점진적 증량 / 중고급자: 실제 완수한 중량/세트 기반으로 다음 주 자동 조정 또는 AI 재생성 시 정밀한 강도 설정 |
| **Core Value** | AI 플랜의 진입 장벽 최소화 + 실사용 데이터 기반 동적 강도 조정 → 모든 레벨의 사용자가 지속 가능한 운동 루틴 형성 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 강도 입력 강제로 초보자 이탈 위험, 정적 플랜으로 점진적 과부하 원칙 미적용 |
| **WHO** | 운동 초보자(특히 다이어트 목표 여성), 기존 강도 입력 완료 중고급자 모두 |
| **RISK** | 룰 기반 증량이 부상으로 이어질 수 있음 → 보수적 증량 폭 설정 필수 (compound +2.5kg, isolation +1kg 최대) |
| **SUCCESS** | Skip 후 플랜 정상 생성, 주간 자동 조정 적용, AI 재생성 시 히스토리 반영 |
| **SCOPE** | onboarding skip + rule-based adjustment (주간리뷰) + AI prompt history injection; 실시간 세션 중 조정 제외 |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | 온보딩 강도 프로필 스텝에 "건너뛰기" 버튼 추가 | P0 |
| FR-2 | Skip 시 `strengthProfile = []` → Gemini 프롬프트에 "보수적 0kg/맨몸 운동 기준으로 weight_kg 설정" 지시 | P0 |
| FR-3 | `applyRuleBasedAdjustment()` 함수 구현: 최근 1주 workout_sets 데이터 조회 → 종목별 완수율 계산 → weight_kg 조정 | P0 |
| FR-4 | 주간 리뷰 화면에 "중량 자동 조정" 버튼 추가 → FR-3 실행 후 플랜 업데이트 | P0 |
| FR-5 | AI 플랜 재생성 시 `fetchRecentWorkoutPerformance()` 호출 → 최근 2주 기록을 Gemini 프롬프트에 주입 | P1 |
| FR-6 | 운동 기록 없는 신규 사용자 / 데이터 부족 시 graceful fallback (조정 스킵, 크래시 없음) | P0 |

### 1.2 룰 기반 증량/감량 규칙

| 완수율 | 조치 |
|--------|------|
| ≥ 90% (모든 계획 세트·반복 완료) | +2.5kg (compound), +1kg (isolation/accessory) |
| 60~89% (일부 세트 완료) | 현상 유지 |
| < 60% (절반 미만 완료) | -2.5kg (compound), -1kg (isolation), 최소 0kg |

- **Compound 분류**: 스쿼트, 데드리프트, 벤치프레스, 오버헤드프레스, 바벨로우, 풀업
- **완수율 계산**: `실제 완료 reps / 계획 reps × 완료 세트수 / 계획 세트수`
- 운동 기록이 없는 종목은 현상 유지

### 1.3 AI 히스토리 프롬프트 형식

```
[최근 운동 수행 기록 (2주)]
- 스쿼트: 60kg × 5회 × 3세트 완료 (목표: 5회 × 3세트) — 완수율 100%
- 벤치프레스: 50kg × 5회 × 2세트만 완료 (목표: 5회 × 3세트) — 완수율 67%
- 런지: 기록 없음 (첫 주차)
→ 위 수행 데이터를 참고하여 다음 주 weight_kg 및 sets/repsRange를 현실적으로 조정해주세요.
```

---

## 2. 기술 범위

### 2.1 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/screens/ai/ai-onboarding-screen.tsx` | 강도 스텝 "건너뛰기" 버튼 추가, Skip 시 `strengthProfile = []` 처리 |
| `src/lib/ai-planner.ts` | Skip 분기 프롬프트 추가, `fetchRecentWorkoutPerformance()` 함수 신규, `workoutHistorySection` 프롬프트 주입 |
| `src/stores/ai-plan-store.ts` | `applyRuleBasedAdjustment(userId: string)` 액션 추가, Supabase workout_sets 조회 로직 |
| `src/screens/ai/ai-plan-weekly-screen.tsx` | "중량 자동 조정" 버튼 추가, 조정 결과 미리보기 표시 |

### 2.2 Supabase 조회 쿼리 (신규)

```sql
-- 최근 N일 운동 세트 기록
SELECT ws.weight_kg, ws.reps, ws.is_done, e.name_ko, e.category
FROM workout_sets ws
JOIN workout_sessions wses ON ws.session_id = wses.id
JOIN exercises e ON ws.exercise_id = e.id
WHERE wses.user_id = :userId
  AND wses.started_at >= NOW() - INTERVAL ':days days'
  AND ws.is_done = true
ORDER BY wses.started_at DESC
```

> **Note**: `local::ai-*` ID 운동(AI 플랜에서 생성된 임시 종목)은 exercises 테이블에 없음 → exercise_id가 `local::` 접두사면 name_ko만 저장된 raw 기록 활용. 향후 매핑 개선 가능.

---

## 3. 성공 기준

| ID | 기준 |
|----|------|
| SC-1 | 강도 스텝에서 "건너뛰기" 클릭 시 다음 스텝으로 넘어가고, 생성된 플랜의 `weight_kg`이 모두 0 또는 null |
| SC-2 | `applyRuleBasedAdjustment()` 호출 시 완수율 기반으로 `currentPlan.weeklyWorkout[].exercises[].weight_kg` 값 변경 |
| SC-3 | 주간 리뷰 화면 "중량 자동 조정" 버튼 클릭 → 조정 적용 → 화면 닫힘 |
| SC-4 | AI 재생성 시 Gemini 프롬프트에 `[최근 운동 수행 기록]` 섹션 포함 (기록 있을 때) |
| SC-5 | 운동 기록 없는 신규 유저: 조정 없이 정상 동작, 크래시 없음 |

---

## 4. 리스크

| 리스크 | 대응 |
|--------|------|
| `local::ai-*` exercise_id로 저장된 세트가 exercises 테이블과 조인 불가 | workout_sets 저장 시 exercise_id 대신 exercise_name_ko도 같이 저장하는 방안 검토 (현재는 name 매칭으로 fallback) |
| 룰 기반 증량이 과도한 부하로 이어질 위험 | 최대 증량 폭 제한 (+2.5kg), 1회 적용 후 재적용 간격은 UX 흐름으로 자연 제한 |
| Gemini 히스토리 프롬프트 길이 증가 → 응답 지연 | 최대 종목 10개, 최대 3회 기록으로 제한 |
| AI 플랜에서 생성된 종목명 vs 실제 운동 종목명 불일치 | 정확 매칭 → 부분 매칭 fallback; 불일치 시 해당 종목 현상 유지 |

---

## 5. 다음 단계

- `/pdca design adaptive-workout-intensity` → 설계 문서 작성
- 구현 후 `/pdca analyze adaptive-workout-intensity` → Gap 분석
