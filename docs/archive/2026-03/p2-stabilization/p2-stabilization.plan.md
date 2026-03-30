# Plan: p2-stabilization

> Feature: P2 안정화 — 테이블 통일 + Supabase Edge Function 보안
> Created: 2026-03-26
> Status: Plan

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | `profiles` vs `user_profiles` 테이블 이중화로 코드 혼선 발생; Gemini API 키가 클라이언트에 노출되어 보안 취약점 존재 |
| **Solution** | program-review-screen을 `user_profiles`로 단일화; Supabase Edge Function으로 API 키를 서버사이드로 이전 |
| **Function UX Effect** | 프로그램 리뷰 화면에서 기존 프로필 정보(나이/성별)가 자동 프리필; AI 플랜 생성 보안 강화로 API 키 유출 위험 제거 |
| **Core Value** | 코드베이스 일관성 확보 + 프로덕션 배포 가능한 보안 수준 달성 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 프로덕션 전 필수 작업: 테이블 불일치 버그 + 클라이언트 API 키 노출 보안 이슈 해결 |
| **WHO** | 개발자 (버그 수정 + 보안 강화) |
| **RISK** | Edge Function 배포 실패 시 AI 플랜 기능 동작 불가; birth_year→age 변환 오류 시 프로필 덮어쓰기 |
| **SUCCESS** | 코드에서 `profiles` 테이블 참조 0개; Gemini API 키가 번들에 미포함; AI 플랜 정상 생성 |
| **SCOPE** | program-review-screen.tsx + ai-planner.ts + 새 Edge Function 파일 |

---

## 1. 배경 및 현황

### 1.1 Task A — profiles vs user_profiles 테이블 불일치

**현재 상태:**
- `profiles` 테이블: `program-review-screen.tsx`에서만 사용 (`gender`, `birth_year` 컬럼)
- `user_profiles` 테이블: 프로필 탭, AI 플랜 등 전체에서 사용 (`gender`, `age`, `height_cm`, `weight_kg` 등)
- **문제**: 리뷰 화면에서 입력한 성별/나이가 메인 프로필과 별개의 테이블에 저장됨

**코드 위치:**
- `src/screens/workout/program-review-screen.tsx:193` — `supabase.from('profiles').select()`
- `src/screens/workout/program-review-screen.tsx:229` — `supabase.from('profiles').upsert()`

**수정 방향:**
- `profiles` → `user_profiles` 교체
- `birth_year` → `age` 변환: `new Date().getFullYear() - birth_year`
- UI: 출생연도 입력 필드 → 나이 입력 필드로 변경 (또는 birth_year 입력 후 변환)

### 1.2 Task B — Gemini API 키 클라이언트 노출

**현재 상태:**
- `src/lib/ai-planner.ts:475` — `process.env.EXPO_PUBLIC_GEMINI_API_KEY`를 직접 fetch 호출에 사용
- `EXPO_PUBLIC_` 접두사 = 번들에 포함되어 누구나 볼 수 있음

**수정 방향:**
- `supabase/functions/generate-ai-plan/index.ts` Edge Function 생성
- Edge Function에서 `Deno.env.get('GEMINI_API_KEY')`로 서버사이드 키 사용
- 클라이언트는 `supabase.functions.invoke('generate-ai-plan', { body: prompt })` 호출로 변경

---

## 2. 기능 요구사항

### Task A — 테이블 통일

| ID | 요구사항 |
|----|---------|
| FR-A1 | program-review-screen에서 `profiles` 테이블 참조 제거 |
| FR-A2 | 리뷰 화면의 성별/출생연도 데이터를 `user_profiles`에 저장 |
| FR-A3 | birth_year 입력 → `age = currentYear - birth_year` 변환 후 `user_profiles.age` upsert |
| FR-A4 | 화면 로드 시 `user_profiles`에서 기존 gender/age 프리필 |

### Task B — Edge Function

