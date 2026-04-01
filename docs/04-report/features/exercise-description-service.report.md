# 기능 보고서: 운동 종목 설명 시각 자료 제공 서비스

**기능명:** `exercise-description-service`
**버전:** 1.0.0
**날짜:** 2026-04-01
**Match Rate:** 99%

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | `exercises` 테이블에 `visual_guide_url` 인프라는 존재했지만 설명 텍스트 필드가 없고 GIF 탭 시 전체화면 모달이 없어, 사용자가 낯선 운동을 앱 밖에서 검색해야 했다. |
| **해결책** | `description_en`/`description_ko` 컬럼 추가, `ExerciseVisualGuide` 컴포넌트에 Modal + 설명 텍스트를 통합하고, Wger/GIPHY/YouTube API 자동 수집 스크립트로 콘텐츠를 채울 수 있는 파이프라인을 완성했다. |
| **기능 UX 효과** | 운동 카드의 GIF/유튜브 썸네일을 탭하면 전체화면 모달에서 동작과 한국어 설명을 확인할 수 있으며, 검색 화면에서도 썸네일 미리보기로 종목 선택 자신감이 높아진다. |
| **핵심 가치** | 앱 이탈 없이 운동 자세 정보를 제공하는 교육 레이어를 완성해, 피트니스 앱으로서의 완성도와 사용자 체류 시간을 높인다. |

---

## 1. 구현 세부 내용

### 1.1 DB 스키마 (M1)

- **파일:** `supabase/migrations/20260401_add_description_to_exercises.sql`
- `description_en TEXT`, `description_ko TEXT` 컬럼 추가 (`IF NOT EXISTS` 안전 패턴)
- `visual_guide_url`은 exercise-visual-guide v1.0에서 이미 존재 — 마이그레이션 불필요 확인

### 1.2 타입 업데이트 (M2)

- **`src/types/workout.ts`** — `Exercise` 인터페이스에 `description_en?: string`, `description_ko?: string` 추가
- **`src/types/program.ts`** — `ProgramExerciseRow.exercises` 인라인 타입에 동일 필드 추가

### 1.3 스토어 쿼리 업데이트 (M3)

- **`src/stores/workout-store.ts`** — `startFromProgram` 내 exercise 매핑에 `description_en`, `description_ko` 필드 포함
- `exercise-search-screen`은 `.select('*')` 사용 중이므로 별도 수정 불필요 (자동 포함)

### 1.4 ExerciseVisualGuide 컴포넌트 (M5)

- **`src/components/workout/ExerciseVisualGuide.tsx`** 전면 개편:
  - Props 확장: `description?: string`, `exerciseName?: string` 추가
  - 인라인 썸네일 크기 조정: GIF 80×80, YouTube 100×56 + 재생 아이콘 오버레이
  - 탭 시 전체화면 `<Modal>` — 헤더(종목명 + 닫기), GIF/YouTube 미디어, description 텍스트
  - GIF 로딩 중 `ActivityIndicator` 표시
  - Named exports 추출: `isYoutubeUrl`, `getYoutubeThumbnail`, `getThumbnailUri` (검색 화면에서 재사용)

### 1.5 화면 통합 (M6)

- **`src/screens/workout/workout-session-screen.tsx`** — `description`, `exerciseName` prop 전달
- **`src/screens/workout/program-detail-screen.tsx`** — 동일

### 1.6 검색 화면 썸네일 (M7)

- **`src/screens/workout/exercise-search-screen.tsx`**:
  - `getThumbnailUri` import 추가
  - `renderItem`에 40×40 썸네일 이미지 삽입 (+ 아이콘 왼쪽)
  - `visual_guide_url` 없는 종목은 공간 미차지

### 1.7 자동 수집 스크립트 (M4)

