# Design: p2-stabilization

> Feature: P2 안정화 — 테이블 통일 + Supabase Edge Function 보안
> Created: 2026-03-26
> Architecture: Option C — Pragmatic Balance
> Status: Design

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 프로덕션 전 필수: 테이블 불일치 버그 + 클라이언트 API 키 노출 보안 이슈 해결 |
| **WHO** | 개발자 (버그 수정 + 보안 강화) |
| **RISK** | Edge Function 배포 실패 시 AI 플랜 기능 동작 불가 |
| **SUCCESS** | `profiles` 참조 0개, `EXPO_PUBLIC_GEMINI_API_KEY` 참조 0개, AI 플랜 정상 생성 |
| **SCOPE** | program-review-screen.tsx + ai-planner.ts + Edge Function 신규 파일 |

---

## 1. 개요

### 선택된 아키텍처: Option C — Pragmatic Balance

**Task A**: `age` 입력 UI로 교체 — birthYear→age 변환 로직 제거, `user_profiles` 스키마와 완전 일치
**Task B**: 얇은 프록시 Edge Function — `prompt` 문자열 수신 → Gemini 호출 → 텍스트 반환. 기존 `buildPrompt()` 로직은 클라이언트에 유지.

---

## 2. 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|---------|------|
| `src/screens/workout/program-review-screen.tsx` | 수정 | profiles → user_profiles, birthYear → age |
| `src/lib/ai-planner.ts` | 수정 | 직접 fetch → supabase.functions.invoke() |
| `supabase/functions/generate-ai-plan/index.ts` | 신규 생성 | Gemini 프록시 Edge Function |

---

## 3. Module 1 — Task A: program-review-screen.tsx

### 3.1 현재 상태 (변경 전)

```typescript
// state
const [birthYear, setBirthYear] = useState('');

// 로드: profiles 테이블
supabase.from('profiles').select('*').eq('id', user.id)
  .then(({ data }) => {
    if (data) {
      setGender(data.gender ?? null);
      setBirthYear(data.birth_year ? data.birth_year.toString() : '');
    }
  });

// 저장: profiles 테이블
await supabase.from('profiles').upsert(
  { id: user.id, gender, birth_year: parseInt(birthYear) },
  { onConflict: 'id' }
);
```

### 3.2 변경 후

```typescript
// state: birthYear → age
const [age, setAge] = useState('');

// 로드: user_profiles 테이블
supabase.from('user_profiles').select('gender, age').eq('id', user.id)
  .maybeSingle()
  .then(({ data }) => {
    if (data) {
      setGender(data.gender ?? null);
      setAge(data.age ? data.age.toString() : '');
    }
    setProfileLoaded(true);
  });

// 저장: user_profiles 테이블
const ageNum = parseInt(age, 10) || null;
if (gender || ageNum) {
  await supabase.from('user_profiles').upsert(
    { id: user.id, gender: gender ?? null, age: ageNum },
    { onConflict: 'id' }
  );
}
```

### 3.3 UI 변경

- `birthYear` state → `age` state
- `setBirthYear` → `setAge`
- 라벨 "출생연도" → "나이"
- placeholder "1990" → "25"
- `calcAge()` 함수 제거 (더 이상 불필요)
- `birthYearNum` 변수 제거
- 유효성 검사: `age >= 10 && age <= 100`

### 3.4 제거 항목

```typescript
// 제거
const [birthYear, setBirthYear] = useState('');
const calcAge = (): number | null => { ... };  // 제거
const birthYearNum = parseInt(birthYear, 10) || null;  // 제거
```

---

## 4. Module 2 — Task B: Edge Function 생성

### 4.1 파일 경로

```
supabase/
  functions/
    generate-ai-plan/
      index.ts
```

### 4.2 Edge Function 코드

```typescript
// supabase/functions/generate-ai-plan/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API 오류 (${response.status}): ${err}`);
    }

    const json = await response.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 5. Module 3 — Task B: ai-planner.ts 수정

### 5.1 현재 상태 (변경 전)

```typescript
export async function generateAIPlan(...): Promise<AIPlan> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  const prompt = buildPrompt(data, history, workoutHistorySection);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!response.ok) { ... }
  const json = await response.json();
  const responseText: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  // ...
}
```

