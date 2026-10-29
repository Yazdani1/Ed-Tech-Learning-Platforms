---
name: migrate-react-page
description: Use when moving one page or feature of the old React client (legacy-frontend/) into the Next.js app in frontend/.
---

# Migrate one React page to Next.js

1. Read the old page in legacy-frontend/, its components, its services/*.service.ts calls, contexts and route
   (App.tsx: path, layout, roles). List what it shows, what the user can do, which endpoints it calls. Show the
   list before coding.
2. Schemas: `src/schemas/<feature>.schema.ts` for the endpoints it uses (match the real backend responses).
3. Route: same URL as before, `src/app/<area>/<route>/page.tsx`. react-router params -> `[param]` folders;
   useNavigate -> useRouter (next/navigation); Link -> next/link; query strings via useUrlListParams.
4. Data: replace service calls + context state with `src/api/<feature>.api.ts` TanStack Query hooks. Keep
   context only for real UI-wide state (chat socket, notifications). Drop every `localStorage` token use: the
   cookie flow handles auth.
5. UI: rebuild with the shared building blocks, mobile first, same look unless the user asks for changes.
   Copy translations from the old i18n files (legacy-frontend/src/i18n/locales/en.json and bn.json).
6. Tests (component + e2e desktop/mobile), docs/frontend-features.md, then test-engineer + code-reviewer.
7. Never change the backend for the migration. If the page needs something the backend does not provide,
   stop and ask the user.
8. Update the migration list in memory (nextjs-migration-plan) and "Current status" in CLAUDE.md.
