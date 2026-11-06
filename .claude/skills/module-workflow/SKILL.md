---
name: module-workflow
description: Use when the user asks to build a new feature or module. Runs the full build-test-review-docs cycle for one feature.
---

# Module workflow

Goal: the same quality bar as CLAUDE.md "Definition of done", with each slow step run ONCE.

## 0. Size the change first (say the size in the first message)

| Size   | Examples                                                                           | Reviews at the end                                                                              |
| ------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Small  | texts, styling, one component, a field on an existing form, a bug fix in one place | `code-reviewer` (+ `security-auditor` if backend, auth, roles, uploads or payments are touched) |
| Medium | a new endpoint or a new page/tab on existing data                                  | `code-reviewer` + `security-auditor` if backend; `test-engineer` for a new endpoint or page     |
| Large  | a new feature with model + endpoints + pages, or app-wide shared code              | `code-reviewer` + `security-auditor` + `test-engineer`                                          |

A request with many items: split it into steps of related items and commit each step after its check passes.

## Steps

1. Take the behaviour, roles and test list from the user's instructions. Ask if anything is unclear.
   Only build this feature.
2. Backend part (if any): follow `new-backend-endpoint`. Write the integration tests with the code.
   While working, run ONLY the feature's tests: `npm run test:backend -- <file names>` (e.g. `-- coupons`).
3. Frontend part (if any): follow `new-frontend-page`. Component tests and the Playwright spec with the code.
   While working: `npm run test:frontend -- <names>` and `npm run test:e2e -- <spec>`.
4. Docs: backend-features.md, frontend-features.md, architecture.md; `npm run docs:generate`.
5. `npm run format:check` and `npm run docs:check` (seconds), then ONE run of
   `npm run check:feature -- <specs>` (the feature's e2e specs + those of every page using shared code it changed).
6. ONE review round on the finished diff: the agents for the size (table above), all started in parallel in
   one message. Fix every Critical, High and Major finding (backend: smallest change, existing style).
   Re-test only what the fixes touched (filtered runs as in steps 2-3). Run `check:feature` again only if a fix
   changed shared code, a model, or more than the feature's own files; otherwise the step 5 run plus the
   filtered runs are enough. Save every report unchanged to `.claude/reports/<YYYY-MM-DD>-<feature>-<agent>.md`.
7. Update "Current status" in CLAUDE.md with 1-3 lines (details go in docs/stage-b-history.md).
8. Commit and push the step on the current branch (CLAUDE.md git rules). Never merge, rebase, reset or
   touch branches. The full `npm run check` runs only when the user asks or before merging to main.
9. Report: size, files changed, endpoints, each check with its real result, a review table (agent, verdict,
   issues by severity, what was fixed, report link), anything deferred.
