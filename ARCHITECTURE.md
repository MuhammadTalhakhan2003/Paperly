# Architecture Note

## What I optimized for

The brief rewards **depth in a few areas over shallow coverage everywhere**, so
I prioritized a coherent end-to-end slice: a usable editing experience, a real
persistence layer, and a working access-control model — each verified — rather
than a long list of half-working features.

Concretely, in priority order:

1. **A trustworthy access model.** Sharing is the feature most likely to hide
   bugs, so authorization is centralized in one pure module
   (`src/lib/permissions.ts`) and enforced on **every** API route, not just in
   the UI. This is the part I unit-tested most heavily.
2. **A genuinely usable editor.** TipTap gives a Google-Docs-like feel
   (formatting toolbar, headings, lists) with debounced autosave and a visible
   save indicator.
3. **Persistence that also deploys cleanly.** One database story that works
   identically in local dev and on serverless production.
4. **Security correctness.** All stored HTML is sanitized server-side.

## Stack decisions and tradeoffs

### Next.js (App Router) — one codebase for UI + API
Keeps frontend, backend, and access logic in a single deployable unit and makes
Vercel deployment trivial. Server Components load document data directly through
a small data-access layer (`getCurrentUser`, `getDocumentWithAccess`), while
mutations go through Route Handlers called with `fetch` — an explicit, reviewable
API surface (`/api/documents`, `/api/import`, `/api/documents/[id]/shares`, …).

### Prisma 7 + libSQL adapter → SQLite locally, Turso in production
The single most important infra decision. Vercel's filesystem is ephemeral and
read-only, so a plain SQLite file can't persist there. The libSQL driver adapter
lets the **exact same runtime code** talk to a local `file:` database in
development and a hosted **Turso** database in production — only environment
variables change. This gives a zero-cost, low-friction persistence story with no
separate database server to run locally.

Tradeoff: Prisma 7 configures Turso migrations differently from a local file, so
I ship the schema as generated SQL (`prisma/schema.sql`) and apply it to Turso
with `turso db shell` — a reliable, transparent deploy step.

### Auth: hand-rolled sessions instead of an auth library
The brief explicitly allows mocked/lightweight auth. I chose real email+password
with **bcrypt** hashing and a **stateless JWT** session cookie (`jose`), which is
only ~60 lines yet demonstrates the actual concerns (hashing, httpOnly/SameSite
cookies, signed sessions) without the weight of NextAuth. Login compares against
a dummy hash when the user doesn't exist to avoid a timing side-channel.

### Data model
Three tables (`User`, `Document`, `Share`). A `Share` is the join between a user
and a document they don't own, carrying a `role` (`VIEWER` | `EDITOR`).
Ownership is modeled directly on `Document.ownerId` rather than as a share row,
so "who owns this" is always unambiguous and ownership can never be revoked by
mistake. `@@unique([documentId, userId])` makes re-sharing idempotent (it updates
the role instead of creating duplicates).

### Content format
Documents are stored as **sanitized HTML**. HTML round-trips cleanly into TipTap,
renders directly, and is straightforward to export later. Everything written to
the database passes through a strict `sanitize-html` allowlist, so neither pasted
editor content nor uploaded `.docx`/`.md` files can introduce stored XSS.

### File import = "turn a file into a document"
Of the allowed upload behaviors I picked import-to-document because it's the most
product-relevant and needs **no blob storage** (which would otherwise require a
paid service on serverless). `.docx` is parsed with `mammoth`, `.md` with
`marked`, `.txt` line-by-line — all funneled through the same sanitizer.

## Security

- Passwords hashed with bcrypt; sessions are signed, httpOnly, SameSite=Lax.
- Every document/share endpoint re-checks authorization server-side via the
  shared permission helpers — the UI hiding a button is never the only guard.
- All stored HTML is sanitized on the server.
- Zod validates and normalizes every request body; upload type and size are
  enforced before any parsing.
- Accessing a document you can't see returns **404** (not 403) so document
  existence isn't leaked.

## What I intentionally deprioritized

- **Real-time multi-cursor collaboration.** Correct CRDT/OT collaboration is a
  multi-day effort. Paperly ships single-writer editing with autosave; the data
  model (shared editors) is ready for it as a next step.
- **Password reset / email verification.** Out of scope for a timeboxed review;
  seeded accounts make the sharing flow easy to test.
- **Attachment storage.** Chose import-to-document specifically to avoid a paid
  blob store, per the "no paid dependencies" constraint.
- **Pagination & search** on the dashboard — fine at demo scale.

## Stretch features included

Beyond the core brief I added a few high-value, well-scoped extras:
**export to Markdown / PDF** (the stored HTML makes this cheap), **starring**
documents with a Starred filter, **duplicating** a document (including ones
shared with you), a persisted **light/dark theme** built on CSS custom-property
design tokens, dashboard **search**, and a live **word count**.

Starring is modeled as a simple owner-scoped `starred` boolean on `Document`
(a per-viewer star would need a join table — deliberately out of scope). It is
enforced owner-only in the same PATCH endpoint. Duplication is allowed for
anyone with view access, producing a fresh owned copy — a small but genuinely
useful collaboration affordance.

## What I'd build next with 2–4 more hours

1. **Document version history** (append content snapshots on save; diff/restore).
2. **Presence indicators** ("Bob is viewing") over a lightweight polling/SSE channel.
3. **Commenting / suggestion mode**.
4. A couple of **integration tests** against the Route Handlers to complement the
   existing unit tests.
