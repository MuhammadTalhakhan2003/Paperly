# AI Workflow Note

This is an AI-forward role, so I used an AI coding assistant deliberately
throughout — as a fast pair-programmer and researcher, while keeping the
engineering judgment (scope, architecture, security, verification) my own.

## Which AI tools I used

- **Claude (Claude Code)** — the primary assistant: scaffolding, boilerplate,
  wiring up API routes and React components, drafting docs, and running the
  local verification commands.
- I used it in an agentic loop: propose a plan → generate code → **run it** →
  read the errors/output → fix. The important discipline was never accepting
  code I hadn't seen execute.

## Where AI materially sped me up

- **Boilerplate and glue.** Route Handlers, the Prisma client singleton, the
  auth/session helpers, and the repetitive-but-fiddly React form/toolbar
  components were generated far faster than hand-typing them.
- **Working against brand-new library versions.** This project landed on
  Next.js 16, React 19, Prisma 7, TipTap 3, and Zod 4 — all recent majors with
  breaking changes from what's in most training data. Instead of guessing, I had
  the assistant **read the bundled Next.js 16 docs and the installed packages'
  own type definitions** (e.g. the `@prisma/adapter-libsql` constructor
  signature, the renamed `middleware` → `proxy` convention, Prisma 7's
  `prisma.config.ts` model) before writing code. This avoided a whole class of
  "worked in v14, broken in v16" bugs.
- **Docs.** First drafts of the README, architecture note, and this file.

## What AI-generated output I changed or rejected

- **DB layer, rewritten around reality.** The first instinct was the classic
  "Prisma + local `dev.db`" setup. I rejected it: Vercel's filesystem is
  ephemeral, so that can't persist in production. I redirected to the **libSQL
  adapter + Turso** approach so one codebase works in both environments — the
  single most consequential correction I made.
- **Prisma 7 specifics.** Generated code assumed the old
  `datasource { url = env(...) }` in `schema.prisma` and
  `--to-schema-datamodel`. Both are gone in v7; I corrected to the
  `prisma.config.ts` datasource and the `--to-schema` flag after checking the
  CLI help.
- **TipTap duplicate extension.** An early version registered
  `@tiptap/extension-underline` separately; TipTap 3's StarterKit already
  includes Underline and Link, so I dropped the redundant registration to avoid
  duplicate-extension warnings.
- **SSR hydration.** Added `immediatelyRender: false` to the TipTap editor —
  without it, TipTap renders on the server and mismatches on hydration in the
  App Router.
- **Tone/scope of docs.** Trimmed AI-drafted prose that overstated features
  (e.g. implying real-time collaboration) to keep claims accurate.

## How I verified correctness, UX, and reliability

I did not trust generated code on sight. Verification was concrete:

- **Automated tests (Vitest, 19 tests).** The authorization logic
  (`permissions.ts`) and the file-import parsers (`import.ts`) are pure and
  unit-tested — including that owner access beats a stale share row and that
  imported/typed HTML is sanitized.
- **Full end-to-end API run against the built app.** I exercised the real
  endpoints with `curl` + cookies:
  - login / bad-login / unauthenticated → `200 / 401 / 401`
  - create → autosave → reopen (content persisted)
  - **XSS probe:** saved `<script>` and `<img onerror>` payloads and confirmed
    they were stripped on read-back
  - share to a viewer, then as that viewer confirmed read `200`, edit `403`,
    delete `403`
  - imported `.md` and `.txt` files and confirmed the resulting documents;
    unsupported `.pdf` correctly rejected with `415`
- **Production build** (`next build`) passing TypeScript with zero errors before
  considering anything done.
- **UX** checked by clicking through the actual flows in the browser (create,
  format, rename, share, switch users, star, duplicate, toggle light/dark,
  export). Visual review caught real bugs the type-checker couldn't — e.g. a
  flex-layout issue that collapsed the email field in the Share dialog, which I
  restructured and re-checked. New features (starring, duplication) were verified
  against the live API, including that a viewer cannot star (403) but can
  duplicate a shared doc into their own workspace.

The through-line: AI accelerated the *typing and research*; I owned the
*decisions and the proof that it works*.
