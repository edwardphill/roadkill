# Roadkill

Log roadkill, check whether you can legally salvage it in your state, and claim the pickup. Every report builds a species-level, geotagged dataset of wildlife-vehicle collisions.

See [docs/MVP-plan.md](docs/MVP-plan.md) for the product plan.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

With no Supabase settings the app runs in **demo mode**: reports are saved in your browser only and there's no sign-in. Copy `.env.example` to `.env.local` and fill it in to use the shared database and Google sign-in.

## Hosting

The site is a static export (`output: "export"`) published to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`. The browser talks straight to Supabase, which holds the data and does Google sign-in.

One-time setup:

1. **GitHub Pages**: repo Settings > Pages > Source: **GitHub Actions**.
2. **Supabase**: create a project, open SQL Editor, paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. **Google sign-in**: in Google Cloud Console create an OAuth client (Web application) with authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`. In Supabase, Authentication > Sign In / Providers > Google: turn it on and paste the client ID and secret.
4. **Redirects**: Supabase Authentication > URL Configuration: Site URL `https://<owner>.github.io/roadkill/`, and add `https://<owner>.github.io/roadkill/**` (and `http://localhost:3000/**` for local dev) to Redirect URLs.
5. **Connect the site**: repo Settings > Secrets and variables > Actions > Variables: add `SUPABASE_URL` (Project URL) and `SUPABASE_KEY` (the publishable or anon key; it's public by design, row-level security protects the data). Re-run the deploy workflow.

## What's here

| Path | What |
|---|---|
| `src/app/report` | Log-an-animal form with live legality check |
| `src/app/reports` | Report detail (`/reports/?id=…`), claim, mark picked up or gone |
| `src/app/regs` | Salvage rules for all 50 states |
| `src/lib/store.ts` | All reads and writes: Supabase, or localStorage in demo mode |
| `src/lib/csv.ts` | CSV export of observations (no personal fields) |
| `src/components/Auth.tsx` | Google sign-in via Supabase Auth |
| `src/lib/regs.ts` | Rules engine: state + species category to a verdict |
| `src/data/regs.json` | Normalized state rules the app reads |
| `supabase/schema.sql` | Tables, row-level security, and the claim/status functions |
| `research/` | Raw research per state, the spreadsheet, and the script that builds both from it |

## Updating the rules

Edit the per-state JSON in `research/` (or the hand-coded `N` table in `research/build_regs.py` for the yes/no/unclear calls), then:

```bash
python3 research/build_regs.py research research/roadkill-salvage-regs.xlsx src/data/regs.json
```

Bump `VERSION` in the script so new reports record which rules they were checked against.

The rules are a researched summary, not legal advice. Low-confidence states are listed in the spreadsheet's Read me tab.
