# 기능 계획: 운동 시각 자료 안내

**기능명:** `exercise-visual-guide`
**버전:** 1.1.0 (보완판)
**날짜:** 2026-04-01

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 사용자가 낯선 운동 종목을 접했을 때 올바른 자세를 확인할 방법이 없어 부상 위험과 앱 이탈이 발생한다. |
| **해결책** | `exercises` 테이블에 `visual_guide_url` 컬럼을 추가하고, GIF/유튜브 썸네일을 인라인으로 표시하는 `ExerciseVisualGuide` 컴포넌트를 세션·프로그램 상세 화면에 통합한다. |
| **기능 UX 효과** | 운동 중 바로 자세 확인이 가능해지며, 별도 앱 전환 없이 유튜브로 이동할 수 있다. |
| **핵심 가치** | 운동 정확도와 안전성을 높이면서 앱 체류 시간을 늘리는 피트니스 교육 레이어 확보. |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 운동 자세 가이드 부재로 인한 부상 리스크 및 사용자 이탈을 줄이기 위함 |
| **WHO** | 운동 초보자 및 새 종목을 시작하는 중급 사용자 |
| **RISK** | GIF 로딩 성능 저하, 유튜브 URL 깨짐, 데이터 없는 종목에서의 빈 화면 처리 |
| **SUCCESS** | 시각 자료 탭/조회율 > 15%, 운동 세션 이탈율 감소 |
| **SCOPE** | 운동 세션 화면 + 프로그램 상세 화면 (v1.0). 검색 화면 + 관리 인터페이스는 v1.1+ |

---

## 1. 문제 정의

사용자들이 익숙하지 않은 운동을 접했을 때, 정확한 자세로 수행하는 방법에 대한 지식과 자신감이 부족합니다. 이는 비효율적인 운동, 부상 위험 증가, 그리고 답답한 사용자 경험으로 이어질 수 있습니다. 현재 앱은 운동 이름만 제공하고 있어, 새로운 운동을 배우거나 정확한 자세를 확인하고 싶은 사용자에게는 정보가 불충분합니다.

---

## 2. 제안 해결책

운동에 대한 시각 자료 안내를 제공하는 기능을 구현합니다. 사용자가 특정 운동을 조회할 때 GIF 또는 유튜브 영상 썸네일을 화면에서 바로 볼 수 있도록 합니다.

### 주요 기능 (v1.0 — 구현 완료)
- `exercises` 테이블에 `visual_guide_url TEXT` 컬럼 추가
- `ExerciseVisualGuide` 재사용 가능 컴포넌트 (GIF 인라인 / 유튜브 썸네일 + 탭 시 외부 이동)
- `workout-session-screen.tsx` 통합: 운동 이름 아래 시각 자료 표시
- `program-detail-screen.tsx` 통합: 일일 운동 목록의 운동 이름 옆 시각 자료 표시
- `workout-store.ts` / 타입 업데이트: `visual_guide_url` 필드 전파

### 주요 기능 (v1.1 — 다음 단계)
- GIF 전체 화면 모달 (탭 시 확대 보기)
- 운동 검색 화면(`exercise-search-screen.tsx`)에 시각 자료 통합
- Supabase 관리 스크립트 또는 관리자 인터페이스로 URL 일괄 관리

---

## 3. 목표

- 운동에 대한 사용자의 이해도와 자신감 향상
- 정확한 운동 자세를 장려하여 부상 위험 감소
- 앱 사용자의 참여도 및 만족도 증대
- 피트니스 앱으로서의 전반적인 가치 제고

---

## 4. 비-목표 (이번 버전에서는 포함하지 않음)

- 자체 운동 영상 제작 (기존 고품질 콘텐츠 활용)
- 다양한 카메라 각도 / 슬로우 모션 재생 등 고급 재생 기능
- 자체 영상 호스팅 / 스트리밍 인프라 구축
- 인앱 유튜브 플레이어 (`react-native-webview` — v1.1+ 검토)
- `react-native-fast-image` GIF 성능 최적화 (v1.1+ 검토)

---

## 5. 기술 구현 계획

### 5.1 DB 변경

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/20260401_add_visual_guide_to_exercises.sql` | `exercises` 테이블에 `visual_guide_url TEXT` 컬럼 추가 |

> **적용 방법:** Supabase SQL Editor에서 수동 실행. 중복 실행 안전 (ADD COLUMN IF NOT EXISTS 고려).

### 5.2 타입 업데이트

| 파일 | 변경 내용 |
|------|----------|
| `src/types/workout.ts` | `Exercise` 타입에 `visual_guide_url?: string` 추가 |
| `src/types/program.ts` | `ProgramExerciseRow` 타입에 `visual_guide_url?: string` 추가 |

### 5.3 상태 관리

| 파일 | 변경 내용 |
|------|----------|
| `src/stores/workout-store.ts` | 프로그램 세션 생성 시 `visual_guide_url` 필드 전파, 검색 쿼리에 컬럼 포함 |

### 5.4 컴포넌트

| 파일 | 내용 |
|------|------|
| `src/components/workout/ExerciseVisualGuide.tsx` | 신규. `visualGuideUrl` prop 수신. YouTube URL → 썸네일 + `Linking.openURL`. GIF URL → `<Image>` 인라인 표시. URL 없으면 `null` 반환. |

**YouTube 썸네일 추출 로직:**
```
videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()
thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`
```

