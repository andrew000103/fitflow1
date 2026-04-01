# 설계 문서: 운동 종목 설명 시각 자료 제공 서비스

**기능명:** `exercise-description-service`
**버전:** 1.0.0
**날짜:** 2026-04-01
**아키텍처:** Option C — Pragmatic Balance (단일 컴포넌트 확장)

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

## 1. 아키텍처 개요

### 1.1 선택된 설계안: Option C — Pragmatic Balance

`ExerciseVisualGuide.tsx` 단일 파일을 확장해 인라인 썸네일 + 탭 시 Modal + description 텍스트를 모두 처리한다. 컴포넌트 분리 없이 props 확장만으로 Plan의 모든 요구사항을 충족한다.

```
ExerciseVisualGuide (src/components/workout/ExerciseVisualGuide.tsx)
  ├─ 인라인 렌더링
  │    ├─ GIF: 80×80 썸네일 Image
  │    ├─ YouTube: 100×56 썸네일 Image
  │    └─ description (있을 때): 2줄 이내 미리보기 텍스트
  └─ 탭 → <Modal visible={modalVisible}>
               ├─ 헤더: exerciseName + 닫기(×) 버튼
               ├─ GIF: 전체 너비 Image (aspectRatio 1:1)
               │   또는 YouTube 썸네일 + "YouTube에서 보기" 버튼
               └─ description: ScrollView 내 전체 텍스트
```

### 1.2 콘텐츠 파이프라인 흐름

```
[Supabase exercises 테이블]
        ↑ upsert (NULL인 필드만)
[scripts/fetch-exercise-content.js]  ← node 단일 실행
        ├─ Wger REST API  →  description_en
        ├─ GIPHY API      →  visual_guide_url (GIF 우선)
        └─ YouTube API    →  visual_guide_url (GIF 없을 때)
```

---

## 2. DB 스키마 변경

### 2.1 마이그레이션 파일

**파일:** `supabase/migrations/20260401_add_description_to_exercises.sql`

```sql
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ko TEXT;
```

> `visual_guide_url`은 이미 존재하는 컬럼 — 마이그레이션 불필요.

### 2.2 업데이트 후 exercises 테이블 컬럼

| 컬럼 | 타입 | 신규 여부 | 설명 |
|------|------|----------|------|
| `id` | UUID | 기존 | PK |
| `name_ko` | TEXT | 기존 | 한국어 이름 |
| `name_en` | TEXT | 기존 | 영어 이름 |
| `category` | TEXT | 기존 | 카테고리 |
| `visual_guide_url` | TEXT | 기존 (v1.0) | GIF 또는 YouTube URL |
| `description_en` | TEXT | **신규** | 영어 설명 |
| `description_ko` | TEXT | **신규** | 한국어 설명 |

---

## 3. 타입 변경

### 3.1 `src/types/workout.ts`

```typescript
export interface Exercise {
  id: string;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  default_rest_seconds: number;
  is_custom: boolean;
  visual_guide_url?: string;
  description_en?: string;   // 신규
  description_ko?: string;   // 신규
}
```

### 3.2 `src/types/program.ts`

`ProgramExerciseRow.exercises` 인라인 타입에 동일 필드 추가:

```typescript
export interface ProgramExerciseRow {
  // ... 기존 필드
  exercises: {
    id: string;
    name_ko: string;
    name_en: string | null;
    category: string | null;
    default_rest_seconds: number;
    is_custom: boolean;
    visual_guide_url?: string;
    description_en?: string;   // 신규
    description_ko?: string;   // 신규
  } | null;
}
```

---

## 4. `ExerciseVisualGuide` 컴포넌트 설계

### 4.1 Props 인터페이스

```typescript
interface ExerciseVisualGuideProps {
  visualGuideUrl?: string;
  description?: string;       // description_ko ?? description_en (호출부에서 결정)
  exerciseName?: string;      // 모달 타이틀용
}
```

### 4.2 인라인 렌더링 (축소 뷰)

| URL 유형 | 인라인 크기 | 동작 |
|----------|------------|------|
| GIF | 80×80, borderRadius 8 | 탭 → 모달 |
| YouTube | 100×56 (16:9), borderRadius 8 | 탭 → 모달 |
| 없음 | null 반환 | — |

- `description`이 있으면 썸네일 오른쪽(또는 아래)에 2줄 이내 미리보기 텍스트 표시
- 인라인 썸네일에 반투명 재생 아이콘 오버레이 (GIF/YouTube 구분 없이 동일)

### 4.3 모달 레이아웃

```
┌─────────────────────────────────────┐
│  [운동 이름]              [×]        │  ← 헤더 (고정)
├─────────────────────────────────────┤
│                                     │
│   [GIF fullscreen]                  │  ← GIF: 전체 너비, 1:1 비율
│   또는                               │    YouTube: 16:9 썸네일 +
│   [YouTube 썸네일]                   │    하단 "YouTube에서 보기" 버튼
│   [YouTube에서 보기 →]              │
│                                     │
├─────────────────────────────────────┤
│  설명 텍스트 (ScrollView)            │  ← description 전체 표시
│  (없으면 이 섹션 숨김)               │    없으면 GIF가 더 크게 표시
└─────────────────────────────────────┘
```

