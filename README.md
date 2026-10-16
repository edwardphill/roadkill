# Roadkill

Log roadkill, check whether you can legally salvage it in your state, and claim the pickup. Every report builds a species-level, geotagged dataset of wildlife-vehicle collisions.

See [docs/MVP-plan.md](docs/MVP-plan.md) for the product plan.

## Run it

```bash
npm install
npm run db:migrate   # creates a local embedded Postgres (PGlite) in .pglite/
npm run dev          # http://localhost:3000
```

Set `DATABASE_URL` to use a real Postgres instead (run `npm run db:migrate` against it once).

## What's here

| Path | What |
|---|---|
| `src/app/report` | Log-an-animal form with live legality check |
| `src/app/reports/[id]` | Report detail, claim, mark picked up or gone |
| `src/app/regs` | Salvage rules for all 50 states |
| `src/app/api/export` | CSV export of observations (no personal fields) |
| `src/lib/regs.ts` | Rules engine: state + species category to a verdict |
| `src/data/regs.json` | Normalized state rules the app reads |
| `src/db/schema.ts` | Drizzle schema (`reports`, `claims`) |
| `research/` | Raw research per state, the spreadsheet, and the script that builds both from it |

## Updating the rules

Edit the per-state JSON in `research/` (or the hand-coded `N` table in `research/build_regs.py` for the yes/no/unclear calls), then:

```bash
python3 research/build_regs.py research research/roadkill-salvage-regs.xlsx src/data/regs.json
```

Bump `VERSION` in the script so new reports record which rules they were checked against.

The rules are a researched summary, not legal advice. Low-confidence states are listed in the spreadsheet's Read me tab.
