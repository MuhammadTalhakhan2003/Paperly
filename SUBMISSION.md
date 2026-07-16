# Submission — Paperly

**Candidate:** Muhammad Talha Khan (talhakhan050203@gmail.com)
**Role:** Ajaia — AI-Native Full Stack Developer
**Project:** Paperly — a lightweight collaborative document editor (Google Docs–inspired)

## Links

- **Live product URL:** https://paperly-ashen.vercel.app
- **Walkthrough video:** _<add public video link — also in `VIDEO.txt`>_
- **Source code:** https://github.com/MuhammadTalhakhan2003/Paperly (and this Drive folder)

## Test / review accounts

All seeded with password **`password123`**:

| Email | Purpose |
|-------|---------|
| `alice@paperly.app` | Owner — owns & shares documents; has a starred doc |
| `bob@paperly.app` | Editor on Alice's documents |
| `carol@paperly.app` | Viewer on Alice's welcome document |

You can also sign up for a fresh account from the UI.

## What's included

- `src/` — full Next.js app (UI + API routes + libs)
- `prisma/schema.prisma`, `prisma/schema.sql`, `prisma/seed.ts` — data model, deploy DDL, seed
- `scripts/apply-schema.mjs` — CLI-free Turso schema setup
- `src/lib/*.test.ts` — automated tests (run `npm test`)
- `README.md` — setup, run, and **deployment** instructions
- `ARCHITECTURE.md` — design decisions, tradeoffs, what was deprioritized
- `AI_WORKFLOW.md` — how AI tools were used, changed, and verified
- `.env.example` — documented environment variables
- `VIDEO.txt` — walkthrough video link

## What works (end-to-end, verified)

- Sign up / log in / log out (bcrypt + JWT session cookie)
- Create, rename, edit, autosave, reopen, delete, and **duplicate** documents
- Rich-text editing: bold, italic, underline, strikethrough, H1–H3, bullet &
  numbered lists, blockquote, undo/redo
- Import `.txt`, `.md`/`.markdown`, `.docx` → new editable document (≤ 5 MB)
- Share by email as **Editor** or **Viewer**; revoke access
- **Star** documents (owner-only) with an "My documents / Shared with me / Starred"
  dashboard, shown as a responsive card grid
- **Export** a document to Markdown or PDF (print)
- **Light / dark theme** toggle (persisted, no flash on load)
- Dashboard **search by title**, live **word/character count**, autosave status
- Access control enforced on every endpoint (viewer edit/delete → 403;
  unauthenticated → 401; hidden documents → 404)
- Server-side HTML sanitization (verified against `<script>`/`onerror` payloads)
- Persistence across refresh (SQLite locally, Turso in production)

## What is partial / incomplete

- **No real-time collaboration.** Editing is single-writer with autosave; there
  are no live cursors or presence indicators. The shared-editor data model is in
  place for this as a next step.
- **No password reset / email verification.** Intentionally out of scope; seeded
  accounts cover the review flows.
- **No file attachments / blob storage.** File upload is implemented as
  import-to-document to respect the "no paid dependencies" constraint.
- **Starring is owner-scoped** (a boolean on the document), not per-viewer.
- Dashboard has no pagination (fine at demo scale).

## What I'd build next with another 2–4 hours

1. Document version history (snapshot content on save; diff/restore).
2. Presence indicators via lightweight polling/SSE ("Bob is viewing").
3. Commenting / suggestion mode.
4. Integration tests over the Route Handlers to complement the unit tests.

## How to run locally (summary)

```bash
npm install
cp .env.example .env     # then set SESSION_SECRET
npm run db:push
npm run db:seed
npm run dev              # http://localhost:3000
npm test                # run the test suite
```

Full details, including deployment to Vercel + Turso, are in `README.md`.