- 모달 배경: `rgba(0,0,0,0.85)` (반투명)
- GIF 로딩 중: `ActivityIndicator` 표시
- `SafeAreaView` 적용 (iOS 노치/홈 버튼 대응)

### 4.4 핵심 상태

```typescript
const [modalVisible, setModalVisible] = useState(false);
const [gifLoading, setGifLoading] = useState(true);
```

---

## 5. `workout-store.ts` 쿼리 업데이트

### 5.1 `startFromProgram` 내 exercises 쿼리

현재 `program_exercises` 조회에서 `exercises` 조인 시 `visual_guide_url`만 포함.
→ `description_en`, `description_ko` 추가:

```typescript
// 현재 (line ~119)
visual_guide_url: pe.exercises.visual_guide_url,

// 변경 후
visual_guide_url: pe.exercises.visual_guide_url,
description_en: pe.exercises.description_en,
description_ko: pe.exercises.description_ko,
```

### 5.2 `exercise-search-screen` Supabase 쿼리

현재 `.select('*')` 사용 중이므로 별도 수정 불필요 — `*`가 신규 컬럼을 자동 포함.

---

## 6. 화면별 통합

### 6.1 `workout-session-screen.tsx`

현재 `ExerciseVisualGuide`에 `visualGuideUrl`만 전달.
→ `description`과 `exerciseName` prop 추가:

```tsx
<ExerciseVisualGuide
  visualGuideUrl={exercise.exercise.visual_guide_url}
  description={exercise.exercise.description_ko ?? exercise.exercise.description_en}
  exerciseName={exercise.exercise.name_ko}
/>
```

### 6.2 `program-detail-screen.tsx`

동일 패턴:

```tsx
<ExerciseVisualGuide
  visualGuideUrl={item.exercises?.visual_guide_url}
  description={item.exercises?.description_ko ?? item.exercises?.description_en}
  exerciseName={item.exercises?.name_ko}
/>
```

### 6.3 `exercise-search-screen.tsx` — 썸네일 미리보기

`renderItem` 내 현재 레이아웃:
```
[ 운동 이름 + 카테고리 ]   [ + 아이콘 ]
```

변경 후:
```
[ 운동 이름 + 카테고리 ]   [ 썸네일 40×40 ]   [ + 아이콘 ]
```

구현 방식:
- `visual_guide_url`이 있으면 40×40 `Image` 컴포넌트를 `+` 아이콘 왼쪽에 삽입
- YouTube URL → `getYoutubeThumbnail()` 헬퍼 재사용 (ExerciseVisualGuide에서 export)
- 썸네일 탭 시 별도 모달 없이 선택 동작 수행 (`handleSelect` 그대로)
- `visual_guide_url` 없으면 공간 없음 (zero-width)

```tsx
{item.visual_guide_url && (
  <Image
    source={{ uri: getThumbnailUri(item.visual_guide_url) }}
    style={styles.searchThumbnail}  // width: 40, height: 40, borderRadius: 6
  />
)}
```

> `getThumbnailUri`: GIF → 그대로, YouTube → `getYoutubeThumbnail()` 결과 반환하는 유틸 함수. `ExerciseVisualGuide.tsx`에서 named export로 추출.

---

## 7. 자동 수집 스크립트 설계

### 7.1 파일 경로

```
scripts/fetch-exercise-content.js
```

### 7.2 환경 변수 (`.env.scripts`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_API_KEY=
GIPHY_API_KEY=
```

> `.gitignore`에 `.env.scripts` 추가 필요 (기존 `.env` 패턴과 동일).

### 7.3 실행 흐름 (one-shot)

```
node scripts/fetch-exercise-content.js

1. Supabase에서 exercises 전체 로드
2. 각 종목 루프:
   a. description_en 없으면 → Wger API 검색
      - name_en 기준 → 없으면 name_ko 영어 변환 시도
      - 매핑 성공: description_en upsert
   b. visual_guide_url 없으면 → GIPHY API 검색
      - name_en 또는 name_ko 기준
      - 결과 있음: visual_guide_url upsert
      - 결과 없음: YouTube API 검색 → visual_guide_url upsert
3. Supabase batch upsert
   - 기존 값 있으면 건너뜀 (NULL인 필드만 업데이트)
4. 결과 요약 출력:
   - 처리: N개
   - description_en 업데이트: N개
   - visual_guide_url 업데이트 (GIF): N개
   - visual_guide_url 업데이트 (YouTube): N개
   - 건너뜀 (기존 데이터): N개
   - 실패: N개
```

### 7.4 Upsert 안전 패턴

```javascript
// NULL인 필드만 업데이트 — 수동 입력 데이터 보호
const updates = exercises
  .filter(e => !e.description_en || !e.visual_guide_url)
  .map(e => ({ id: e.id, ...fetchedData[e.id] }));

await supabase
  .from('exercises')
  .upsert(updates, { onConflict: 'id', ignoreDuplicates: false });
