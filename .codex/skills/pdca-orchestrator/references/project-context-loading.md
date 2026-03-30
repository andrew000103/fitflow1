# Project Context Loading

This repo already has strong project memory patterns. Reuse them.

## Load Order

1. `CLAUDE.md`
2. `.codex-pdca/rules/*.md`
3. `.codex-pdca/state/pdca-status.json`
4. relevant `.codex-pdca/memory/**/*.md`

## Mapping

- `CLAUDE.md`
  - durable project snapshot
  - current priorities, known bugs, platform constraints

- `.codex-pdca/rules/`
  - hard execution rules such as testing, database, platform, and documentation expectations

- `.codex-pdca/state/pdca-status.json`
  - current active feature
  - per-feature phase
  - last touched file
  - linked documents

- `.codex-pdca/memory/`
  - short handoff documents for next sessions
  - completion summaries
  - analysis summaries

## Repo-Specific Constraints

- web work must not silently change native behavior
- database work must respect Supabase and schema/RLS rules
- Expo/device validation is preferred for screen-level changes
- docs may lag implementation; record important gaps instead of assuming docs are current
