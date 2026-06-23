# Project Handoff / Context — Squash Club Malmö

Read this first in a new session. It captures the full state, conventions, and the
**sandbox gotchas** that will otherwise cost you a lot of time.

_Last updated: 2026-06-22._

---

## 1. What this project is

A squash court management + championship app for **ESF European Mixed Team U15 & U17 2026**,
hosted by Squash Club Malmö. Two parts in one repo:

- **Frontend** (repo root) — Vue 3 + Vite + TypeScript + Tailwind v4. Public championship
  views + a live court pairing/scoring demo (TV scoreboard ↔ phone controller).
- **Backend** (`backend/`) — NestJS + TypeORM (**SQLite via sql.js**). Serves the championship
  dataset, device auth + RBAC, court pairing/scoring, real-time (Socket.IO), and a
  Sportradar integration layer.

The frontend **no longer contains mock data** — all championship views fetch from the backend
`/content/*` API. A `DataSourceBadge` (bottom-right) shows `Seed data · API` / `Live · Sportradar` / `API offline`.

---

## 2. Repo layout

```
club-malmo-app/
├── src/                      # FRONTEND
│   ├── api/client.ts         # fetch wrapper; base = VITE_API_BASE_URL || http://localhost:3000/api/v1
│   ├── composables/useApi.ts # data fetch w/ loading/error/abort (replaced useMockFetch — deleted)
│   ├── components/           # AppFooter, CountryFlag, DataSourceBadge, HeroHeader(REMOVED), MatchTable,
│   │                         #   SectionCard, SideBar, StandingsTable, StatCard, StateBlock, TabBar(unused)
│   ├── views/                # HomeView, MatchView, StandingChampionshipView, LatestChampionshipView,
│   │                         #   SwedenView, SwedenPlayersView, CourtsView, TvScoreboardView,
│   │                         #   ControllerView, DeviceBlockedView
│   ├── pairing/              # courtHub.ts (client-side 6-court sim), useCourtHub.ts, types.ts
│   ├── security/deviceDetect.ts  # device-class detection (UX gate) + dev override ?as=tv|mobile
│   ├── router/index.ts       # routes + beforeEach device guard
│   ├── types/index.ts        # Country, Match, MatchDay, StandingRow, OverallStatRow, Player, ScoreboardState
│   ├── App.vue               # shell: SideBar + RouterView + DataSourceBadge; /tv is fullscreen
│   └── assets/main.css       # Tailwind v4 import + @theme tokens (brand/court/accent colors)
├── backend/                  # BACKEND (see backend/README.md)
│   └── src/{config,cache,database,common,devices,courts,pairing,matches,realtime,sportradar,content}
├── docs/
│   ├── COURT_PAIRING_SPEC.md
│   └── SPORTRADAR_AND_DEVICE_ACCESS_SPEC.md
├── README.md                 # original frontend scaffold readme
├── README_DATA.md            # how to run frontend+backend together, data-source badge
└── HANDOFF.md                # this file
```

NOTE: `src/data/*` and `src/composables/useMockFetch.ts` were **deleted** (mock removed).
`src/components/HeroHeader.vue` and `LiveScoreButton.vue` were also removed earlier.

---

## 3. ⚠️ SANDBOX GOTCHAS (most important section)