### 5.2 변경 후

```typescript
import { supabase } from './supabase';  // 상단에 추가 (이미 있으면 유지)

export async function generateAIPlan(...): Promise<AIPlan> {
  const prompt = buildPrompt(data, history, workoutHistorySection);

  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    'generate-ai-plan',
    { body: { prompt } }
  );

  if (fnError) {
    throw new Error(`AI 플랜 생성 오류: ${fnError.message}`);
  }

  const responseText: string = fnData?.text ?? '';
  // 이하 JSON 파싱, 안전 가드레일 로직 동일
  // ...
}
```

### 5.3 제거 항목

```typescript
// 제거
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const response = await fetch(`https://generativelanguage...`, { ... });
if (!response.ok) { ... }
const json = await response.json();
const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
```

---

## 6. 환경 변수 변경

### 제거 (클라이언트)
```
EXPO_PUBLIC_GEMINI_API_KEY=...  ← .env에서 제거 또는 주석처리
```

### 추가 (Supabase Secret — CLI로 설정)
```bash
supabase secrets set GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

> `.env.example`에서도 `EXPO_PUBLIC_GEMINI_API_KEY` 제거하고 주석 추가:
> `# GEMINI_API_KEY: Supabase Secret으로 관리 (supabase secrets set GEMINI_API_KEY=...)`

---

## 7. Supabase CLI 설치 및 배포 가이드

### Step 1: CLI 설치 확인
```bash
supabase --version
```

### Step 2: 미설치 시 설치 (macOS)
```bash
brew install supabase/tap/supabase
```

### Step 3: 프로젝트 연결
```bash
cd /Users/donghyunan/Desktop/동현/coding\ project/fit
supabase link --project-ref <YOUR_PROJECT_REF>
# Project Ref: Supabase 대시보드 → Settings → General → Reference ID
```

### Step 4: Gemini API Secret 설정
```bash
supabase secrets set GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

### Step 5: Edge Function 배포
```bash
supabase functions deploy generate-ai-plan
```

### Step 6: 배포 확인
```bash
supabase functions list
```

---

## 8. 성공 기준 검증

| SC | 검증 명령 | 기대 결과 |
|----|---------|---------|
| SC-1 | `grep -r "from('profiles')" src/` | 결과 없음 |
| SC-2 | `grep -r "EXPO_PUBLIC_GEMINI" src/` | 결과 없음 |
| SC-3 | Expo Go → 프로그램 리뷰 → 성별/나이 저장 | user_profiles에 반영됨 |
| SC-4 | Expo Go → AI 플랜 생성 | 정상 생성됨 |
| SC-5 | `supabase functions list` | generate-ai-plan 표시됨 |

---

## 9. 위험 대응

| 위험 | 대응 |
|------|------|
| user_profiles.age가 이미 설정된 경우 덮어쓰기 | upsert는 입력값이 있을 때만 실행 (`if (gender \|\| ageNum)`) |
| Edge Function 콜드 스타트 지연 | 기존 로딩 UI(AILoadingScreen) 유지, 타임아웃 에러는 사용자에게 "다시 시도" 안내 |
| Supabase CLI 로그인 필요 | `supabase login` 선행 후 `supabase link` |

---

## 10. 구현 순서 (Session Guide)

### Module Map

| 모듈 | 파일 | 예상 변경량 |
|------|------|-----------|
| module-1 | program-review-screen.tsx | ~30줄 수정 |
| module-2 | supabase/functions/generate-ai-plan/index.ts | ~50줄 신규 |
| module-3 | src/lib/ai-planner.ts | ~15줄 수정 |

### 11.3 Session Guide

**권장 세션 분할:**

```
Session 1: module-1
  → program-review-screen.tsx 수정
  → SC-1 검증 (grep)
  → Expo Go 테스트 (SC-3)

Session 2: module-2 + module-3
  → Edge Function 파일 생성
  → ai-planner.ts 수정
  → Supabase CLI 설치/배포
  → SC-2, SC-4, SC-5 검증
```

**스코프 지정:**
```bash
/pdca do p2-stabilization --scope module-1
/pdca do p2-stabilization --scope module-2,module-3
```
