# FitLog — Plan Specification v1.0
*2026년 3월 작성*

## 1. 프로젝트 개요
기존 버전에서 SNS 기능까지 추가하려다 버그가 제어 불가능한 수준으로 누적되어 전면 재개발 결정.

| 항목 | 내용 |
|------|------|
| 앱 이름 | FitLog |
| 핵심 컨셉 | 운동 기록 (Boostcamp 참고) + 식단 기록 (FatSecret 참고) 통합 |
| 플랫폼 | React Native (iOS / Android) |
| 개발 방식 | Vibe Coding (Claude Code 주도), 솔로 개발 |
| 인프라 | Git / Cloudflare / Supabase |
| 개발 철학 | 천천히라도 완성도 높게 |

## 2. 레퍼런스 앱
- **운동**: Boostcamp — 세트 기록 UI, 휴식 타이머, 볼륨/PR 히스토리, 루틴 템플릿
- **식단**: FatSecret — 음식 검색, 영양소 자동완성, 식사 시간대 구분, 일별 요약

⚠️ SNS / 소셜 공유 기능은 이번 버전 완전 제외.

## 3. 기능 우선순위

| 순위 | 기능 | 단계 |
|------|------|------|
| 1 | 휴식 타이머 + 세트 기록 | Phase 1 MVP |
| 2 | 음식 검색 + 영양소 자동 입력 | Phase 1 MVP |
| 3 | 홈 대시보드 요약 | Phase 1 MVP |
| 4 | AI 분석 / 인사이트 | Phase 2 |
| 5 | 사진 / 영상 첨부 | Phase 2 |

## 4. 기술 스택
- **프레임워크**: React Native (Expo)
- **상태관리**: Zustand
- **UI**: React Native Paper
- **차트**: Victory Native
- **인증/DB**: Supabase (Auth + PostgreSQL + Realtime)
- **배포**: EAS Build + Cloudflare
- **식품 API**: OpenFoodFacts + 식품의약품안전처

## 5. DB 스키마

### users
id, email, created_at, name, profile_image_url, birth_date, gender,
goal_type(cut/bulk/maintain/strength), goal_calories, goal_protein, goal_carbs, goal_fat

### body_logs
id, user_id, logged_at, weight_kg, body_fat_pct, muscle_mass_kg

### workout_sessions
id, user_id, started_at, ended_at, total_volume_kg, notes

### workout_sets
id, session_id, exercise_id, set_number, reps, weight_kg, rest_seconds, completed_at, is_pr

### exercises
id, name_ko, name_en, category, default_rest_seconds, is_custom

### meal_logs
id, user_id, meal_type(아침/점심/저녁/간식), logged_at, photo_url

### meal_items
id, meal_log_id, food_id, amount_g, serving_count,
calories, protein_g, carbs_g, fat_g, sodium_mg, sugar_g

### foods
id, name_ko, name_en, source(openfoodfacts/mfds/user),
calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sodium_per_100g, sugar_per_100g

## 6. 화면 구성
**하단 탭**: 홈 / 운동 / 식단 / 분석(Phase 2) / 프로필

**운동**: 루틴 목록 → 세션 화면(세트+타이머) → 종목 검색 → 히스토리/PR

**식단**: 오늘 식단(시간대별) → 음식 검색 → 상세/양 조절 → 히스토리 달력

## 7. 개발 로드맵

### Phase 1 MVP
- [ ] 프로젝트 초기 설정 (Expo + Supabase 연결)
- [ ] 인증 화면
- [ ] DB 스키마 마이그레이션
- [ ] 운동 세션 화면 (세트 기록 + 휴식 타이머)
- [ ] 식단 기록 화면 (음식 검색 + 영양소)
- [ ] 홈 대시보드
- [ ] 프로필 / 목표 설정

### Phase 2
- [ ] AI 분석 / 인사이트 (Claude API)
- [ ] 식사 사진 → AI 음식 인식
- [ ] 운동 볼륨 vs 피로도 그래프
- [ ] 식사사진 / 운동영상 첨부

## 8. 리스크 관리
- **백그라운드 타이머**: expo-task-manager 또는 react-native-background-timer 검토
- **한국 식품 DB 부실**: 사용자 직접 추가 기능으로 보완
- **Scope Creep**: Phase 시작 전 이 문서 재확인, Phase 2 코드 손대지 않기
- **버그 누적**: 기능 단위 완성 → 테스트 → 커밋

## 9. v1 교훈
- SNS 기능은 트래커 앱의 본질이 아니다
- Spec 문서가 없으면 방향을 잃는다
- vibe coding은 빠르지만 구조 없이 달리면 처음부터 돌아온다
