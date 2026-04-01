# 기능 계획: 운동 종목 설명 시각 자료 제공 서비스

**기능명:** `exercise-description-service`
**버전:** 1.0.0
**날짜:** 2026-04-01

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 운동 종목 이름만 있고 설명 텍스트·시각 자료가 없어 사용자가 낯선 운동을 앱 밖에서 검색해야 한다. 기존 `visual_guide_url` 인프라는 있지만 콘텐츠가 비어 있다. |
| **해결책** | Wger API·YouTube API·GIPHY API로 자동 수집 스크립트를 만들어 `description_en/ko` + `visual_guide_url`을 채우고, `ExerciseVisualGuide` 컴포넌트에 모달 뷰어와 설명 텍스트를 추가한다. |
| **기능 UX 효과** | 운동 카드를 탭하면 GIF 전체화면 모달과 한국어 설명이 즉시 제공되어 앱 이탈 없이 자세를 확인할 수 있다. |
| **핵심 가치** | 운동 교육 콘텐츠 레이어를 앱 내에 완성해 피트니스 앱으로서의 완성도와 사용자 체류 시간을 높인다. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 콘텐츠 없는 인프라(빈 URL 필드)를 실제 가치로 채워 앱의 교육적 기능을 완성하기 위함 |
| **WHO** | 낯선 종목을 처음 접하는 초보·중급 사용자, 운동 자세 재확인이 필요한 모든 사용자 |
| **RISK** | 외부 API 레이트 리밋/비용, 자동 수집 품질 오류(잘못된 GIF 매핑), 한국어 번역 품질 |
| **SUCCESS** | 주요 종목 100개 이상 설명 + 시각 자료 채워짐 / 모달 탭률 > 20% |
| **SCOPE** | 자동 수집 스크립트 + `exercises` 테이블 컬럼 2개 추가 + `ExerciseVisualGuide` 모달 개선 + 설명 텍스트 UI 통합 |

---

## 1. 문제 정의

### 1.1 현재 상태
- `exercises` 테이블에 `visual_guide_url TEXT` 컬럼은 존재하지만 대부분 NULL
- `ExerciseVisualGuide` 컴포넌트는 GIF를 인라인 표시하고 YouTube 링크를 외부로 열지만, 탭 시 전체화면 모달 없음
- 운동 설명 텍스트 필드 없음 → 사용자가 자세를 확인하려면 앱 밖에서 직접 검색 필요

### 1.2 사용자 불편
1. 운동 세션 중 낯선 종목 → 구글 검색 → 앱 복귀 흐름 (이탈)
2. 프로그램 상세 화면에서 "이 운동이 뭔지 모르겠음" → 진입 장벽
3. 운동 검색 결과에서 종목 이름만 보여 선택 자신감 낮음

---

## 2. 제안 해결책

### 2.1 콘텐츠 자동 수집 파이프라인

외부 공개 API 3종을 조합해 `exercises` 테이블의 빈 필드를 자동으로 채우는 Node.js 스크립트:

| 소스 | 수집 내용 | 우선순위 |
|------|----------|---------|
| **Wger REST API** | 운동 이름 매핑 + `description_en` (영어 설명) | 1순위 |
| **YouTube Data API v3** | 운동명 검색 → 상위 영상 URL → `visual_guide_url` | 2순위 (GIF 없을 때) |
| **GIPHY / Tenor API** | 운동명 검색 → GIF URL → `visual_guide_url` | 1순위 (GIF 있으면 우선) |

**한국어 처리:** 영어 설명을 기반으로 `description_ko`는 초기에 Google Translate 비공식 방식 또는 수동 보완으로 채움. 장기적으로는 별도 번역 파이프라인 적용.

### 2.2 DB 스키마 확장

`exercises` 테이블에 컬럼 2개 추가:

```sql
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description_ko TEXT;
```

> `visual_guide_url`은 기존 컬럼 유지 (exercise-visual-guide에서 추가됨)

### 2.3 UI 개선

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| GIF 표시 | 인라인 200×200 고정 | 인라인 썸네일 + 탭 시 모달 전체화면 |
| YouTube | 썸네일 탭 → 외부 앱 이동 | 썸네일 탭 → 모달로 전체화면 (Linking.openURL 유지, 모달 내 버튼) |
| 설명 텍스트 | 없음 | 운동 카드 하단에 `description_ko` (없으면 `description_en`) 표시 |
| 검색 화면 | 시각 자료 없음 | 검색 결과 아이템에 썸네일 미리보기 |

---

## 3. 목표

- 운동 종목 100개 이상에 설명 텍스트 + 시각 자료 채우기 (콘텐츠 완성)
- GIF 모달 뷰어로 자세 확인 UX 완성 (UI 완성)
- 앱 이탈 없이 운동 정보를 제공하는 피트니스 교육 레이어 구축

## 4. 비-목표 (이번 버전 제외)

- 자체 운동 영상 촬영 / 호스팅
- 인앱 YouTube 플레이어 (`react-native-webview` — v1.1+ 검토)
- 단계별 수행 방법 / 근육 도해 등 상세 콘텐츠 (v2.0 검토)
- 관리자 인터페이스 (Supabase 대시보드로 수동 수정)
- 다국어 3개 언어 이상 (영어+한국어 2개 언어만)

---

## 5. 기술 구현 계획

### 5.1 DB 마이그레이션

**파일:** `supabase/migrations/20260401_add_description_to_exercises.sql`

```sql
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description_ko TEXT;
```

### 5.2 자동 수집 스크립트

