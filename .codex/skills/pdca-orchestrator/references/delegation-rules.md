# Delegation Rules

Use subagents only when delegation materially improves throughput.

This skill uses strict delegation thresholds so phase behavior is predictable.

## Allowed Roles

### context-reader
- Purpose: inspect docs, state files, or code locations
- Write scope: none
- Best phase: Plan

### designer
- Purpose: compare implementation approaches or produce a focused design note
- Write scope: none, or docs only if explicitly assigned
- Best phase: Design

### implementer
- Purpose: change a bounded file set
- Write scope: must be explicitly named and disjoint from other workers
- Best phase: Do

### validator
- Purpose: verify behavior, review regressions, or interpret test output
- Write scope: none by default
- Best phase: Do or Analyze

## When To Delegate

Delegate when:
- the task is bounded and concrete
- the result is not needed for your immediate next local step
- the write scope is isolated
- parallel work will save meaningful time

Strongly prefer delegation in these cases:
- Plan: unfamiliar feature area, large codebase slice, or multiple candidate entry points
- Design: more than one architecture option or cross-cutting change
- Do: two or more disjoint write scopes, or implementation and validation can overlap
- Analyze: verification requires a fresh pass that benefits from separation from the implementer

Keep work local when:
- the task blocks the next action
- the scope is ambiguous
- multiple files are tightly coupled
- you would need to redo the work to integrate it
- the task is small enough that spawning would add overhead without real benefit

## Worker Instructions

Every worker prompt should include:
- the current phase
- the exact goal
- allowed files or write scope
- constraints from project rules
- a reminder that other agents may also be editing elsewhere

For coding tasks, assign ownership explicitly:
- `implementer-a`: first file group
- `implementer-b`: second file group
- `validator`: no writes unless explicitly asked

## Review

The main agent must:
- review delegated outputs
- integrate or refine results
- keep the authoritative project state and memory
- state clearly in commentary when subagents were actually spawned and what each one owns
