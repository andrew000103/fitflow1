# Phase Guide

## Plan

Use Plan to understand the request before committing to an implementation path.

Checklist:
- restate the problem in repo terms
- identify the active feature or create one
- load durable context and project rules
- identify constraints, assumptions, and success criteria
- decide whether Design is required

Exit only when the next step is explicit.

## Design

Use Design to reduce implementation risk.

Checklist:
- compare realistic options when tradeoffs exist
- define target files and responsibilities
- note platform boundaries such as web-only or native-safe changes
- define validation methods before editing
- record out-of-scope items to prevent drift

Exit only when the implementation path is clear.

## Do

Use Do for execution.

Checklist:
- make the smallest coherent set of changes
- preserve existing user changes
- run the planned validation steps
- pause if project rules are violated
- delegate only independent work that does not block the next local step

Exit only when edits and primary verification are complete.

## Analyze

Use Analyze to turn execution into reliable project memory.

Checklist:
- evaluate success criteria
- list what was verified and what was not
- note design deviations and why they happened
- capture remaining risks and next actions
- update project memory if the task materially changed status

Exit to Done, Plan, or Design depending on what remains.
