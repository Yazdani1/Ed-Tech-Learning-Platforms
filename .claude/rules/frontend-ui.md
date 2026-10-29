---
paths:
  - 'frontend/**/*.{ts,tsx}'
---

# Frontend UI rules (Next.js App Router + MUI v9)

- app/ holds only routes: thin page.tsx / layout.tsx rendering a component from components/<feature>/.
  Same URLs as the old client: public pages at the root, /auth/login, /auth/register, /admin/*, /student/*,
  /teacher/*; each area has its own layout.tsx (AdminLayout, StudentLayout, TeacherLayout shells). The
  student course player (/student/courses/[courseId]/learn) has no shell, as before.
- Server components by default; 'use client' only where state, effects or browser APIs are needed.
- Data fetching only through src/api/<feature>.api.ts hooks (TanStack Query) calling
  services/http.service.ts (axios). No fetch/axios in components, no try/catch in components: use
  `mutate(values, { onError })` or `query.error` (always an ApiError with a message to show).
- http.service unwraps the backend's { success, message, data, total, page, limit } shape; list hooks return
  { items, total, page, limit }.
- Request/response shapes: Zod schemas in src/schemas/<feature>.schema.ts that match what the backend really
  sends (forms use the same schemas with zodResolver).
- Auth (decided in Phase 0): every request goes to same-origin `/api/*` (next.config rewrites to the backend),
  so the backend's httpOnly `token` cookie is first-party and sent automatically. Never read, store or send
  the token in new code: no localStorage, no Authorization header, no token in URLs. The "me" query
  (`GET /api/auth/me`) is the source of the signed-in user.
- Socket.io (chat, presence, group chat, notifications): one client in context/ChatContext, created only in
  client components, connected to NEXT_PUBLIC_SOCKET_URL. Its `auth.token` comes from a Next.js route
  handler that reads the httpOnly cookie on the server; keep it in memory only (never persist it).
- Mobile first: 360, 768 and 1280 px. No horizontal scroll. Touch targets >= 44 px.
- Lists: shared ResponsiveDataView (table on desktop, cards on mobile, ListPagination under both); page state in
  the URL via useUrlListParams(schema). Row menus: shared ActionMenu.
- Forms: React Hook Form + zodResolver. Single column on mobile.
- Dialogs: components/common/AppModal (close icon, fullScreen on phones) with useModal(); confirmations
  useConfirm(); deletes useDeleteConfirm(). Never write a new confirm/delete dialog.
- Hide what the user cannot do: <Can roles=...> for actions, <RequireRole roles=...> for pages (roles from
  the signed-in user, same rules as the backend's authorize()).
- Every async view has loading (Skeleton), empty and error states.
- No hard-coded user-visible text: i18n keys (existing i18next setup, English `en` and Bangla `bn`).
- Dates and times through utils/dateTime (Luxon), shown in the viewer's own time zone.
- Components with props: named interface + FC<Props>; without props: plain arrow function.
- next/image for images (Cloudinary loader), next/dynamic for heavy parts (video player, charts, rich text
  editor, Three.js scene, drag-and-drop builders).
- After any screen change, update docs/frontend-features.md in the same task.
