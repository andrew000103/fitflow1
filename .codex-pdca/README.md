# PDCA Quick Start

이 프로젝트의 PDCA는 두 가지 방식으로 사용할 수 있습니다.

## 1. 가장 쉬운 방식

Codex에 바로 이렇게 말합니다.

- `pdca로 진행해줘`
- `설계 먼저 하고 구현해줘`
- `/pdca plan "페르소나 생성" strict. Plan만 작성해.`

이 방식은 빠르지만, `/pdca`가 네이티브 명령이 아니라 대화 관례라서 가끔 phase가 느슨하게 해석될 수 있습니다.

## 2. 가장 안정적인 방식

터미널에서 phase 전용 프롬프트를 생성한 뒤 그 문장을 Codex에 붙여넣습니다.

### 방법 A: npm script

```bash
npm run pdca -- plan "페르소나 생성"
```

### 방법 B: 로컬 실행 파일

```bash
./bin/pdca plan "페르소나 생성"
```

### 방법 C: zsh alias 설치 후

```bash
pdca plan "페르소나 생성"
```

alias 설치:

```bash
./scripts/install-pdca-shell.sh
source ~/.zshrc
```

## Phase Guide

- `plan`
  - 목표, 범위, 제약, 가정, 성공 조건, 다음 단계만 작성
- `design`
  - 구현 옵션, 선택 근거, 대상 파일, 검증 전략만 작성
- `do`
  - 구현 단계. 필요 시 최소한의 Plan/Design 문맥만 보강 후 작업
- `analyze`
  - 결과 평가, 검증, 리스크, 누락 검증, 다음 단계만 작성

## Recommended Flow

```bash
pdca plan "페르소나 생성"
pdca design "페르소나 시스템 구조"
pdca do "persona-engine.ts와 persona-store.ts 구현"
pdca analyze "페르소나 시스템 1차 구현"
```

## Utility Commands

```bash
pdca status
pdca next
pdca report "persona-system"
pdca team "페르소나 시스템 구현"
```

- `pdca status`
  - 현재 active feature와 phase, last file, constraints를 출력
- `pdca next`
  - 현재 상태 기준 다음 권장 phase와 명령을 출력
- `pdca report "<feature>"`
  - `docs/04-report/features/*.report.md`에 보고서 초안을 생성
- `pdca team "<task>"`
  - Codex에 붙여넣어 실제 서브에이전트 오케스트레이션을 요청할 수 있는 강한 실행 프롬프트를 출력

## Team Orchestration

`pdca team`은 Codex용 실행 브리프 생성기입니다.

기본형:

```bash
pdca team "페르소나 시스템 구현"
```

옵션형:

```bash
pdca team "페르소나 시스템 구현" \
  --feature persona-system \
  --files src/lib/persona-engine.ts,src/stores/persona-store.ts,src/screens/home/home-screen.tsx \
  --validate typecheck,ui,regression \
  --phase do
```

옵션 설명:

- `--feature <name>`
  - 현재 작업의 feature 이름을 명시
- `--files <csv>`
  - 구현 범위를 파일 목록으로 지정
  - 여러 파일을 주면 브리프에서 `implementer-a`, `implementer-b` 소유권 분할 제안을 생성
- `--validate <csv>`
  - 검증 포인트 지정
  - 예: `typecheck,ui,regression,tests`
- `--phase <phase>`
  - 시작 phase 힌트
  - 예: `plan`, `design`, `do`, `analyze`

추천 사용 예시:

```bash
pdca team "AI 플랜 결과 화면 개선" \
  --feature ai-plan-loading-ux \
  --files src/screens/ai/ai-plan-result-screen.tsx,src/stores/ai-plan-store.ts \
  --validate ui,typecheck,regression \
  --phase do
```

이 명령은 바로 Codex에 붙여넣을 수 있는 브리프를 출력하고, 그 브리프 안에는:

- 어떤 서브에이전트를 고려할지
- 구현 worker의 파일 소유권을 어떻게 나눌지
- validator가 무엇을 봐야 하는지
- 메인 에이전트가 무엇을 책임져야 하는지

가 포함됩니다.

## Subagents

서브에이전트는 상주 인력이 아니라 task마다 생성되는 worker입니다.

- `plan`: 낯선 영역이면 `context-reader`
- `design`: 구조안이 여러 개면 `designer`
- `do`: 파일 범위를 나눌 수 있으면 `implementer`
- `analyze`: 독립 검증이 필요하면 `validator`

응답에는 실제 사용 여부가 표시되어야 합니다.

- `Subagents used: none`
- `Subagents used: context-reader, validator`

## bkit-Inspired Parts

공개된 bkit 자료에서 확인된 패턴 중 현재 이 프로젝트에 반영한 부분:

- unified `/pdca action feature` 스타일
- phase 문서와 상태 추적
- 분석/검증/보고용 역할 분리
- 프로젝트 규칙과 장기 메모리 분리
- `status`, `next`, `report`, `team` 성격의 액션 추가

아직 미구현:

- 진짜 네이티브 slash command
- 자동 archive/status/report 명령 세트
- bkit 수준의 전체 task/task-tracker 훅 시스템
