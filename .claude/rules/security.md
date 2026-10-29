# Security rules (always loaded)

Target: OWASP Top 10, OWASP ASVS Level 2.

- Existing backend: security problems found by the security-auditor are FIXED by the main session (smallest
  change, existing style) and listed in the summary. New backend code must follow these rules.
- Validate every input; never trust client prices, totals, roles, scores or user IDs.
- NoSQL injection: never pass request objects straight into a query; reject `$`-keys; whitelisted sort/filter fields.
- Rate limit auth, password reset, payment and quiz-submit endpoints. Generic login error messages.
- Uploads: size, MIME type AND magic bytes; never trust the file name; Cloudinary, never local disk.
- No secrets in code, logs, Docker images or git. Never read .env files.
- Frontend: the token is never placed in localStorage or URLs in new code; no dangerouslySetInnerHTML with
  user content (rich text from the TipTap editor is sanitised before rendering); Next.js security headers +
  CSP in next.config.ts.
- Course content (lectures, study curricula, study materials, quiz banks) only for enrolled or subscribed
  students, the course's teachers and admins, checked on the server. Quiz answers never sent to the browser
  before submission; scores computed on the server.
- Teachers reach only their own courses; students only their own enrolments, progress, quiz attempts,
  schedules, subscriptions (no IDOR via IDs in the URL). Chat conversations and group channels only for their
  members (Socket.io room joins checked too).
- Payments/subscriptions: the price comes from the database, never from the request; access only after
  server-side confirmation. (No gateway yet: subscribing activates the plan directly. When a gateway is
  added, activation must wait for its verified server-side callback.)