```

### 7.5 API 요청 제한

| API | 무료 제한 | 대응 |
|-----|----------|------|
| Wger REST | 무제한 (공개) | rate limit 없음, 병렬 가능 |
| GIPHY | 100 req/hr | 요청 간 36ms delay |
| YouTube Data v3 | 10,000 units/일 | 검색 1회 = 100 units → 최대 100개/일 |

> YouTube는 GIPHY 미매핑 종목에만 사용 → 실제 YouTube 요청 수를 최소화.

---

## 8. 컴포넌트 유틸 함수 Export

`ExerciseVisualGuide.tsx`에서 검색 화면 재사용을 위해 named export 추가:

```typescript
// 기존 내부 함수 → named export로 변경
export const isYoutubeUrl = (url: string): boolean => ...
export const getYoutubeThumbnail = (url: string): string => ...
export const getThumbnailUri = (url: string): string =>
  isYoutubeUrl(url) ? getYoutubeThumbnail(url) : url;
```

---

## 9. 비기능 요구사항

| 항목 | 설계 결정 |
|------|----------|
| 네이티브 앱 불변 | React Native `<Modal>` 사용 (Platform-agnostic). 웹에서도 동작. |
| 스크립트 번들 격리 | `scripts/` 폴더 — Expo 번들에 포함 안 됨 |
| API 키 보안 | `.env.scripts` 분리, `.gitignore` 적용, service role key 클라이언트 미포함 |
| GIF 성능 | 모달 열릴 때 `ActivityIndicator`. `react-native-fast-image` v1.1+ 검토 |
| 기존 데이터 보호 | upsert 시 NULL 필드만 업데이트 |
| 타입 안전 | `npx tsc --noEmit` 통과 필수 |

---

## 10. 오류 처리

| 시나리오 | 처리 방식 |
|----------|----------|
| `visual_guide_url` 없음 | `ExerciseVisualGuide` null 반환 (기존 동작 유지) |
| GIF 로딩 실패 | `onError` 콜백으로 `Image` 숨김, 모달은 description만 표시 |
| YouTube 썸네일 실패 | `onError`로 대체 아이콘 표시 |
| 스크립트 API 실패 | 해당 종목 건너뜀, 오류 로그 출력 후 계속 진행 |
| description 없음 | 모달에서 description 섹션 숨김 (GIF/YouTube만 표시) |

---

## 11. 구현 가이드

### 11.1 모듈 맵

| 모듈 | 파일 | 작업 유형 | 의존성 |
|------|------|----------|---------|
| **M1** | `supabase/migrations/20260401_add_description_to_exercises.sql` | 생성 | — |
| **M2** | `src/types/workout.ts` | 수정 | M1 |
| **M2** | `src/types/program.ts` | 수정 | M1 |
| **M3** | `src/stores/workout-store.ts` | 수정 | M2 |
| **M4** | `scripts/fetch-exercise-content.js` | 생성 | M1 |
| **M4** | `.env.scripts` (예시: `.env.scripts.example`) | 생성 | M4 |
| **M5** | `src/components/workout/ExerciseVisualGuide.tsx` | 수정 | M2 |
| **M6** | `src/screens/workout/workout-session-screen.tsx` | 수정 | M3, M5 |
| **M6** | `src/screens/workout/program-detail-screen.tsx` | 수정 | M3, M5 |
| **M7** | `src/screens/workout/exercise-search-screen.tsx` | 수정 | M5 |

### 11.2 변경 규모 추정

| 항목 | 수량 |
|------|------|
| 생성 파일 | 3개 (마이그레이션 SQL, 스크립트 JS, .env.scripts.example) |
| 수정 파일 | 6개 (타입 2, 스토어 1, 컴포넌트 1, 화면 2, 검색 1) |
| 예상 코드 변경량 | ~200줄 (ExerciseVisualGuide 모달 ~80줄, 스크립트 ~100줄, 나머지 ~20줄) |

### 11.3 Session Guide

**Session 1 — 기반 (M1~M3): ~30분**
- DB 마이그레이션 SQL 파일 생성 및 Supabase SQL Editor 실행
- `workout.ts`, `program.ts` 타입 업데이트
- `workout-store.ts` 쿼리에 `description_en`, `description_ko` 필드 추가
- `npx tsc --noEmit` 통과 확인

**Session 2 — 컴포넌트 + 화면 (M5~M7): ~60분**
- `ExerciseVisualGuide.tsx` 확장: props 추가 + Modal + description + 유틸 함수 export
- `workout-session-screen.tsx`, `program-detail-screen.tsx`에 description/exerciseName prop 전달
- `exercise-search-screen.tsx`에 오른쪽 썸네일 미리보기 추가
- `npx tsc --noEmit` 통과 확인

**Session 3 — 수집 스크립트 (M4): ~60분**
- `.env.scripts.example` 작성
- `scripts/fetch-exercise-content.js` 작성 (Wger + GIPHY + YouTube)
- `.gitignore`에 `.env.scripts` 추가
- 로컬 테스트 실행 (5개 종목으로 dry-run 확인)

---

## 12. 다음 단계

설계 완료 → `/pdca do exercise-description-service`

구현 시작 권장 순서: Session 1 → Session 2 → Session 3
