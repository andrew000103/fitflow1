---
name: pdca-orchestrator
description: Use when the user wants a Codex-native PDCA workflow, asks for plan/design/do/analyze style execution, requests staged implementation with subagents, or wants work tracked with project rules, phase state, and completion memory.
---

# PDCA Orchestrator

Structure work as `Plan -> Design -> Do -> Analyze`.

Use this skill when the user asks for:
- PDCA-style execution
- staged delivery or "design first, then implement"
- orchestration with subagents
- persistent project context, rules, or phase tracking

Common user phrases that should trigger this skill:
- `pdca로 진행해줘`
- `/pdca`
- `/pdca plan "계획"`
- `/pdca design "설계"`
- `/pdca do "구현"`
- `/pdca analyze "분석"`
- `plan -> design -> do -> analyze 흐름으로 해줘`
- `설계 먼저 하고 구현해줘`
- `단계 나눠서 진행해줘`
- `서브에이전트 써서 오케스트레이션해줘`
- `이 작업을 pdca-orchestrator 방식으로 처리해줘`

## Startup

Before substantial work, load project context in this order when present:
1. `CLAUDE.md`
2. `.codex-pdca/rules/*.md`
3. `.codex-pdca/state/pdca-status.json`
4. relevant files in `.codex-pdca/memory/`

If `.codex-pdca/` is missing, fall back to repo docs and local rules.

## Slash-Style Invocation

Treat `/pdca` as a repo convention that activates this workflow.
It is not a native Codex slash command; interpret it in conversation as an explicit PDCA request.

Accepted forms:
- `/pdca`
- `/pdca plan "<goal or planning request>"`
- `/pdca design "<design task>"`
- `/pdca do "<implementation task>"`
- `/pdca analyze "<review or analysis task>"`

Interpretation rules:
- `/pdca` with no phase means start from `Plan`
- `/pdca plan ...` forces the current phase to `Plan`
- `/pdca design ...` forces the current phase to `Design`
- `/pdca do ...` forces the current phase to `Do`
- `/pdca analyze ...` forces the current phase to `Analyze`
- if quoted text is present, treat it as the immediate task payload
- if no quoted text is present, infer the payload from the rest of the user message
- phase-forced invocations are strict by default: produce the requested phase output first, not a full PDCA expansion
- `/pdca plan ...` must stay in planning scope and should not expand into full Design, Do, or Analyze sections unless the user explicitly asks for the full cycle
- `/pdca design ...` must stay in design scope and should not implement
- `/pdca analyze ...` must stay in analysis scope and should not implement
- `/pdca do ...` may perform implementation, but if earlier phases are missing and risk is non-trivial, briefly prepend the minimum necessary Plan or Design context before continuing
- when a phase is forced, label the response with that phase and make the next recommended phase a short follow-up, not part of the main output

## Phase Rules

Always classify the task into one current phase.

Default operating mode:
- start with a brief Plan even for small tasks
- require Design for multi-file, risky, or non-obvious changes
- execute in Do only after the path is clear
- always finish meaningful work with Analyze
- give the user short phase updates while moving forward

### Plan

Produce:
- objective
- scope
- constraints
- assumptions
- success criteria
- next step

Use Plan for every task, even if only briefly. Skip directly to `Do` only when the implementation path is obvious and low risk.
When explicitly forced with `/pdca plan`, do not include Design, Do, or Analyze as primary sections.

### Design

Use Design when:
- more than one implementation path exists
- multiple files or systems are involved
- platform, data, or testing risk is non-trivial

Produce:
- implementation options
- chosen approach and why
- file responsibilities
- validation strategy
- out-of-scope items

When explicitly forced with `/pdca design`, do not implement. Keep output in design scope.

### Do

Implement on the critical path locally. Delegate only bounded, parallelizable side work.

During Do:
- respect project rules from `.codex-pdca/rules/`
- keep edits aligned with the chosen design
- verify changes before moving on

When explicitly forced with `/pdca do`, implementation is allowed. Only add minimal Plan/Design context when needed to reduce real risk.

### Analyze

Do not skip Analyze after meaningful work.

Produce:
- what was completed
- what was verified
- remaining risks or gaps
- whether to stop, iterate, or re-enter Plan/Design

When explicitly forced with `/pdca analyze`, keep the response evaluative. Do not continue into implementation.

If the task meaningfully changes project state, update the matching files in `.codex-pdca/state/` or `.codex-pdca/memory/`.

## Delegation

Read `references/delegation-rules.md` before using subagents.
Read `references/subagent-playbook.md` when the task is large enough to warrant orchestration.

Default roles:
- `context-reader` for codebase or docs reconnaissance
- `designer` for option comparison or architecture notes
- `implementer` for isolated code changes with a disjoint write scope
- `validator` for regression review or test interpretation

Rules:
- keep the critical path in the main agent
- delegate only self-contained tasks
- give each worker explicit file ownership when editing
- review delegated results before integration

Strict subagent policy for this workflow:
- for `/pdca plan ...`, spawn a `context-reader` if the task touches an unfamiliar or broad code area
- for `/pdca design ...`, spawn a `designer` if there are multiple viable approaches or more than one subsystem
- for `/pdca do ...`, spawn at least one `implementer` when the task spans multiple disjoint file groups or when verification can run in parallel
- for `/pdca analyze ...`, spawn a `validator` when meaningful verification or regression review is needed
- if the task is small and local, explain briefly why no subagent is needed
- subagents are created per task run; do not pretend background agents exist if none were spawned

## Output Contracts

Read `references/output-contracts.md` for compact phase output shapes.

Prefer short, high-signal updates to the user:
- current phase
- what you learned
- next action

## Project Integration

For this repo, also read `references/project-context-loading.md`.
It describes how to reuse:
- `CLAUDE.md` as durable project context
- `.codex-pdca/rules/` as enforced constraints
- `.codex-pdca/state/pdca-status.json` as feature-phase state
- `.codex-pdca/memory/` as next-session handoff memory

For repo-local usage, treat the following user requests as an explicit PDCA activation:
- `pdca 시작`
- `이 작업 pdca로`
- `이번 작업은 설계 먼저`
- `/pdca`
- `/pdca plan "계획"`
