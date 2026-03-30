# PDCA Usage

## Why `/pdca` Still Expands Sometimes

- `/pdca`는 네이티브 Codex 명령이 아니라 대화 관례다.
- 그래서 모델이 문맥상 도움이 된다고 판단하면 한 phase만 요청해도 전체 PDCA를 확장할 수 있다.

## More Reliable Usage

가장 간단한 방식:

- `/pdca plan "페르소나 생성" strict. Plan만 작성해.`
- `/pdca design "페르소나 생성" strict. Design만 작성해.`
- `/pdca analyze "페르소나 생성" strict. Analyze만 작성해.`

더 안정적인 방식:

- `npm run pdca -- plan "페르소나 생성"`
- `npm run pdca -- design "persona-engine 구조"`
- `npm run pdca -- do "persona-engine.ts 구현"`
- `npm run pdca -- analyze "페르소나 시스템 초안"`

이 명령은 Codex에 넣을 강한 phase 프롬프트를 출력한다.

## Recommended Flow

1. `npm run pdca -- plan "<task>"`
2. 출력된 문장을 Codex에 붙여넣기
3. `design`, `do`, `analyze` 순서로 반복