### 5.5 화면 통합

| 파일 | 변경 내용 |
|------|----------|
| `src/screens/workout/workout-session-screen.tsx` | 운동 카드 내 운동 이름 아래 `<ExerciseVisualGuide>` 추가 |
| `src/screens/workout/program-detail-screen.tsx` | 일일 운동 목록 아이템 내 운동 이름 옆 `<ExerciseVisualGuide>` 추가 |

---

## 6. 구현 모듈 순서

| 모듈 | 작업 | 상태 |
|------|------|------|
| M1 | DB 마이그레이션 + 타입 업데이트 | ✅ 완료 |
| M2 | `ExerciseVisualGuide` 컴포넌트 구현 | ✅ 완료 |
| M3 | `workout-store` 쿼리 업데이트 | ✅ 완료 |
| M4 | `workout-session-screen` 통합 | ✅ 완료 |
| M5 | `program-detail-screen` 통합 | ✅ 완료 |
| M6 (v1.1) | GIF 전체 화면 모달 | ⏳ 미구현 |
| M7 (v1.1) | `exercise-search-screen` 통합 | ⏳ 미구현 |
| M8 (v1.1+) | 관리자 URL 입력 인터페이스 또는 스크립트 | ⏳ 미구현 |

---

## 7. 개략적인 계획 (단계별)

| 단계 | 설명 |
|------|------|
| **1단계: 스키마 + 타입 (M1)** | DB 마이그레이션 실행, 타입 파일 업데이트 |
| **2단계: 컴포넌트 (M2)** | `ExerciseVisualGuide` 구현 및 단독 렌더링 확인 |
| **3단계: 데이터 흐름 (M3)** | `workout-store` 쿼리에 `visual_guide_url` 포함 |
| **4단계: 화면 통합 (M4~M5)** | 세션 화면, 프로그램 상세 화면에 컴포넌트 삽입 |
| **5단계: 콘텐츠 채우기** | Supabase에 주요 종목(스쿼트, 데드리프트 등 30개+) URL 수동 입력 |
| **6단계: 검증** | 실기기에서 GIF 로딩, 유튜브 탭 이동, URL 없는 종목 null 렌더링 확인 |

---

## 8. 리스크 및 제약

| 리스크 | 영향 | 대응 |
|--------|------|------|
| GIF URL 깨짐/느린 로딩 | 빈 이미지 노출, 세션 UX 저하 | URL 없으면 null 반환으로 안전 처리. v1.1에서 `react-native-fast-image` 캐싱 도입 검토. |
| YouTube 썸네일 API 의존성 | 특정 videoId에서 썸네일 미제공 | 로딩 실패 시 fallback 처리 (v1.1에서 `onError` 대응) |
| 데이터 없는 종목 | 대부분 URL 없는 상태로 시작 | URL 없으면 UI에서 자연스럽게 숨김 처리 (이미 구현됨) |
| 외부 URL 저작권 | GIF 출처 권한 문제 | 공개 라이선스 또는 공식 피트니스 콘텐츠만 사용 |

---

## 9. 성공 지표

| 지표 | 목표 |
|------|------|
| **시각 자료 조회율** | 운동 세션 내 시각 자료 표시 종목 비율 > 30% (데이터 채우기 기준) |
| **사용자 탭 참여율** | 유튜브 썸네일 탭 전환율 > 15% |
| **정성적 피드백** | 앱 스토어 리뷰 / 인터뷰에서 긍정적 언급 |
| **사용자 유지율** | 기능 출시 전후 7일 리텐션 비교 |
| **기능 채택률** | 첫 달 MAU 중 시각 자료 1회 이상 조회한 비율 |

---

## 10. 향후 개선 (v1.1+)

리포트에서 식별된 다음 개선 사항은 v1.1 계획에서 상세 설계 예정:

1. **GIF 전체 화면 모달**: 탭 시 `<Modal>` 또는 bottom sheet로 확대 표시 (설계 문서 3.1에 명시됨, 미구현)
2. **관리자 인터페이스**: DB 직접 접근 없이 URL 추가/업데이트 가능한 내부 도구
3. **인앱 YouTube 플레이어**: `react-native-webview` 기반 인앱 재생 (앱 전환 없이)
4. **GIF 성능 최적화**: `react-native-fast-image` 도입으로 로딩/캐싱 개선
5. **콘텐츠 수집 자동화**: 운동 종목 DB 기반 자동 URL 매핑 스크립트
6. **`exercise-search-screen` 통합**: 검색 결과에서도 시각 자료 미리보기

---

## 11. 데이터 채우기 가이드

v1.0 구현 후 즉시 수행해야 할 콘텐츠 작업:

```sql
-- 예시: 주요 종목 visual_guide_url 업데이트
UPDATE exercises SET visual_guide_url = 'https://...' WHERE name = '스쿼트';
UPDATE exercises SET visual_guide_url = 'https://www.youtube.com/watch?v=...' WHERE name = '데드리프트';
```

- GIF 출처: GIPHY, Gfycat (피트니스 카테고리), ExRx.net
- YouTube 출처: 공식 피트니스 채널 (Alan Thrall, Athlean-X 등 공개 라이선스)
- 우선순위: 현재 DB의 상위 사용 빈도 종목 30개부터 채우기
