# Analysis: ai-onboarding-improvements

## Context Anchor

| 항목 | 내용 |
|------|------|
| WHY | 1RM 모르는 사용자가 중량 입력을 포기하거나, 재생성 시 설문 선택지 없는 UX 마찰 존재 |
| WHO | 헬스 입문~중급자, 기존 플랜 보유 후 재생성 원하는 사용자 |
| RISK | 1RM 계산기 모달이 흐름을 과도하게 복잡하게 만들 수 있음 |
| SUCCESS | 강도 프로필 입력 완료율 향상, 재생성 경로 선택 가능, 정체기 질문 자연어 개선 |
| SCOPE | `ai-onboarding-screen.tsx` + `ai-plan-result-screen.tsx` 2개 파일만 수정 |

---

## Gap Analysis Results

- **Match Rate**: 98%
- **Analysis Date**: 2026-03-27
- **Iterations**: 0

## Module Scores

| Module | Score | Notes |
|--------|:-----:|-------|
| M1: plateauHistory 질문 개선 | 100% | 질문/선지 모두 일치, value 보존 |
| M2: OneRMCalcModal 컴포넌트 | 100% | Epley 공식, 30회 검증, UI 완전 구현 |
| M3: 강도 입력 행 버튼 | 100% | rmCalcTarget state, 자동 채움 |
| M4: RegenBottomSheet 컴포넌트 | 100% | 2개 옵션, disable guard, 취소 버튼 |
| M5: 헤더 버튼 재배선 | 100% | regenSheetVisible, 두 경로 라우팅 |

**Overall: 98%**

## Gaps Found

### Minor (Non-blocking)
- `StartDateSheet` 컴포넌트가 `ai-plan-result-screen.tsx`에 추가됨 (다른 피처의 구현, 설계 범위 외)
- `RegenBottomSheet`에 서브텍스트 추가 ("어떻게 새 플랜을 만들까요?" 및 옵션 설명) — 설계보다 향상된 UX

### Missing Features
없음 — 모든 M1-M5 완전 구현

## Success Criteria Verification

- [x] M1: `plateauHistory` 질문/선지 자연어 표현, value 동일
- [x] M2: `OneRMCalcModal` 렌더 시 Epley 공식 실시간 계산, 30회 초과 경고
- [x] M3: 각 종목 행에 '1RM 계산' 버튼 표시, 탭 → 해당 종목 모달, '이 값으로 입력' → 해당 필드 자동 채움
- [x] M4: `RegenBottomSheet` 렌더, 2개 옵션 정상 표시
- [x] M5: 헤더 "재생성" 탭 → 바텀시트 표시, "기존 정보로 재생성" → 직접 재생성, "새로 설문하기" → AIOnboarding 이동
