## Orchestration Rules

- 사용자가 `pdca`, `plan/design/do/analyze`, `설계 먼저`, `단계적으로`, `오케스트레이션` 성격으로 요청하면 PDCA 모드로 해석한다.
- 사용자가 `/pdca` 문법을 쓰면 이를 PDCA 활성화 요청으로 해석한다. 이 문법은 네이티브 시스템 명령이 아니라 프로젝트 관례다.
- 작은 작업도 내부적으로는 짧은 Plan을 먼저 수행한다.
- 여러 파일, 구조 변경, 테스트 리스크, 플랫폼 리스크가 있으면 Design을 생략하지 않는다.
- Do 단계에서는 설계에서 정한 범위를 벗어나지 않는다. 범위가 바뀌면 다시 Plan 또는 Design으로 돌아간다.
- 의미 있는 수정 뒤에는 Analyze를 생략하지 않는다.
- 사용자 업데이트는 길게 설명하기보다 현재 phase, 배운 점, 다음 행동을 짧게 전달한다.
- 서브에이전트는 병렬 이득이 분명하고 write scope가 분리될 때만 사용한다.
- 메인 에이전트는 항상 크리티컬 패스와 최종 통합 책임을 가진다.
- `/pdca <phase> ...`가 들어오면 우선 그 phase의 산출물만 내놓는다. 한 번의 응답에서 전체 PDCA를 자동 전개하지 않는다.
- `/pdca plan ...`은 계획까지만, `/pdca design ...`은 설계까지만, `/pdca analyze ...`는 분석까지만 수행한다.
- `/pdca do ...`만 구현을 허용한다. 다만 위험이 크면 최소한의 Plan/Design 문맥을 짧게 보강한 뒤 구현한다.
- phase 강제 요청에서는 메인 본문과 다음 권장 단계(`Next phase`)를 분리한다. 다음 단계 제안은 짧게만 덧붙인다.
- 서브에이전트는 task-scoped worker다. 세션에 상주하는 고정 인력이 아니다.
- 서브에이전트를 실제로 생성하지 않았다면 생성한 것처럼 말하지 않는다.
- 익숙하지 않은 영역의 `plan`에서는 `context-reader` 사용을 우선 검토한다.
- 복수 구조안이 있는 `design`에서는 `designer` 사용을 우선 검토한다.
- 분리 가능한 구현 범위가 있는 `do`에서는 `implementer`를 역할별로 나눠 사용한다.
- 검증 가치가 큰 `analyze`에서는 `validator`를 사용해 독립 검토를 받는다.

## Quick Start Phrases

사용자는 아래처럼 말하면 된다.

- `/pdca`
- `/pdca plan "계획"`
- `/pdca design "설계"`
- `/pdca do "구현"`
- `/pdca analyze "분석"`
- `pdca로 진행해줘`
- `이번 작업은 설계 먼저 하고 구현해줘`
- `plan -> design -> do -> analyze 흐름으로 처리해줘`
- `서브에이전트도 써서 단계적으로 진행해줘`
- `이 작업 pdca 시작`

## Slash Syntax Semantics

- `/pdca`는 기본적으로 `Plan`부터 시작한다.
- `/pdca <phase> "<payload>"` 형태에서 `<phase>`는 `plan`, `design`, `do`, `analyze` 중 하나다.
- 따옴표 안의 내용은 해당 phase에서 바로 처리할 핵심 요청으로 본다.
- 따옴표가 없으면 나머지 문장을 payload로 해석한다.
- 사용자가 `do`만 요청해도 리스크가 크면 짧게 Plan/Design을 보완한 뒤 진행한다.
- `plan`, `design`, `analyze` 요청은 기본적으로 strict mode로 취급한다.
- strict mode에서는 요청한 phase 밖의 본문 섹션을 만들지 않는다.
- 예를 들어 `/pdca plan 페르소나 생성`이면 `Plan`만 작성하고, `Next phase: Design` 정도만 짧게 덧붙인다.

## Required Subagent Disclosure

- 응답에는 필요 시 현재 task에서 어떤 서브에이전트를 실제로 생성했는지 짧게 밝힌다.
- 예:
  - `Subagents used: none`
  - `Subagents used: context-reader (docs scan), validator (regression review)`

## Default Response Shape

PDCA 요청을 받으면 기본적으로 아래 순서로 반응한다.

1. 현재 요청을 문제/목표로 짧게 재정의한다.
2. 지금 필요한 컨텍스트와 규칙을 확인한다.
3. 현재 phase와 다음 action을 선언한다.
4. 필요하면 Design을 거쳐 Do로 이동한다.
5. 작업 후 Analyze로 검증 결과와 남은 리스크를 정리한다.
