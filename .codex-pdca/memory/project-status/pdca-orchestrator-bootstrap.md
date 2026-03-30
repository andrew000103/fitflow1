# PDCA Orchestrator Bootstrap

## Status

- Feature: `pdca-orchestrator-bootstrap`
- Phase: `design`
- Goal: Codex에서 재사용 가능한 PDCA orchestration skill과 프로젝트 상태 레이어 초기 구축

## Decisions

- 스킬은 `.codex/skills/pdca-orchestrator/`에 둔다.
- 프로젝트별 상태와 규칙은 `.codex-pdca/`에 둔다.
- 작업 흐름은 `Plan -> Design -> Do -> Analyze`로 고정한다.
- `Analyze`는 의미 있는 작업 뒤에는 생략하지 않는다.
- 사용자는 `/pdca` 같은 네이티브 명령 대신 자연어 시작 문구로 PDCA 흐름을 활성화한다.
- 빠른 사용성을 위해 시작 문구와 운영 규칙은 스킬 본문과 `.codex-pdca/rules/orchestration.md`에 함께 둔다.
- `/pdca plan "..."` 같은 slash-style 문법도 프로젝트 관례로 지원한다.
- slash-style 문법은 strict phase mode로 운용한다. `plan/design/analyze`는 해당 phase만 출력하고, `do`만 구현을 허용한다.
- 서브에이전트는 phase별 조건을 만족할 때만 실제로 생성하며, 생성 여부와 역할을 항상 명시한다.

## Next Actions

- 필요 시 이 스킬을 `~/.codex/skills`로 설치해 전역 사용 가능하게 옮긴다.
- 실제 기능 작업에서 `pdca-status.json`을 feature별로 업데이트하는 운영 루틴을 정착시킨다.
- 완료 작업마다 `.codex-pdca/memory/`에 handoff 요약을 남긴다.

## Ready To Use

아래 문구로 바로 시작할 수 있다.

- `/pdca`
- `/pdca plan "계획"`
- `/pdca design "설계"`
- `/pdca do "구현"`
- `/pdca analyze "분석"`
- `pdca로 진행해줘`
- `설계 먼저 하고 구현해줘`
- `이 작업 pdca 시작`
