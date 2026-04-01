export interface ExerciseAlternatives {
  similar: string[];      // 동일 패턴 대체 (1~3개)
  alternatives: string[]; // 다른 선택지 (2~4개)
}

// 키: 정규화된 종목명 (공백 포함 허용)
export const EXERCISE_ALTERNATIVES: Record<string, ExerciseAlternatives> = {
  '벤치프레스': {
    similar: ['덤벨 벤치프레스', '푸쉬업'],
    alternatives: ['인클라인 덤벨 프레스', '체스트 플라이', '딥스'],
  },
  '스쿼트': {
    similar: ['고블릿 스쿼트', '박스 스쿼트'],
    alternatives: ['렉프레스', '불가리안 스플릿 스쿼트', '런지'],
  },
  '데드리프트': {
    similar: ['루마니안 데드리프트', '스티프레그 데드리프트'],
    alternatives: ['힙힌지 머신', '케이블 풀스루', '굿모닝'],
  },
  '오버헤드프레스': {
    similar: ['덤벨 숄더프레스', '아놀드프레스'],
    alternatives: ['랫풀다운', '사이드 레터럴 레이즈', '페이스풀'],
  },
  '바벨로우': {
    similar: ['덤벨 로우', '시티드 케이블 로우'],
    alternatives: ['랫풀다운', '풀업', 'TRX 로우'],
  },
  '풀업': {
    similar: ['친업', '어시스티드 풀업'],
    alternatives: ['랫풀다운', '시티드 케이블 로우', '덤벨 로우'],
  },
  '랫풀다운': {
    similar: ['케이블 로우', '시티드 케이블 로우'],
    alternatives: ['덤벨 로우', '풀업', 'TRX 로우'],
  },
  '딥스': {
    similar: ['벤치 딥스', '머신 딥스'],
    alternatives: ['클로즈그립 벤치프레스', '라잉 트라이셉스 익스텐션', '케이블 푸쉬다운'],
  },
  '바벨 컬': {
    similar: ['덤벨 컬', 'EZ바 컬'],
    alternatives: ['해머 컬', '케이블 컬', '인클라인 덤벨 컬'],
  },
  '레그프레스': {
    similar: ['해크 스쿼트', '불가리안 스플릿 스쿼트'],
    alternatives: ['스쿼트', '런지', '레그 익스텐션'],
  },
  '레그 익스텐션': {
    similar: ['머신 레그 익스텐션'],
    alternatives: ['스쿼트', '런지', '불가리안 스플릿 스쿼트'],
  },
  '레그 컬': {
    similar: ['라잉 레그컬', '시티드 레그컬'],
    alternatives: ['루마니안 데드리프트', '굿모닝', '케이블 킥백'],
  },
  '힙 쓰러스트': {
    similar: ['바벨 힙 쓰러스트', '글루트 브릿지'],
    alternatives: ['케이블 킥백', '도네키 킥', '루마니안 데드리프트'],
  },
  '케이블 크로스오버': {
    similar: ['펙덱 플라이', '덤벨 플라이'],
    alternatives: ['벤치프레스', '인클라인 덤벨 프레스', '딥스'],
  },
  '인클라인 벤치프레스': {
    similar: ['인클라인 덤벨프레스', '인클라인 푸쉬업'],
    alternatives: ['벤치프레스', '딥스', '케이블 플라이'],
  },
  '플랭크': {
    similar: ['사이드 플랭크', 'RKC 플랭크'],
    alternatives: ['데드버그', '할로우 바디', '팔라오프'],
  },
  '크런치': {
    similar: ['리버스 크런치', '케이블 크런치'],
    alternatives: ['레그레이즈', '데드버그', 'V업'],
  },
  '런지': {
    similar: ['워킹 런지', '리버스 런지'],
    alternatives: ['불가리안 스플릿 스쿼트', '스텝업', '레그프레스'],
  },
  '사이드 레터럴 레이즈': {
    similar: ['케이블 레터럴 레이즈'],
    alternatives: ['오버헤드프레스', '페이스풀', '밴드 레터럴 레이즈'],
  },
  '페이스풀': {
    similar: ['밴드 페이스풀', '케이블 페이스풀'],
    alternatives: ['리어 델트 플라이', '사이드 레터럴 레이즈', '바벨로우'],
  },
  '라잉 트라이셉스 익스텐션': {
    similar: ['덤벨 스컬크러셔', 'EZ바 스컬크러셔'],
    alternatives: ['케이블 푸쉬다운', '딥스', '클로즈그립 벤치프레스'],
  },
  '케이블 푸쉬다운': {
    similar: ['로프 트라이셉스 푸쉬다운'],
    alternatives: ['딥스', '오버헤드 트라이셉스 익스텐션', '클로즈그립 벤치프레스'],
  },
  '해머 컬': {
    similar: ['케이블 해머 컬'],
    alternatives: ['바벨 컬', '덤벨 컬', '인클라인 컬'],
  },
  '힙힌지': {
    similar: ['케이블 풀스루', '굿모닝'],
    alternatives: ['루마니안 데드리프트', '힙 쓰러스트', '데드리프트'],
  },
  '불가리안 스플릿 스쿼트': {
    similar: ['덤벨 스플릿 스쿼트'],
    alternatives: ['런지', '레그프레스', '스쿼트'],
  },
  '체스트 플라이': {
    similar: ['덤벨 플라이', '인클라인 플라이'],
    alternatives: ['케이블 크로스오버', '벤치프레스', '펙덱 플라이'],
  },
  '바벨 힙 쓰러스트': {
    similar: ['힙 쓰러스트', '글루트 브릿지'],
    alternatives: ['데드리프트', '루마니안 데드리프트', '케이블 킥백'],
  },
};

// ─── 종목명 정규화 + lookup ────────────────────────────────────────────────────

/**
 * Gemini 출력 종목명(예: "바벨 벤치프레스")을 테이블 키와 매칭
 * 1. 정확 매칭 (full key match)
 * 2. 키가 입력에 포함되는지 (partial: 'bench' contains '벤치프레스')
 * 3. 입력이 키에 포함되는지
 */
export function findAlternatives(exerciseName: string): ExerciseAlternatives {
  // 1. 정확 매칭
  if (EXERCISE_ALTERNATIVES[exerciseName]) {
    return EXERCISE_ALTERNATIVES[exerciseName];
  }

  // 2. 부분 매칭
  const keys = Object.keys(EXERCISE_ALTERNATIVES);
  for (const key of keys) {
    if (exerciseName.includes(key) || key.includes(exerciseName)) {
      return EXERCISE_ALTERNATIVES[key];
    }
  }

  // 3. fallback
  return { similar: [], alternatives: [] };
}
