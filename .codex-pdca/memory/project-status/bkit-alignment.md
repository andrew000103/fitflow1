# BKIT Alignment Notes

## What We Verified

공개된 bkit 관련 자료에서는 다음 패턴이 반복적으로 보였습니다.

- unified `pdca` skill이 legacy `/pdca-*` 명령을 대체
- `plan`, `design`, `do`, `analyze`, `report`, `status`, `next`, `archive` 계열 액션 지원
- 분석/리포트 전용 agent 분리
- 상태 파일과 템플릿 기반 문서 생성
- Dynamic/Enterprise 수준에서 parallel team orchestration 제안

## What We Adopted

- `pdca`를 단일 진입점으로 보는 방식
- phase별 문서/상태/메모리 분리
- 역할형 subagent 모델
- strict phase output contracts

## What We Did Not Adopt Yet

- 네이티브 slash command 런타임
- 자동 task tracker 연동
- report/status/archive 액션 구현
- level auto-detection and team mode

## Next Reasonable Upgrades

1. `status`, `next`, `report` 액션을 `scripts/pdca.js`에 추가
2. `.codex-pdca/state/pdca-status.json` 자동 업데이트 스크립트 추가
3. 완료 문서 템플릿과 report 템플릿 추가