| ID | 요구사항 |
|----|---------|
| FR-B1 | `supabase/functions/generate-ai-plan/index.ts` 생성 |
| FR-B2 | Edge Function이 요청 body에서 prompt 수신 후 Gemini REST API 호출 |
| FR-B3 | Gemini API 키는 Supabase Secret (`GEMINI_API_KEY`)으로 관리 |
| FR-B4 | `ai-planner.ts`에서 직접 fetch → `supabase.functions.invoke()` 로 교체 |
| FR-B5 | 기존 `EXPO_PUBLIC_GEMINI_API_KEY` 환경변수 제거 (또는 더 이상 번들에 포함 안 되도록) |
| FR-B6 | Supabase CLI 설치 안내 포함 |

---

## 3. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| 호환성 | 기존 AI 플랜 생성 흐름 동일하게 유지 |
| 보안 | API 키가 빌드 번들에 포함되지 않을 것 |
| 성능 | Edge Function 콜드 스타트 고려 — 타임아웃 30s 설정 |
| 에러 처리 | Edge Function 실패 시 사용자에게 명확한 에러 메시지 표시 |

---

## 4. 성공 기준

| ID | 기준 | 검증 방법 |
|----|------|---------|
| SC-1 | 코드에서 `.from('profiles')` 참조 0개 | `grep -r "from('profiles')" src/` |
| SC-2 | `EXPO_PUBLIC_GEMINI_API_KEY` 코드 참조 0개 | `grep -r "EXPO_PUBLIC_GEMINI" src/` |
| SC-3 | 리뷰 화면에서 성별/나이 저장 → user_profiles에 반영 | Expo Go 직접 테스트 |
| SC-4 | AI 플랜 생성 정상 동작 (Edge Function 경유) | Expo Go 직접 테스트 |
| SC-5 | Edge Function 배포 완료 | `supabase functions list` |

---

## 5. 범위

### In-Scope
- `src/screens/workout/program-review-screen.tsx` 수정
- `src/lib/ai-planner.ts` 수정 (Gemini 직접 호출 → Edge Function 호출)
- `supabase/functions/generate-ai-plan/index.ts` 신규 생성
- Supabase CLI 설치 + Edge Function 배포

### Out-of-Scope
- `profiles` 테이블 자체 삭제 (Supabase SQL Editor에서 수동 작업, 코드 변경 후 별도 진행)
- `docs/schema.md` 업데이트 (P2-C로 별도 진행)
- nSuns E2E 테스트 (디바이스 테스트, 코드 변경 없음)

---

## 6. 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| birth_year→age 변환 시 기존 user_profiles.age 덮어쓰기 | 중간 | upsert 시 age가 null인 경우만 업데이트, 또는 사용자에게 확인 |
| Edge Function 콜드 스타트 지연 | 낮음 | 30s 타임아웃 설정, 로딩 UI 유지 |
| Supabase CLI 미설치 환경 | 중간 | CLI 설치 → Secret 설정 → 배포 순서 가이드 문서화 |
| `profiles` 테이블에 기존 데이터 존재 | 낮음 | 코드 변경 후 테이블 삭제는 별도 진행, 마이그레이션 불필요 (리뷰 UI에서만 사용하던 임시 데이터) |

---

## 7. 구현 순서 (권장)

```
1. Task A 먼저
   1-1. program-review-screen.tsx: profiles → user_profiles
   1-2. birth_year UI → age 또는 변환 로직 추가
   1-3. SC-1 검증 (grep)

2. Task B
   2-1. Supabase CLI 설치 확인 / 안내
   2-2. supabase/functions/generate-ai-plan/index.ts 작성
   2-3. ai-planner.ts 수정
   2-4. Secret 설정 (GEMINI_API_KEY)
   2-5. Edge Function 배포
   2-6. SC-2, SC-4 검증
```

---

## 8. Supabase CLI 가이드 (Task B 사전 준비)

### 설치 확인
```bash
supabase --version
```

### 미설치 시 설치 (macOS)
```bash
brew install supabase/tap/supabase
```

### 프로젝트 연결
```bash
supabase link --project-ref <YOUR_PROJECT_REF>
# Project Ref: Supabase 대시보드 → Settings → General → Reference ID
```

### Secret 설정
```bash
supabase secrets set GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

### 배포
```bash
supabase functions deploy generate-ai-plan
```
