# Roadkill app: MVP plan

## The idea
A web app where hunters and drivers log roadkill they see, check in seconds whether they can legally pick it up in that state, and claim it. Every report, salvaged or not, becomes a geotagged, timestamped, species-level record. That record set is the long-term asset.

## Who it's for
- **Salvagers** (hunters, foragers, trappers, tanners): want fresh animals and want to stay legal.
- **Drivers who hit something**: want to know what to do and whether they can keep it.
- **Data buyers later**: state DOTs, wildlife agencies, insurers, researchers, wildlife-crossing planners.

## MVP scope (v0.1, built in the scaffold)
1. **Log an animal**: GPS location, state, road, species, sex, age, condition, time seen. Takes about 20 seconds on a phone.
2. **Instant legality check**: state + species gives a plain verdict (allowed, report required, permit required, check with an officer, not allowed), with the deadline, exclusions and the official link. Migratory birds are always a no.
3. **Claim and pick up**: a claim requires a name and a box confirming you followed state rules. In permit states, a permit or authorization number is required. Prohibited animals can't be claimed. Status moves Available, Claimed, Picked up, or Gone.
4. **State rules pages**: all 50 states, from the regs spreadsheet.
5. **CSV export** of observation fields only (no names or notes). This is the seed of the data product.

## Deliberately out of scope for v0.1
- **Buying and selling.** Selling roadkill meat is illegal almost everywhere, and parts sales are restricted in most states (see the Selling parts column). "Marketplace" here means a claim board, not a store.
- Accounts and logins (handles only for now). Photos, maps, push alerts and a native app come next.

## The data play
What makes the dataset unique: crowd-sourced, species-level, GPS-accurate wildlife-vehicle collision records with carcass condition and fate (salvaged or left), across all states and in one schema. Today this data is scattered across state DOT crash reports, which undercount and rarely record species.

Design choices that protect it, already in the schema:
- Observation fields are never overwritten; only status changes.
- Each report stores the rules version and the legality verdict at the time it was logged.
- Location accuracy, time seen and time logged are kept separately.
- The export strips personal fields, so it can be shared or licensed.

Later: photo-verified species ID, dedupe of the same carcass, hotspot maps by road segment, seasonal and migration trends, and per-state data licensing.

## Roadmap
| Phase | What ships |
|---|---|
| v0.1 (now) | Log, legality check, claim, state rules, CSV export |
| v0.2 | Accounts, photos, a map view with nearby available animals, dedupe |
| v0.3 | Alerts ("fresh deer within 10 miles"), deep links to each state's permit form, PWA install |
| v1.0 | Native app, hotspot analytics, data licensing to agencies and researchers |

## Risks
- **Rules accuracy.** 8 states are low-confidence (AL, AK, HI, KY, MS, NV, NM, SC). Show the agency link everywhere, re-verify every season, and say "summary, not legal advice".
- **Liability.** The app never tells someone to stop on an interstate. Wyoming bans salvage on I-25, I-80 and I-90, and the app should warn about highway safety generally.
- **Bad actors** posing poached animals as roadkill. Mitigations are the permit-number field, officer-issued numbers in strict states, and photos plus timestamps later.

## Tech (as scaffolded)
Next.js 16 (App Router, server actions) with TypeScript and Tailwind. Postgres through Drizzle ORM; it falls back to embedded PGlite locally, so it runs with no database setup. Deploy on Vercel with Neon or Supabase Postgres, adding PostGIS for hotspot queries later.
