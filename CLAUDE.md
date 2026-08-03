# CLAUDE.md

This file orients a fresh Claude Code session on this repo. Read it before
writing any code. This is a **new** trading journal project (a fresh rebuild,
not a fork of the original `TradeJournal` repo) that intentionally reuses the
same stack and, more importantly, the hard-won lessons from that project so
they don't have to be re-learned the expensive way.

The predecessor project lives at `/Users/alejandro/Documents/TradeJournal` —
its own `CLAUDE.md` there is the full war-story version of everything
summarized in this file's "Lessons carried over" section. If something here
is ambiguous, that file (and its git history) is the reference, not a guess.

## What this is

A trading journal for equities day trading, built for one person (the user),
audience of one. **Default assumption, not yet confirmed with the user:**
single-tenant, no auth, no per-user scoping — same deliberate call the
predecessor made. If this project is ever meant to support more than one
user, that has to be an explicit, early decision (it touches the schema,
every query, and the whole security model) — don't let it become an assumed
retrofit later. Flag this back to the user before the schema is finalized if
it hasn't been discussed yet.

## Stack (same as the predecessor, deliberately)

- Next.js (App Router), TypeScript strict, as a full-stack app (no separate
  backend).
- Postgres via Drizzle ORM, `postgres-js` (the `postgres` npm package) as the
  driver.
- Tailwind + shadcn/ui.
- Vercel for hosting, Supabase for managed Postgres.
- Local dev/test Postgres via `docker compose up -d postgres` (a
  `postgres:16` container) — see "Local-first" below for why this matters.

Don't casually swap any of these for something else without asking — the
whole point of reusing this stack is that the traps below are already known
and solved for it.

## Local-first: this project must live and run locally

The user edits this project in VS Code and needs `npm run dev` to work
against a **local** database, not production. Concretely:

- This is a real local git repo (`git init` here, not just a GitHub-only
  project) from the start.
- `docker-compose.yml` should stand up a local `postgres:16` for dev/test,
  same pattern as the predecessor — `DATABASE_URL`/`DIRECT_URL` in `.env`
  point at `localhost`, never at Supabase, for local dev and for the test
  suite.
- Tests run against a real local Postgres (`freshDb()`-style pattern,
  `TRUNCATE`-and-reset between test files, `fileParallelism: false` in
  vitest config) — not SQLite, not mocks. This was a deliberate, tested
  choice in the predecessor (see its CLAUDE.md trap #21) and paid off:
  it caught real Postgres-specific bugs (`numeric` string coercion, pooler
  prepared-statement incompatibility) that an in-memory mock would have
  hidden.
- **Never put the production Supabase connection string in this repo's
  `.env`.** The test suite truncates every table on every run — pointing
  it at production is a real, immediate data-loss risk, not a theoretical
  one. Production connection strings live only as Vercel env vars.

## Vercel + Supabase: direct connection, but the user provides the data

The user wants Claude to have a **direct connection** to both Vercel and
Supabase for this project, so work doesn't get stuck on manual
copy/paste round-trips. That means, up front, ask the user for:

1. **A Vercel project**, linked via `vercel link` (requires the user is
   logged in via `vercel login` or already authenticated in this
   environment — check `vercel whoami` first).
2. **A Supabase project** — the user creates it (Supabase dashboard →
   New Project), then provides:
   - The **Project URL** (`https://<ref>.supabase.co`).
   - The **publishable** and **secret** API keys (Supabase's newer
     `sb_publishable_...` / `sb_secret_...` key format, from Project
     Settings → API). These are enough for Claude to query/mutate data
     directly via Supabase's REST API (PostgREST) — `GET
     https://<ref>.supabase.co/rest/v1/<table>?select=...` with
     `apikey`/`Authorization: Bearer <secret key>` headers — **without**
     needing the raw Postgres connection string. This was the working
     pattern established in the predecessor project when direct
     `DATABASE_URL` access was blocked (see next point) — it's fast,
     read/write, and doesn't require pulling raw secrets into a local
     file.
   - Separately, the **pooled and direct Postgres connection strings**
     (`DATABASE_URL`, port 6543 pooled / `DIRECT_URL`, port 5432 direct)
     for **Vercel's env vars only** — the app runtime and migrations need
     these, but they should be set via `vercel env add` or the Vercel
     dashboard, not handed to Claude to store locally.

**Known guardrail, don't try to work around it:** `vercel env pull` in an
agent session redacts values that look like secrets (`[SENSITIVE]`) —
this is intentional, a safety feature, not a bug to route around. If raw
production values are ever genuinely needed for debugging, ask the user to
paste them directly (as they did with the Supabase keys), or use the
Supabase REST API path above, which doesn't trigger this at all.

**Supabase's direct connection host is IPv6-only** without the paid IPv4
add-on — if `DIRECT_URL` connection attempts fail with `ENOTFOUND` from a
sandboxed environment, that's why, not a misconfiguration. `DATABASE_URL`
(the pooled connection) is IPv4-compatible and is what actually matters for
the running app; `DIRECT_URL` is only needed by `drizzle-kit`/migrations,
which may need to run from a machine that actually has IPv6 egress (or via
the Supabase SQL editor as a fallback for applying migrations by hand).

**Postgres pooler needs `{ prepare: false }`** in the `postgres()` client
config when connecting through Supabase's transaction-mode pooler (port
6543) — it doesn't support prepared statements. This fails only against
the real pooler (never locally), so don't "clean it up" without
understanding why it's there.

