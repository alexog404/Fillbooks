# FillBooks

A personal trading journal for equities day trading — log trades, review
performance (win rate, R-multiples, expectancy), browse a P&L calendar, and
keep daily notes. Single-user, single-strategy, real broker data via Charles
Schwab's API.

See `CLAUDE.md` for the full project brief, stack decisions, and lessons
carried over from the predecessor project.

## Stack

- Next.js (App Router), TypeScript strict
- Postgres via Drizzle ORM (`postgres-js`), hosted on Supabase
- Tailwind + shadcn/ui
- Deployed on Vercel — no local dev database; a separate Supabase project
  backs Preview/Development while another backs Production

## Environments

| Environment | Supabase project |
|---|---|
| Production | `fillbooks-prod` |
| Preview / Development | `fillbooks-dev` |

`fillbooks-dev` is manually refreshed from `fillbooks-prod` on demand and is
the only database the test suite is ever allowed to reset.
