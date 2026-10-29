# Documentation rules (always loaded)

Documentation is written in the SAME task as the code (or, in Stage A, the same task as the tests).

- Document only what is implemented. Never planned features.
- Backend endpoints -> docs/backend-features.md: a row per endpoint in "Endpoints" and a section per feature
  (what it does, how it works, endpoints, one example request/response in the real response shape, business
  rules, errors, tests); a mermaid diagram when the flow has more than three steps.
- Screens -> docs/frontend-features.md: a row in "Screens" and a section (route, who can use it, what it is
  for, step-by-step use, mobile behaviour, API endpoints used, code location, tests).
- docs/architecture.md (by hand): System, Feature map ("A --> B" = A uses B, labelled), Key flows.
- docs/database.md and docs/dependency-graph.md are GENERATED (`npm run docs:generate`); never edit by hand.
  CI runs `npm run docs:check`.
- Write simply: someone who never saw the code must understand it. Removed/renamed things are removed/renamed
  in the docs too.
