# Analysis: onboarding-inputs

> Feature: 온보딩 신체 정보 자동 채우기 + 안전 가드레일 완성
> Analyzed: 2026-03-25
> Match Rate: 100%

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | CLAUDE.md P0 — ai-planner Gap C-3/C-4 미수정. 하드코딩 폴백 + 최소 칼로리 미체크 |
| **WHO** | 프로필 탭에서 신체 정보를 이미 입력한 모든 로그인 유저 |
| **RISK** | `user_profiles` 조회 실패 시 빈 입력창으로 시작 — 기존과 동일한 UX, 크래시 없음 |
| **SUCCESS** | 프로필 데이터 있는 유저 → 자동 채워짐; 1200kcal 미만 플랜 → 생성 차단 |
| **SCOPE** | 2개 파일 수정 |

---

## 1. 분석 범위

| 파일 | 변경 내용 |
|------|-----------|
| `src/screens/ai/ai-onboarding-screen.tsx` | useEffect pre-fill 추가 + 하드코딩 폴백 제거 |
| `src/lib/ai-planner.ts` | estimateDailyCalories() + validateSafety() 칼로리 체크 |

---

## 2. Gap 분석

### FR-1 — user_profiles pre-fill (SC-1, SC-2)

| 항목 | Plan 스펙 | 구현 | 상태 |
|------|-----------|------|------|
| useEffect 마운트 시 실행 | `[user?.id]` 의존성 | line 193, 212 | ✅ 일치 |
| Supabase 쿼리 컬럼 | `age, height_cm, weight_kg` | line 199 | ✅ 일치 |
| 쿼리 필터 | `.eq('id', user.id)` | line 200 | ✅ 일치 |
| null-safe 쿼리 | `.maybeSingle()` | line 201 | ✅ 일치 |
| 조건부 spread | `data.age ? ... : {}` 패턴 | lines 205-207 | ✅ 일치 |
| 에러 격리 | 독립 `try/catch {}` | line 210 | ✅ 일치 |

### FR-2 — 하드코딩 폴백 제거 (SC-3)

| 항목 | Plan 스펙 | 구현 | 상태 |
|------|-----------|------|------|
| `?? '30'` 제거 | → `?? '0'` | line 277 | ✅ 일치 |
| `?? '170'` 제거 | → `?? '0'` | line 278 | ✅ 일치 |
| `?? '70'` 제거 | → `?? '0'` | line 279 | ✅ 일치 |

**grep 검증**: 0 occurrences

### FR-3 — validateSafety 최소 칼로리 체크 (SC-4)

| 항목 | Plan 스펙 | 구현 | 상태 |
|------|-----------|------|------|
| estimateDailyCalories() 함수 | Mifflin-St Jeor | lines 21-27 | ✅ 일치 |
| BMR male 공식 | `10w + 6.25h - 5a + 5` | line 25 | ✅ 일치 |
| BMR female 공식 | `10w + 6.25h - 5a - 161` | line 24 | ✅ 일치 |
| 활동 계수 | `* 1.2` (sedentary) | line 26 | ✅ 일치 |
| 입력값 > 0 가드 | `age > 0 && weight > 0 && height > 0` | line 69 | ✅ 일치 |
| TDEE 적자 | `tdee - 500` | line 71 | ✅ 일치 |
| 최소 칼로리 차단 | `targetCalories < 1200` | line 72 | ✅ 일치 |
| blocked 반환 | `reason: 'below_minimum_calories'` | line 75 | ✅ 일치 |

---

## 3. 성공 기준 검증

| ID | 기준 | 결과 |
|----|------|------|
| SC-1 | 프로필 데이터 있는 유저 → 온보딩 자동 채워짐 | ✅ PASS |
| SC-2 | 프로필 미설정 유저 → 빈 입력창, 크래시 없음 | ✅ PASS |
| SC-3 | `?? '30'`/`?? '170'`/`?? '70'` 0건 | ✅ PASS |
| SC-4 | 1200kcal 미만 → blocked: true | ✅ PASS |

---

## 4. 결론

**Match Rate: 100%**

- Gap 없음
- Plan 요구사항 FR-1, FR-2, FR-3 모두 완전 구현
- 성공 기준 SC-1~SC-4 모두 충족
- 추가 이터레이션 불필요
