---
name: module-workflow
description: Use when the user asks to build a new feature or module. Runs the full build-test-review-docs cycle for one feature.
---

# Module workflow

1. Take the feature's behaviour, roles and test list from the user's instructions. Ask if anything is unclear.
   Only build this feature.
2. Backend part (if any): follow the `new-backend-endpoint` skill (existing backend patterns).
3. `test-engineer` agent: write missing tests and run them.
4. `code-reviewer` and `security-auditor` agents. Fix every Critical, High and Major finding in the NEW code,
   re-run tests. Save every report unchanged to `.claude/reports/<YYYY-MM-DD>-<feature>-<agent>.md` and show a
   table: agent, verdict, issues by severity, what was fixed, link to each report.
5. Frontend part: follow the `new-frontend-page` skill. Then `test-engineer` and `code-reviewer` again.
6. Docs: backend-features.md, frontend-features.md, architecture.md; `npm run docs:generate`.
7. `npm run check` must pass. Update "Current status" in CLAUDE.md.
8. Report: files changed, endpoints, test results, findings fixed, anything deferred, and a proposed commit
   message. Never commit, push or touch branches: the user does that.