## Design workflow: mockup first, Claude-generated

Design comes from Claude directly — not an external Figma file or handoff
doc (confirm with the user if that ever changes). The process:

1. **Build a basic mockup first**, before any real feature code. Use the
   `artifact-design` skill (and `dataviz` skill, for anything chart-like)
   to produce a static HTML/Artifact mockup of the core screens — this is
   throwaway/reference, not the final component code.
2. **Get the user's sign-off on the mockup** before writing real
   Next.js/shadcn components against it.
3. Once approved, build the real dark-first component system (the
   predecessor's purple/green/red palette is a reasonable starting point
   if the user doesn't specify otherwise — ask rather than assume if a
   fresh look is wanted instead).

Don't skip straight to building real pages from a verbal description —
the explicit ask here is mockup-first.

## Feature rollout: one at a time, each one verified before the next

The user was explicit: basic mockup, then features added **one at a
time**, each one **verified working** before moving to the next. This
mirrors the predecessor's phase-gated approach, which worked well there:

- Small, reviewable slices — not a big-bang build of everything at once.
- Every slice gated on: `tsc --noEmit` clean, tests passing (against the
  real local Postgres, not mocks), `npm run build` clean.
- **For anything UI-visible, actually look at it** — start the dev
  server and check the feature in a real browser (Playwright installed ad
  hoc for a verification pass, then uninstalled — it's not meant to be a
  permanent project dependency, same as the predecessor) before calling a
  feature done. A typecheck/test pass is not proof a chart renders or a
  page isn't blank — the predecessor hit exactly this class of bug more
  than once (see trap list below).
- Don't merge/deploy multiple unrelated features in one pass "while
  we're at it" — keep the verify loop tight per feature.

## Lessons carried over from the predecessor project

These are real bugs hit once already in the same stack, kept here so they
aren't hit a second time. Full detail and code references are in
`/Users/alejandro/Documents/TradeJournal/CLAUDE.md`'s "Traps already hit
once" section — this is the condensed, forward-looking version.

1. **Money must be tracked in integer cents internally**, converted to
   dollars only at the final display/storage boundary. `(7.9 - 8.0) * 60`
   really does produce `-5.999999999999979` in JS. Any FIFO/PnL engine
   needs to accumulate in cents.

2. **Every money/qty/ratio Postgres column needs `mode: "number"`** on
   Drizzle's `numeric()` builder. Without it, `numeric` columns come back
   from `postgres-js`/`node-postgres` as **strings**, and `"7.60" * 60` is
   a silent, live bug. Same goes for raw `sql\`count(*)\`` results — wrap
   in `Number(...)` explicitly, `sql<number>\`...\`` is a TypeScript
   assertion only, not a runtime coercion.

3. **Deterministic, stable IDs for any derived/rebuilt entity** (e.g. a
   "trade" reconstructed from raw executions) — not random UUIDs — so
   re-deriving from the same source data produces the same ID and doesn't
   orphan any child data (journal notes, tags) keyed to it on every
   rebuild.

