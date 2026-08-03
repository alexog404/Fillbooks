# Trading Journal — Design & Functionality Reference

Single-page app shell built as one Design Component: `Trading Journal.dc.html` (logic + template), with trade data/helpers in `trade-data.js`.

## Purpose
A day-trader's journal: log trades, review performance (win rate, R-multiples, expectancy), browse a P&L calendar, keep daily notes, and (mocked) connect a broker/import CSVs. Single account, single strategy — no multi-strategy or playbook features by design (removed per user request).

## Navigation
Sidebar-driven single-page app (`this.state.screen`), no real routing:
- **Dashboard** — KPI summary + account balance + P&L calendar + recent trades
- **Trades** — full trade log, sortable/groupable table
- **Daily Journal** — per-day note-taking + trade review
- **Reports** — deeper analytics (R-multiple analysis, average price distribution, time/day-of-week breakdowns)
- **Settings** — broker connection (ThinkOrSwim, mock OAuth-style with 7-day refresh) + CSV import + preferences
- **Trade Detail** — drill into one trade (chart, target/stop visualization, notes)

Theme: dark/light toggle in sidebar footer, `this.state.theme`, all colors resolved through a `c` (colors) object computed per render — never hardcoded hex in templates besides a few chart accent fallbacks.

## Data model (`trade-data.js`)
Flat array of trade objects: `{ id, date, time, symbol, side, qty, entry, exit, pnl, r, setup, duration, status, hasNote, mistakes, habits, rating, target, stop, mae, mfe, partials? }`.
- `status`: `'closed' | 'working' | 'cancelled'` — labeled in UI as **Filled / Working / Cancelled** (renamed from generic Open/Closed per user request), each with a colored status dot (green/orange/red) placed to the LEFT of the label.
- `r`: R-multiple (risk-adjusted return) per trade — shown everywhere as e.g. `+1.4R`.
- `buildCalendar(trades, year, month)` produces week-grid data with per-day P&L and per-week totals for the calendar components.
- Starting account balance is a fixed constant (`10000`) that all balance/percentage math is derived from (`balance = 10000 + cumulative pnl up to date`).

## Key UI patterns (reused across pages)

### Calendars
Every calendar (Dashboard, Trades, Reports headers; Daily Journal date picker) is a month-grid popup:
- 7 day columns; day cells colored green/red by that day's net P&L (no dollar amounts shown in the popup pickers — just color).
- Dashboard/Trades/Reports calendars additionally render an 8th **"Weeks"** column, grouped visually with a single purple accent border wrapping the whole column (not per-cell), each week cell sized identically to day cells (same grid `fr` track) and showing week total P&L + "W1"/"W2"… label.
- All calendars **default to the current week** except the Daily Journal date picker, which defaults to **today** and only allows single-day selection (no range).
- Dashboard/Trades/Reports pickers support **range selection**: click a start day, hover previews the range (highlighted), click an end day to confirm. Supports navigating to any month/year, not just the current one.
- Clicking a single day in the Dashboard calendar expands an inline "trades that day" drilldown beneath the grid — this panel is always mounted and animates open/closed via `max-height`/`opacity` transition (not a hard mount/unmount) so it transitions smoothly.

### Account Balance card (Dashboard, top right)
Full-height card matching the left column (title + calendar/margin row). Shows:
- Whole-dollar balance (no cents)
- % change label directly under the "Account Balance" heading (not next to the number) — reflects the selected week's change by default
- Background sparkline (equity curve) blended into the card via gradient fill under the line (per CLAUDE.md global chart rule)
- Hovering the sparkline traces a smooth vertical guide line + dot (both animate via CSS transition, not just JS snapping) and live-updates both the displayed balance and % figure to the hovered point

### Chart style rule (global, from project CLAUDE.md)
Every line/area chart (equity curve, R-by-day, etc.) renders as a filled gradient area under the line (opaque at the line, fading to transparent at the bottom) — never a bare stroke.

### Recent Trades / Trades tables
Grid-based rows (CSS grid columns, not table markup) so columns stay pixel-aligned; column widths tuned so all columns (Date, Symbol, Qty, P&L, R, Status, etc.) fit without clipping or horizontal scroll on Dashboard; the full Trades page table (13 columns incl. Time/Side/Entry/Exit/Duration/Note) is wider than its card and scrolls horizontally (`overflow-x:auto`) so Status/Note stay reachable.
Status column always shows colored dot (left) + label (Filled=green, Working=orange, Cancelled=red).

### Trade Detail chart
Custom candlestick-style chart with:
- Colored risk zone (red, entry→stop) and reward zone (green, entry→target) bands
- Dashed entry price line
- Accent-colored corner brackets marking the target/stop box
- Solid pill labels for Target/Stop (price, % away, qty) and a centered "Closed P&L" pill (P&L, qty, R/R ratio)
- Small numbered circle badges (1/2/3) instead of arrow markers at entry/exit

## Reports page sections
- KPI summary tiles
- **R-Multiple Analysis**: Avg R / Avg Winning R / Avg Losing R / Best R / Worst R stat tiles, plus a bar chart of **average R per trading day** (chronological, colored red/green by sign) — replaced an earlier bucketed-distribution histogram per user request, to spot specific bad days.
- **Average Price of Stocks Traded**: horizontal bar chart, dollar price bucket on the left axis, bar length = share volume traded in that price range.
- Removed sections (explicitly not wanted): Win Rate by Relative-Volume Decile, Win Rate by Float Size, Setups performance, Playbook/Strategies (single-strategy trader).

## Explicitly removed / excluded (do not re-add without asking)
- Playbook and Strategies sections (user follows one strategy only)
- "Current streak" KPI on Dashboard
- R-multiple pills on individual trade rows in some contexts where user found them redundant — but R IS kept as its own dedicated column/field elsewhere (Recent Trades, Trades table, Trade Detail Planned/Real R) — only remove R if a future message says so again explicitly, since it was restored after an earlier over-eager removal.
- Mood & Discipline checklist, Pre-market plan, Post-market review sections (Daily Journal)

## Settings page
Mocked ThinkOrSwim account connection (connect/refresh-every-7-days flow) + CSV import of trades, plus general preferences (colorblind palette, timezone display). No real backend — all state-driven mock UI.

## Engineering notes
- Everything is inline-styled (Design Component convention) — no CSS classes/stylesheet.
- `c` = theme color object recomputed each render from `this.state.theme`.
- Dates handled as local Y-M-D strings (`fmtLocal`), not `toISOString()`, to avoid timezone-shift bugs in week/month calculations.
- Money formatting: `this.money(value, showSign)` (with cents) vs `this.moneyCompact(value)` (e.g. "$1.4k", used in tight calendar cells).
