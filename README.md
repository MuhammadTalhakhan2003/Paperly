# Paperly

A lightweight collaborative document editor inspired by Google Docs. Create,
edit, import, star, duplicate, and share rich-text documents with per-user
access control.

Built for the Ajaia AI-Native Full Stack Developer assignment.

- **Live demo:** https://paperly-ashen.vercel.app
- **Walkthrough video:** see [`VIDEO.txt`](./VIDEO.txt)

> Try it: log in with `alice@paperly.app` / `password123` (demo accounts below).

---

## Features

| Area | What's implemented |
|------|--------------------|
| **Documents** | Create, rename, edit, autosave, reopen, delete, **duplicate** |
| **Rich text** | Bold, italic, underline, strikethrough, H1–H3, bullet & numbered lists, blockquote, undo/redo (TipTap / ProseMirror) |
| **File upload** | Import `.txt`, `.md`/`.markdown`, and `.docx` files into a new editable document (max 5 MB) |
| **Sharing** | Owner grants access to another registered user by email, as **Editor** or **Viewer**; access is revocable |
| **Organize** | **Star** documents with a dedicated Starred filter; search by title |
| **Access model** | Owner / Editor / Viewer; dashboard separates "My documents", "Shared with me", and "Starred" |
| **Export** | Download any document as **Markdown** or **PDF** (print) |
| **Themes** | Light / **dark** mode toggle, persisted, with no flash on load |
| **Auth** | Email + password signup/login, hashed with bcrypt, stateless JWT session cookie |
| **Persistence** | SQLite (local) / Turso (production) via Prisma; content survives refresh |
| **Quality** | Zod validation, server-side HTML sanitization (XSS-safe), permission checks on every endpoint, automated tests |

### Supported upload types

`.txt`, `.md`, `.markdown`, `.docx` — up to **5 MB**. Uploading a file creates a
brand-new editable document from its content. Unsupported types are rejected
with a clear message in the UI.

---

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript) — one codebase for UI + API
- **TipTap 3** (ProseMirror) — rich-text editing
- **Prisma 7** + **libSQL driver adapter** — same code targets a local SQLite
  file in dev and **Turso** (hosted SQLite) in production
- **jose** (JWT sessions), **bcryptjs** (hashing), **zod** (validation)
- **mammoth** (.docx → HTML), **marked** (.md → HTML), **sanitize-html** (XSS)
- **turndown** (HTML → Markdown export)
- **Tailwind CSS 4** + CSS custom-property design tokens — styling & theming
- **Vitest** — tests

---

## Run locally

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create your env file
cp .env.example .env
#    then set SESSION_SECRET to any long random string:
#    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3. Create the local database and seed demo data
npm run db:push
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000**.

### Demo accounts (created by the seed)

| Email | Password | Role in demo |
|-------|----------|--------------|
| `alice@paperly.app` | `password123` | Owns documents, shares them, one starred |
| `bob@paperly.app`   | `password123` | **Editor** on Alice's documents |
| `carol@paperly.app` | `password123` | **Viewer** on Alice's welcome doc |

To demonstrate sharing: log in as **Alice**, open a document, click **Share**,
add `bob@paperly.app`. Then log in as **Bob** (incognito) and find it under
**Shared with me**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Start the production server |
| `npm test` | Run the Vitest suite |
| `npm run db:push` | Apply the schema to the database |
| `npm run db:seed` | Seed demo users + documents |
| `npm run db:apply-remote` | Apply `prisma/schema.sql` to a Turso DB (no CLI needed) |
| `npm run db:studio` | Open Prisma Studio to inspect data |

---

## Deploy (Vercel + Turso, both free)

Paperly runs on Vercel's serverless runtime with a Turso (hosted SQLite)
database. Neither requires a paid plan.

### 1. Create a Turso database (via https://app.turso.tech or the CLI)

Get the **Database URL** (`libsql://…`) and an **auth token**.

### 2. Apply the schema to Turso

The repo ships the schema as SQL in [`prisma/schema.sql`](./prisma/schema.sql).
Apply it **without installing the Turso CLI** using the bundled script:

```bash
TURSO_DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="your-token" npm run db:apply-remote
```

Then seed it (optional, creates the demo accounts):

```bash
TURSO_DATABASE_URL="libsql://your-db.turso.io" TURSO_AUTH_TOKEN="your-token" npm run db:seed
```

### 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo (Next.js auto-detected).
3. Add these Environment Variables (Production):
   - `TURSO_DATABASE_URL` = your `libsql://…` URL
   - `TURSO_AUTH_TOKEN` = your Turso token
   - `SESSION_SECRET` = a long random string
   - `DATABASE_URL` = `file:./prisma/dev.db` (only used by the Prisma CLI at build; harmless)
4. Deploy. The build runs `prisma generate && next build` automatically.

> `SESSION_SECRET` must be stable in production — changing it invalidates sessions.

---

## Project structure

```
prisma/
  schema.prisma        # data model (User, Document + starred, Share)
  schema.sql           # generated DDL for Turso deployment
  seed.ts              # demo users + documents
scripts/
  apply-schema.mjs     # applies schema.sql to Turso via libSQL (no CLI)
src/
  proxy.ts             # Next.js 16 "Proxy" (middleware) for auth redirects
  app/
    api/               # Route Handlers (auth, documents, shares, import, duplicate)
    login, signup/     # auth pages (split-screen layout)
    dashboard/         # document grid (owned / shared / starred)
    documents/[id]/    # editor page
  components/          # AuthForm, AuthLayout, AppHeader, DashboardClient,
                       #   Editor, ShareDialog, ThemeToggle
  lib/
    db.ts              # Prisma client (libSQL adapter)
    session.ts         # JWT session cookie helpers
    auth.ts            # getCurrentUser (data-access layer)
    permissions.ts     # pure role/authorization logic (unit-tested)
    documents.ts       # document data access + access resolution
    import.ts          # file -> sanitized HTML (unit-tested)
    export.ts          # HTML -> Markdown / PDF export helpers
    sanitize.ts        # HTML allowlist (XSS defense)
    validation.ts      # zod schemas
    format.ts          # relative-time formatter
    http.ts            # JSON/error response helpers
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for design decisions and tradeoffs,
and [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) for how AI tooling was used.