- **`scripts/fetch-exercise-content.js`** 신규 생성:
  - Wger REST API → `description_en`
  - GIPHY API → `visual_guide_url` (GIF 우선, 36ms 딜레이)
  - YouTube Data API v3 → `visual_guide_url` (GIPHY 미수집 시 폴백)
  - 배치 upsert (`on_conflict=id`, `resolution=merge-duplicates`) — 기존 값 보호
  - 콘솔 결과 요약 출력
- **`.env.scripts.example`** — API 키 템플릿 파일 생성
- **`.gitignore`** — `.env.scripts` 추가

---

## 2. 기술 결정 사항

| 결정 | 이유 |
|------|------|
| Option C (단일 컴포넌트) 선택 | 재사용 가능성이 낮은 모달을 별도 파일로 분리하는 복잡성보다 단일 파일 유지가 실용적 |
| One-shot 스크립트 | 배치 스케줄러 없이 수동 1회 실행으로 초기 데이터 채우기에 충분 |
| 검색 썸네일 오른쪽 배치 | 기존 레이아웃(`itemContent` + `+` 아이콘) 최소 변경으로 통합 |
| Named exports | `getThumbnailUri` 등을 검색 화면에서 재사용해 로직 중복 제거 |
| 배치 upsert | row-by-row PATCH 대비 DB 왕복 횟수 감소, 대용량 종목에서 성능 이점 |

---

## 3. 테스트 방법

1. **DB 마이그레이션 적용:**
   Supabase SQL Editor에서 `supabase/migrations/20260401_add_description_to_exercises.sql` 실행

2. **데이터 수동 입력 (빠른 테스트):**
   ```sql
   UPDATE exercises
   SET visual_guide_url = 'https://burnfit.io/wp-content/uploads/BB_BSQT.gif',
       description_ko = '바벨을 어깨에 걸치고 발을 어깨너비로 벌려 무릎과 고관절을 굽히며 앉았다가 일어서는 복합 하체 운동.'
   WHERE name_ko = '스쿼트';
   ```

3. **운동 세션에서 확인:**
   - 스쿼트 포함 세션 시작 → 운동 카드에서 GIF 썸네일 확인
   - 썸네일 탭 → 모달 전체화면 + description 텍스트 확인

4. **프로그램 상세 화면에서 확인:**
   - 스쿼트 포함 프로그램 상세로 이동 → 운동 이름 옆 썸네일 확인

5. **검색 화면에서 확인:**
   - 종목 검색 → 스쿼트 항목 오른쪽에 40×40 썸네일 확인

6. **자동 수집 스크립트 실행 (API 키 있을 때):**
   ```bash
   cp .env.scripts.example .env.scripts
   # .env.scripts에 API 키 입력
   node scripts/fetch-exercise-content.js
   ```

---

## 4. 성공 지표 현황

| 지표 | 목표 | 현황 |
|------|------|------|
| `visual_guide_url` 채움률 | > 60% | 자동 수집 스크립트 실행 시 달성 가능 (인프라 완성) |
| `description_ko` 채움률 | > 50% | 스크립트로 `description_en` 수집 후 수동 번역 또는 추후 번역 파이프라인으로 달성 가능 |
| 모달 탭률 | > 20% | 데이터 채운 후 측정 가능 |
| 타입체크 통과 | 오류 없음 | 내 변경 파일 기준 0개 오류 ✅ |

---

## 5. 향후 개선 가능성

- **`description_ko` 자동 번역**: `description_en` 수집 후 Google Translate API 또는 DeepL로 자동 번역 파이프라인 추가
- **GIF 성능 최적화**: `react-native-fast-image` 도입으로 로딩/캐싱 개선 (v1.1+ 검토)
- **관리자 인터페이스**: Supabase 대시보드 없이 URL을 추가할 수 있는 내부 도구
- **인앱 YouTube 플레이어**: `react-native-webview` 기반 인앱 재생 (앱 전환 없이)
- **스크립트 배치 스케줄화**: 신규 종목 추가 시 자동으로 콘텐츠를 수집하는 cron 파이프라인
