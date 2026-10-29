---
name: new-frontend-page
description: Use when adding a page, tab or dialog to frontend/ (Next.js). Builds a responsive, role-aware MUI view with tests.
---

# New frontend page

1. Zod schemas in `src/schemas/<feature>.schema.ts` matching the backend's real shapes.
2. Requests + TanStack Query hooks in `src/api/<feature>.api.ts`, calling `src/services/http.service.ts`.
3. Components in `src/components/<feature>/` (one per file, < 300 lines, FC<Props> convention). No try/catch.
4. Page in `src/app/<area>/<route>/page.tsx` (thin), wrapped in `<RequireRole>`; actions in `<Can>`.
5. Lists: ResponsiveDataView + ListPagination + useUrlListParams; row menus ActionMenu.
6. Loading skeleton, empty, error states, toasts. All texts as i18n keys (en + bn).
7. Dialogs: AppModal + useModal; useConfirm; useDeleteConfirm.
8. Check 360 / 768 / 1280 px.
9. Component tests in `__tests__/`, Playwright `e2e/<feature>.spec.ts` (desktop + mobile).
10. Run `npm run lint`, `npm run typecheck`, `npm run test:frontend`, `npm run test:e2e`. Then test-engineer and
    code-reviewer; fix findings.
11. Update `docs/frontend-features.md` (section + Screens row).
