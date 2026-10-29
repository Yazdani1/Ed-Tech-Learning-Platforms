---
paths:
  - 'backend/src/models/**'
---

# Database rules (MongoDB + Mongoose)

- Existing models stay as they are. New models follow the existing style (PascalCase.model.ts, timestamps).
- Index every field used in a filter, sort or lookup; unique indexes for invariants (e.g. one enrolment per
  student per course, one quiz attempt per student per quiz bank).
- No unbounded arrays inside a document: use a separate collection.
- Reject `$`-keys from input in new code (NoSQL operator injection); sort/filter fields from a whitelist.
- After a model change run `npm run docs:generate` (docs/database.md).
