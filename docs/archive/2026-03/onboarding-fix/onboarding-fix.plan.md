# Plan: onboarding-fix

> Feature: AI 플랜 품질 개선 (UUID + 칼로리 이력)
> Created: 2026-03-25
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | AI 플랜 ID가 `Math.random()`으로 생성돼 UUID 충돌 위험 존재. `avgDailyCalories`는 하드코딩 0으로 AI가 사용자의 실제 식사 패턴을 반영하지 못함 |
| **Solution** | Plan ID → `crypto.randomUUID()` (네이티브, 패키지 불필요). diet-sync 완료 기반으로 Supabase `meal_items`에서 최근 7일 평균 칼로리 실제 집계 |
| **Function UX Effect** | AI 플랜 생성 시 사용자의 실제 식단 데이터를 반영한 더 정확한 칼로리 목표 제시. UUID 보장으로 Supabase 저장 충돌 제거 |
| **Core Value** | AI 플랜이 사용자 실측 데이터(운동 + 식단) 기반으로 동작 — 단순 목표 설정이 아닌 현실 반영 플랜 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | P0 항목(온보딩 입력/SDK 제거/안전 가드레일)은 이미 구현 완료. 남은 P1 품질 이슈 처리 |
| **WHO** | AI 플랜 기능을 사용하는 모든 로그인 유저 |
| **RISK** | `avgDailyCalories`가 0이면 AI가 식단 패턴을 무시하고 플랜 생성 (기존 동작 유지 수준) |
| **SUCCESS** | Supabase에 식단 기록이 있는 유저는 AI 플랜에 실제 평균 칼로리가 반영됨 |
| **SCOPE** | `ai-planner.ts` 2개 함수만 수정. UI 변경 없음. |

---

## 1. 요구사항

### 1.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-1 | `generateAIPlan()`의 Plan ID를 `crypto.randomUUID()` 로 변경 | Must |
| FR-2 | `fetchUserHistorySummary()`에서 최근 7일 `meal_items` 집계 → `avgDailyCalories` 반환 | Must |
| FR-3 | meal_items 데이터가 없는 유저 (신규 / diet-sync 전)는 `avgDailyCalories = 0` 유지 | Must |

### 1.2 비기능 요구사항

- `crypto.randomUUID()`: 별도 패키지 설치 없이 RN/Expo 네이티브 API 사용
- 칼로리 쿼리 실패 시 0 반환 (기존 동작 유지, 플랜 생성 중단 없음)
- 기존 AI 플랜 생성 플로우 변경 없음 (두 함수 내부만 수정)

---

## 2. 범위

### In Scope
- `src/lib/ai-planner.ts`:
  - `generateAIPlan()`: `Math.random().toString(36)` → `crypto.randomUUID()`
  - `fetchUserHistorySummary()`: `avgDailyCalories = 0` → Supabase `meal_items` 7일 집계

### Out of Scope
- UI 변경 없음
- AI 프롬프트 변경 없음 (칼로리 섹션 이미 있음)
- 온보딩 화면 변경 없음 (이미 구현 완료)
- P2 항목 (테이블 통일, schema.md 업데이트 등)

---

## 3. 기술 설계 방향

### 3.1 FR-1 — Plan ID UUID

```typescript
// Before
id: Math.random().toString(36).slice(2),

// After
id: crypto.randomUUID(),
```

- `crypto.randomUUID()`: Web Crypto API, Expo/RN 환경에서 글로벌 지원
- 반환 형식: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` (RFC 4122 v4)

### 3.2 FR-2 — avgDailyCalories Supabase 집계

```typescript
// fetchUserHistorySummary 내부 추가 쿼리
const sevenDaysAgo = ...; // 기존 변수 재활용

// meal_logs JOIN → meal_items 최근 7일 칼로리 집계
const mealRes = await supabase
  .from('meal_logs')
  .select('meal_items(calories)')
  .eq('user_id', userId)
  .gte('logged_at', since);

// 일별 합계 → 평균 계산
// 데이터 없으면 0 반환
```

- `meal_logs.logged_at >= sevenDaysAgo` + `meal_items.calories` 집계
- 일별 합계 배열 생성 → 평균 = 총합 / 일수 (데이터 있는 날만)
- 오류 또는 데이터 없음 → `avgDailyCalories = 0` (기존 동작)

---

## 4. 성공 기준

| 항목 | 기준 |
|------|------|
| Plan ID 형식 | `uuid()` 형식 반환 (`xxxxxxxx-xxxx-4xxx-...`) |
| avgDailyCalories | Supabase에 식단 기록 있는 유저 → 실제 평균값 반환 |
| 신규 유저 | avgDailyCalories = 0, 플랜 정상 생성 |
| 오류 시 | 칼로리 집계 실패해도 AI 플랜 생성 계속 |

---

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| `crypto.randomUUID()` 미지원 환경 | Expo SDK 49+ / RN 0.71+ 기본 지원. 구버전은 polyfill 필요하나 이 프로젝트는 최신 버전 사용 |
| meal_items JOIN 쿼리 응답 지연 | Promise.all 병렬 실행 유지, 실패 시 catch → 0 반환 |
| RLS 미적용 시 다른 유저 데이터 노출 | user_id 필터로 안전 (`eq('user_id', userId)`) |

---

## 6. 구현 모듈 (Session Guide)

| 모듈 | 파일 | 내용 |
|------|------|------|
| module-1 | `src/lib/ai-planner.ts` | `generateAIPlan` ID 교체 + `fetchUserHistorySummary` 칼로리 집계 |
