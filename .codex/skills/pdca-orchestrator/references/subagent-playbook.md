# Subagent Playbook

This workflow treats subagents as task-scoped workers, not permanent background actors.

## Core Rule

If no subagent was spawned in the current task, say so plainly.
Do not imply that hidden workers are operating in the background.

## Phase Defaults

### Plan

Spawn `context-reader` when:
- the request references a broad feature
- the relevant entry point is unclear
- multiple docs, state files, or modules must be checked

Main agent responsibility:
- define objective, constraints, and success criteria
- decide whether Design is required

### Design

Spawn `designer` when:
- more than one implementation path is plausible
- multiple subsystems are affected
- the task has meaningful tradeoffs

Main agent responsibility:
- choose the approach
- define file responsibilities
- define validation

### Do

Spawn `implementer` workers when:
- file ownership can be split cleanly
- one worker can implement while another validates
- non-blocking side work can proceed in parallel

Suggested split:
- `implementer-a`: business logic or data layer
- `implementer-b`: UI or integration layer
- `validator`: tests, typecheck interpretation, regression pass

Main agent responsibility:
- own the critical path
- merge and refine worker results
- avoid overlapping write scopes

### Analyze

Spawn `validator` when:
- regression risk is non-trivial
- the implementation touched multiple systems
- a fresh review is valuable

Main agent responsibility:
- summarize verified outcomes
- record remaining risks
- decide next phase

## Prompt Skeletons

### context-reader

Current phase: Plan.
Goal: identify relevant files, docs, rules, and entry points for <task>.
Write scope: none.
Constraints: follow project rules; do not propose edits.
Output: concise findings only.

### designer

Current phase: Design.
Goal: compare realistic implementation options for <task>.
Write scope: none unless docs-only scope is explicitly assigned.
Constraints: respect project rules and current architecture.
Output: options, tradeoffs, recommended approach.

### implementer

Current phase: Do.
Goal: implement <task>.
Write scope: <explicit file list>.
Constraints: you are not alone in the codebase; do not revert others' work; respect project rules.
Output: changed files, what was implemented, any blockers.

### validator

Current phase: Analyze.
Goal: review verification status and regression risk for <task>.
Write scope: none by default.
Constraints: assume implementation may still be evolving; report concrete risks and gaps.
Output: findings, residual risks, missing tests.

## Minimum Orchestration Matrix

- Small single-file task: no subagent required
- Medium multi-file task: one `context-reader` or one `designer`, then local execution
- Large multi-area task: `context-reader` + `designer`, then one or more `implementer` workers, then `validator`