1. **The mounted user folder is SLOW.** `/sessions/<id>/mnt/club-malmo-app` is a network mount.
   `npm install` of a NestJS `node_modules` there **times out** (>45s) and even `rm -rf node_modules`
   times out. **Do not install backend deps on the mount.**
   - Workaround used: installed backend deps on local disk and symlinked:
     `/tmp/bb/node_modules` ← `npm install` there, then `ln -sf /tmp/bb/node_modules backend/node_modules`.
   - The symlink is REMOVED from the deliverable (don't ship a /tmp symlink). Recreate it each session.
   - Frontend `node_modules` already exists on the mount (came with the scaffold) and works, just slow.

2. **Background processes DO NOT survive between bash tool calls.** A server started with `&`
   in one call is dead by the next call. **Start the server AND run tests in the SAME bash call**
   (start → sleep → curl/node test → kill).

3. **Each bash call has a 45s timeout.** `nest build` on the mount can exceed it. For the backend,
   compile fast to local disk instead:
   `./node_modules/.bin/tsc -p tsconfig.build.json --outDir /tmp/bdist`
   then run: `NODE_PATH=/tmp/bb/node_modules node /tmp/bdist/main.js`.

4. **File Write/Edit tools can write TRUNCATED content to the mount for files that already exist**
   (a sync quirk seen repeatedly — e.g. a file ends mid-word). **Prefer bash heredocs**
   (`cat > file <<'EOF' ... EOF`) for writing/overwriting, and verify with `wc -l` / `tail`.
   New files via the Write tool were usually fine; overwrites were the problem.

5. **Deleting files on the mount is blocked by default.** Use the
   `mcp__cowork__allow_cowork_file_delete` tool once (it enables deletion for the folder), then `rm`.

6. **Do NOT use `better-sqlite3`** (native build too slow/times out). The DB uses **`sql.js`**
   (TypeORM `sqljs` driver, pure JS). Keep it that way unless Postgres is wired.

7. **npm cache is warm on local disk.** `npm install --ignore-scripts --prefer-offline` in `/tmp`
   finishes in ~10s.

---

## 4. Build / verify commands (all currently PASS clean)

Frontend (run from repo root):
```
npm run build      # vue-tsc type-check + vite build  → exit 0
npx oxlint src/    # 0 warnings/errors
npx eslint src/    # exit 0
```

Backend (from `backend/`, needs node_modules symlink — see gotcha #1):
```
# compile fast:
./node_modules/.bin/tsc -p tsconfig.build.json --outDir /tmp/bdist   # exit 0
# run + smoke (ONE bash call):
D=$PWD; NODE_PATH=/tmp/bb/node_modules PORT=3011 DATABASE_FILE=$D/data/t.sqlite NODE_ENV=development node /tmp/bdist/main.js >/tmp/s.log 2>&1 & sleep 7; node scripts/smoke.mjs; pkill -f 'bdist/main.js'
```
`scripts/smoke.mjs` runs **18 assertions** (enroll→session→pairing→scoring→match-end code
regen→device-class 403s→sportradar status). All passing.

Frontend logic tests done via `node --experimental-strip-types /tmp/x.mts` (the type-only `@/`
imports get stripped; mock `navigator`/`screen` via `Object.defineProperty(globalThis, ...)`).

---

## 5. Backend API quick reference (prefix `/api/v1`)

- `GET /health`
- `GET /content/meta` → `{championship, source:'seed'|'sportradar', sportradarEnabled}`  ← data-source truth
- `GET /content/match-days`, `/content/standings?bracket=top|bottom`, `/content/latest?bracket=`, `/content/sweden`
- `POST /devices/enroll` (TV uses `provisioningKey`; auto-approves in non-prod) → `{registrationToken}`
- `POST /auth/session` → `{token (JWT), role}` (15m)
- `GET /courts`, `GET /courts/:id/state`
- `GET /scoreboard/:id`  (JWT + **TV only**)
- `POST /pairing/claim`  (JWT + **MOBILE only**) → court-scoped token
- `POST /courts/:id/match`, `POST /courts/:id/score` (JWT + MOBILE + court token; idempotent `seq`)
- `POST /courts/:id/reset` (ADMIN)
- `GET /sportradar/status|live|schedule|rankings`

Guards: `AuthGuard` (JWT) + `RolesGuard` (`@Roles`) + `DeviceClassGuard` (`@RequireDeviceClass`).
Device class is enforced **server-side** from the registered device, never the User-Agent.

**Sportradar key location:** `backend/.env` →
`SPORTRADAR_API_KEY=...`, `SPORTRADAR_ENABLED=true`, `SPORTRADAR_BASE_URL=...`.
When disabled/empty, sync is skipped and read endpoints serve local cache (empty on fresh DB).
The app boots fine with zero external services (SQLite + in-memory cache + Sportradar off).

---

## 6. Key implementation notes

- **Pairing/scoring rules** (both client `courtHub` and backend): 6 courts, 6-digit codes unique
  across courts, 10-min idle regeneration, **immediate regeneration after match end**, codes frozen
  while LIVE; games to 11 win-by-2, best-of-5; court-scoped tokens; sweeper every 30s.
- **Frontend courtHub** (`src/pairing/courtHub.ts`) is a faithful in-browser simulation synced
  across tabs via BroadcastChannel + localStorage. The Courts/TV/Controller pages use it — they are
  NOT yet wired to the backend (the backend equivalents exist and are tested).
- **Device guard** (frontend) is UX-only/bypassable by design; real enforcement is the backend guard.
  Dev override: visit `?as=tv` or `?as=mobile` (persisted in localStorage) to bypass on desktop.
- **Tailwind v4** via `@tailwindcss/vite`; tokens defined in `src/assets/main.css` `@theme` block
  (`--color-brand-*`, `--color-court`, `--color-accent`).
- Toolchain is bleeding-edge (Vite 8 / rolldown-oxc, TypeScript ~6, ESLint 10). Occasional odd
  parser errors trace back to truncated files (gotcha #4), not real syntax errors — re-check the file.

---

## 7. Pending / suggested next steps (NOT done yet)

1. **Wire courtHub → backend.** Replace `src/pairing/courtHub.ts` internals with REST (`/pairing`,
   `/courts/:id/*`) + Socket.IO client (`court:{id}` rooms). Composable surface (`useCourtHub`) and
   the Vue components can stay the same. This makes courts/TV/controller fully server-driven.
2. **Real Sportradar mapping.** `backend/src/sportradar/sportradar.service.ts` normalizers
   (`syncSchedule/syncLiveSummaries/syncRankings`) are **defensive guesses** at the squash API shape.
   Verify against the actual plan's JSON and fix field paths. Then flip `meta.source` to `sportradar`.
3. **Production hardening.** Postgres + migrations (instead of `synchronize`), strong `JWT_SECRET`,
   real device approval flow (disable dev auto-approve), Socket.IO Redis adapter for multi-instance.
4. **Optional UI:** the `TabBar.vue` component is unused; either use it (e.g. Men/Women toggle on the
   players page) or delete it.

---

## 8. State of verification (as of handoff)

- Frontend: `npm run build` exit 0, oxlint clean, eslint clean.
- Backend: `tsc` build exit 0; smoke test 18/18 pass; CORS confirmed for `http://localhost:5173`;
  `/content/*` endpoints return correct shapes (incl. country flags).
- Everything committed to files in the user's folder. `node_modules` for backend is intentionally
  absent (install locally per gotcha #1).

---

## 9. Update (Sportradar v2 + no-seed) — latest session

- **Sportradar is now v2 end-to-end.** `SPORTRADAR_BASE_URL=https://api.sportradar.com/squash/trial/v2/en`,
  client sends `x-api-key` header + `api_key` query. Endpoints used (General Sport API v2):
  `/schedules/{date}/summaries.json`, `/schedules/live/summaries.json`,
  `/seasons/{seasonId}/standings.json`, `/seasons/{seasonId}/competitors.json`,
  `/sport_events/{id}/summary.json`, `/rankings.json`.
  New env: `SPORTRADAR_SEASON_ID`, `SPORTRADAR_COMPETITION_ID` (standings/players need a season).
- **All seed/mock data deleted.** `backend/src/content/content.data.ts` is gone. `ContentService`
  now delegates to `SportradarService` read-models (entities: SrEvent, SrRanking, SrStanding,
  SrCompetitor). `/content/*` returns **only data synced from the API** — empty without a key.
  `/content/meta.source` = `'sportradar'` (enabled) or `'empty'`.
- **Frontend** unchanged in wiring (already API-driven). `DataSourceBadge` now shows
  `Live · Sportradar v2` / `API · no data (add key)` / `API offline`.
- **Verified:** backend `tsc` exit 0; 18/18 device-pairing smoke pass; `/content/*` return empty
  (count 0) keyless with `source=empty`, `/sportradar/status` reports `version v2`. Frontend build +
  oxlint + eslint clean.
- **To get real data:** set `SPORTRADAR_API_KEY`, `SPORTRADAR_ENABLED=true`, `SPORTRADAR_SEASON_ID`
  in `backend/.env`, then the sync scheduler populates the read-models and the views fill in.
- **Caveat:** Sportradar Squash v2 covers pro/PSA squash, not the ESF U15/U17 youth championship,
  and the season-competitor → "Sweden men/women" + 8/8 bracket mapping is best-effort. Verify field
  paths against your actual plan's JSON (`sportradar.service.ts` upsert/mapper methods).
- **Still pending:** wiring courts/TV/controller (`src/pairing/courtHub.ts`) to the backend
  pairing/scoring endpoints + Socket.IO (currently still the in-browser simulation).

---

## 10. Update — monorepo restructure (latest)

Project is now split into sibling folders:

- `frontend/` — everything that used to be at repo root (Vue app: `src/`, `package.json`,
  `vite.config.ts`, `index.html`, tsconfig/eslint configs, `.env`). Build/lint from here:
  `cd frontend && npm install && npm run build` (oxlint/eslint as before). The `@` alias still
  points to `frontend/src`.
- `backend/` — unchanged (NestJS API).
- Root keeps `docs/`, `README.md` (new monorepo overview), `README_DATA.md`, `HANDOFF.md`, `.git`.

Note: `node_modules` is **not** committed in either folder (gitignored). Run `npm install` in
each folder. Earlier handoff paths that said `src/...` are now `frontend/src/...`.