**파일:** `scripts/fetch-exercise-content.js`

```
실행 순서:
1. Supabase에서 exercises 목록 전체 가져오기
2. name 기준으로 Wger API 검색 → description_en 매핑
3. name 기준으로 GIPHY/Tenor API 검색 → visual_guide_url (GIF) 매핑
4. GIF 없는 종목에 한해 YouTube API 검색 → visual_guide_url (YouTube URL) 매핑
5. Supabase upsert (기존 값 있으면 건너뜀 — 수동 입력 보호)
6. 수집 결과 요약 콘솔 출력
```

**환경 변수 (`.env.scripts`):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`
- `GIPHY_API_KEY`

> Supabase service role key는 스크립트 전용이며 클라이언트 번들에 포함 안 됨.

### 5.3 타입 업데이트

**파일:** `src/types/workout.ts`
- `Exercise` 타입에 `description_en?: string`, `description_ko?: string` 추가

**파일:** `src/types/program.ts`
- `ProgramExerciseRow` 타입에 동일 필드 추가

### 5.4 `ExerciseVisualGuide` 컴포넌트 개선

**파일:** `src/components/workout/ExerciseVisualGuide.tsx`

- 인라인 썸네일 크기 축소 (100×56 유지, GIF는 80×80으로 조정)
- 탭 시 `<Modal>` 열어 전체화면 GIF / YouTube 버튼 표시
- `description` prop 추가 → 모달 하단에 설명 텍스트 표시

```tsx
// 업데이트된 props
interface ExerciseVisualGuideProps {
  visualGuideUrl?: string;
  description?: string;       // description_ko || description_en
  exerciseName?: string;      // 모달 타이틀용
}
```

### 5.5 화면 통합 업데이트

| 파일 | 변경 내용 |
|------|----------|
| `src/screens/workout/workout-session-screen.tsx` | `ExerciseVisualGuide`에 `description` prop 전달 |
| `src/screens/workout/program-detail-screen.tsx` | `ExerciseVisualGuide`에 `description` prop 전달 |
| `src/screens/workout/exercise-search-screen.tsx` | 검색 결과 아이템에 썸네일 미리보기 추가 |
| `src/stores/workout-store.ts` | exercises 쿼리에 `description_en`, `description_ko` 포함 |

---

## 6. 구현 모듈 순서

| 모듈 | 작업 | 의존성 |
|------|------|---------|
| **M1** | DB 마이그레이션 (description 컬럼 2개) | 없음 |
| **M2** | 타입 업데이트 (`workout.ts`, `program.ts`) | M1 |
| **M3** | `workout-store` 쿼리 업데이트 | M2 |
| **M4** | 자동 수집 스크립트 개발 및 실행 | M1 |
| **M5** | `ExerciseVisualGuide` 모달 + description 개선 | M2 |
| **M6** | 세션/프로그램 화면에 description prop 전달 | M3, M5 |
| **M7** | 검색 화면 썸네일 미리보기 통합 | M3, M5 |

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Wger API 이름 매핑 실패 | 영어 이름이 앱 내 한국어 이름과 불일치 | 영어 이름 기준 퍼지 매칭 or 수동 보완 |
| GIPHY API 운동 GIF 품질 | 잘못된 GIF 매핑 (예: "스쿼트" → 관련없는 GIF) | 수집 후 Supabase에서 확인/삭제 가능. 기존 값 있으면 덮어쓰지 않음. |
| YouTube API 할당량 | 무료 티어 하루 10,000 units | 배치 실행 (하루 1회, 종목당 1 쿼리로 제한) |
| 한국어 번역 품질 | description_ko가 어색한 직역 | 초기 자동 번역 후 주요 종목은 수동 검수 |
| GIF 모달 성능 | 고용량 GIF 로딩 지연 | 모달 열릴 때 로딩 인디케이터 표시 |
| 네이티브 앱 영향 | 컴포넌트 변경이 네이티브 UX 깨뜨릴 가능성 | Platform-agnostic Modal 사용. 네이티브 테스트 우선. |

---

## 8. 성공 지표

| 지표 | 목표 |
|------|------|
| **콘텐츠 채움률** | exercises 테이블 내 `visual_guide_url` 채워진 종목 비율 > 60% |
| **설명 텍스트 채움률** | `description_ko` 채워진 종목 비율 > 50% |
| **모달 탭률** | 시각 자료 있는 종목에서 모달 열기 비율 > 20% |
| **앱 이탈 감소** | 운동 세션 중 앱 떠나는 비율 측정 (정성적 확인) |
| **타입체크 통과** | `npx tsc --noEmit` 오류 없음 |

---

## 9. 비기능 요구사항

- 네이티브 iOS/Android UI 동작 불변 원칙 유지 (CLAUDE.md)
- 수집 스크립트는 클라이언트 번들에 포함 안 됨 (`scripts/` 폴더)
- API 키는 `.env.scripts`에 분리 관리 (`.gitignore` 적용)
- `visual_guide_url` 기존 데이터 덮어쓰기 금지 (upsert 시 NULL인 경우만 업데이트)

---

## 10. 다음 단계

플랜 완료 후 → `/pdca design exercise-description-service`

설계 단계에서 결정할 사항:
- 자동 수집 스크립트 아키텍처 (단일 실행 vs. 배치 스케줄)
- `ExerciseVisualGuide` 모달 구체적인 레이아웃
- 검색 화면 썸네일 위치 및 크기
- 한국어 번역 방식 (수동 vs. 자동)
