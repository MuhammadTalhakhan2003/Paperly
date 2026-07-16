# Paperly — Submission

**Candidate:** Muhammad Talha Khan · talhakhan050203@gmail.com
**Role:** Ajaia — AI-Native Full Stack Developer

A lightweight collaborative document editor inspired by Google Docs: create,
edit, import, star, duplicate, and share rich-text documents with per-user
access control.

## Links

- **Live product:** https://paperly-ashen.vercel.app
- **Source code:** https://github.com/MuhammadTalhakhan2003/Paperly
- **Walkthrough video:** https://drive.google.com/file/d/1Mg_0w3g8PKeJLdtLfVXNpGDro--awp29/view?usp=sharing

## Review / test accounts

All seeded, password **`password123`**:

| Email | Role in demo |
|-------|--------------|
| `alice@paperly.app` | Owner — owns & shares documents; has a starred doc |
| `bob@paperly.app` | Editor on Alice's documents |
| `carol@paperly.app` | Viewer on Alice's welcome document |

You can also sign up for a fresh account from the UI.

**To see sharing:** log in as Alice → open a document → **Share** → add
`bob@paperly.app`. Then log in as Bob (incognito) → the doc appears under
**"Shared with me"** and is editable. Log in as Carol to see view-only access.

## What works (end-to-end, verified in production)

- **Auth:** email + password signup/login/logout (bcrypt hash + JWT session cookie)
- **Documents:** create, rename, edit, **autosave**, reopen, delete, **duplicate**
- **Rich text (TipTap/ProseMirror):** bold, italic, underline, strikethrough,
  H1–H3, bullet & numbered lists, blockquote, undo/redo
- **File upload:** import `.txt`, `.md`/`.markdown`, `.docx` → new editable
  document (max 5 MB; unsupported types rejected with a clear message)
- **Sharing:** owner grants access by email as **Editor** or **Viewer**; revocable
- **Organize:** **star** documents (owner-only) with a Starred filter; a
  responsive card-grid dashboard split into My documents / Shared with me / Starred
- **Access model:** every API route re-checks permission server-side
  (viewer edit/delete/star → 403, unauthenticated → 401, hidden docs → 404)
- **Export:** download a document as **Markdown** or **PDF** (print)
- **Themes:** light / **dark** toggle (persisted, no flash on load)
- **Security:** all stored HTML is server-side sanitized (verified against
  `<script>` / `onerror` payloads); Zod validates every request
- **Persistence:** SQLite (local) / **Turso** (production) via Prisma libSQL adapter

## What is partial / incomplete

- **No real-time multi-cursor collaboration.** Editing is single-writer with
  autosave; no live cursors/presence. The shared-editor data model is ready for it.
- **Starring is owner-scoped** (a boolean on the document), not per-viewer.
- **No password reset / email verification.** Out of scope for the timebox.
- **No file attachment/blob storage.** File upload is import-to-document by
  design, to respect the "no paid dependencies" constraint (serverless has no disk).
- Dashboard has no pagination (fine at demo scale).

## What I'd build next with another 2–4 hours

1. Document **version history** (snapshot content on save; diff/restore).
2. **Presence indicators** ("Bob is viewing") over lightweight polling/SSE.
3. **Commenting / suggestion mode.**
4. **Integration tests** over the Route Handlers to complement the unit tests.

## Tech stack & architecture

- **Next.js 16** (App Router, React 19, TypeScript) — one codebase for UI + API
- **TipTap 3** rich-text editor · **Prisma 7** + **libSQL** driver adapter
- **jose** (JWT) · **bcryptjs** · **zod** · **mammoth**/**marked** (import) ·
  **sanitize-html** (XSS) · **turndown** (Markdown export) · **Tailwind CSS 4**
- **Vitest** — automated tests
- **Deploy:** Vercel (serverless) + Turso (hosted SQLite), both free tier

Key decision: the libSQL driver adapter lets the *same* runtime code target a
local SQLite file in dev and a hosted Turso DB in production — Vercel's
filesystem is ephemeral, so this gives zero-cost persistence with no DB server.
Ownership is modeled on `Document.ownerId` (not a share row) so it's always
unambiguous; `@@unique(documentId, userId)` makes re-sharing idempotent.

## Automated tests

19 Vitest tests covering the pure authorization logic (`permissions.ts` —
including that ownership beats a stale share row) and the file-import parsers
(`import.ts` — including that imported HTML is sanitized). Run with `npm test`.

## Run locally

    npm install
    cp .env.example .env          # then set SESSION_SECRET
    npm run db:push
    npm run db:seed
    npm run dev                   # http://localhost:3000
    npm test                      # run the test suite

Full setup + deployment (Vercel + Turso) instructions are in `README.md`.

## AI workflow (summary)

I used **Claude (Claude Code)** as a pair-programmer in an agentic loop: plan →
generate → run → read errors → fix. It sped up boilerplate (route handlers,
components, docs) and — critically — I had it **read the bundled Next.js 16 docs
and each library's own type definitions** before coding, since this project uses
very recent majors (Next 16, React 19, Prisma 7, TipTap 3, Zod 4) with breaking
changes. I rejected/changed AI output where it mattered most: used the
libSQL+Turso adapter instead of a local SQLite file (Vercel can't persist a
file), fixed Prisma 7's new config model, removed a duplicate TipTap extension,
and added `immediatelyRender: false` for SSR. Verification was concrete: 19 unit
tests, a full `curl` API run against the deployed app (XSS probe, viewer/editor
403 checks, star/duplicate flows), a clean `next build`, and manual
click-through. See `AI_WORKFLOW.md` for details.