4. **If that ID is a hash of (account, symbol, direction, timestamp) or
   similar: a broker can report multiple distinct fills at the exact same
   timestamp** (partial fills of one multi-fill order landing in the same
   second is a real, observed case, not a hypothetical). If the ID
   formula doesn't disambiguate between them, they collide, and an
   upsert-based rebuild will silently overwrite all but one — data loss
   that looks like "the numbers are just wrong," not a crash. **Fold in
   something unique to the specific fill (e.g. the entry execution's own
   stable row ID), not just the shared timestamp.** This exact bug was
   found and fixed in the predecessor project's `rebuild.ts` — worth
   getting right from the start here instead of re-discovering it.

5. **FIFO trade boundary: decide explicitly whether "one trade" means
   "one closed lot" or "position returns to zero."** The predecessor
   chose "one closed lot = one trade" deliberately (two buys before any
   sell are two separate lots even though they overlap in time) — pick
   this deliberately for the new project too, don't let it fall out of
   however the first implementation happens to work.

6. **Dedupe on (account, timestamp, symbol, side, qty, price) — not a
   broker's own ref/order number.** A ref number is not guaranteed unique
   across a partial fill's sibling executions.

7. **Timezone conversion (`date-fns-tz`'s `fromZonedTime`/`toZonedTime`)
   reads/writes via *local* Date getters/setters, not UTC ones.** Building
   a naive date with `Date.UTC(...)` silently produces a wrong instant
   unless the machine's own TZ happens to be UTC. Use the local `Date`
   constructor for input, local getters (`.getHours()`, not
   `.getUTCHours()`) for output.

8. **Any Server Component/route that reads the DB must not be statically
   prerendered.** `next build` prerenders by default; a DB read at build
   time hits a database that may not exist yet at that point in the
   pipeline. Export `const dynamic = "force-dynamic"` on any such page.

9. **CSS custom properties don't resolve inside `<canvas>`.** If a chart
   library (e.g. `lightweight-charts`) renders to canvas, read real hex
   values via `getComputedStyle` at chart-creation time instead of
   passing `var(--...)` strings into canvas fill/stroke styles.

10. **`lightweight-charts` v5 moved markers off the series object** —
    it's `createSeriesMarkers(series, markers)` from the package root, not
    `series.setMarkers(...)`. Don't "fix" this back to the v3/v4 API from
    memory.

11. **A fixed-window chart (e.g. a time-of-day heatmap) silently drops
    data outside its hardcoded window**, and this is invisible to
    typecheck/tests — it only shows up as an empty chart when actually
    looked at in a browser with real (or realistic fixture) data. Build
    the bucket/column set as a union of the expected range and whatever
    the actual data contains.

12. **A Vercel project's Framework Preset can silently be "Other" instead
    of the detected framework** (e.g. if the repo's very first commit had
    no real code yet) — this causes every route to 404 even though the
    build itself succeeds, and looks identical to a Deployment Protection
    issue from the outside. Check `vercel project ls`/project settings
    early if a fresh deploy 404s everywhere; fix via `vercel project
    update <name> --framework nextjs` + a redeploy.

13. **`db.transaction()`'s callback must be `async` under `postgres-js`**,
    and the call itself must be `await`ed — there's no synchronous
    transaction API like better-sqlite3 had.

## Commands (once the project is scaffolded)

```bash
docker compose up -d postgres   # local Postgres for dev/test

npm run dev                     # migrate, then next dev
npm run build                   # production build
npx vitest run                  # full test suite -- needs local Postgres up
npx tsc --noEmit                # typecheck
npm run db:generate             # drizzle-kit generate, after schema changes
npm run db:migrate              # apply pending migrations locally
```

## Open questions to resolve with the user before/while building

These weren't settled in the kickoff conversation — surface them rather
than silently assuming:

- **Single-tenant/no-auth, same as the predecessor, or does this project
  need real auth/multi-user from the start?**
- **Is this meant to replace `TradeJournal` eventually, or run alongside
  it?** (Affects whether historical data ever needs to migrate over.)
- **What's actually different this time** — new feature set, different
  broker, different design direction, or primarily "same app, cleaner
  build"? Worth a short scope conversation before the first mockup so the
  mockup targets the right thing.
- Confirm the design starting point: dark-first, same purple/green/red
  palette as the predecessor, or a genuinely fresh look?
