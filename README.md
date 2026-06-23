# Squash Club Malmö

Monorepo for the ESF U15 & U17 squash championship platform: a Vue frontend and a
NestJS API backend, in separate folders.

```
club-malmo-app/
├── frontend/   # Vue 3 + Vite + TypeScript + Tailwind v4 — the UI
├── backend/    # NestJS + TypeORM (SQLite) — REST + WebSocket API
├── docs/       # Technical specifications
├── README.md
├── README_DATA.md
└── HANDOFF.md  # Working notes / sandbox gotchas for contributors
```

## What each part does

- **frontend/** — championship views (matches, standings, players), the courts /
  TV scoreboard / phone-controller pairing UI, and a device-aware router guard.
  All data is fetched from the backend API (no bundled mock data). A badge shows the
  live data source.
- **backend/** — `/content/*` (championship read-models sourced from **Sportradar
  Squash API v2**), `/devices` + `/auth` (device enrolment, session JWT, RBAC),
  `/courts` + `/pairing` + scoring, `/sportradar/*`, and a Socket.IO gateway. SQLite
  by default; Redis optional.

## Run it (two terminals)

```bash
# 1) Backend  → http://localhost:3000/api/v1
cd backend
cp .env.example .env          # add SPORTRADAR_API_KEY for real data (optional)
npm install
npm run start:dev

# 2) Frontend → http://localhost:5173
cd frontend
npm install
npm run dev
```

The frontend reads the API base URL from `frontend/.env` (`VITE_API_BASE_URL`,
default `http://localhost:3000/api/v1`).

## Data source

Championship data comes only from the API. Without a Sportradar key the content
endpoints return empty (the badge shows “API · no data (add key)”). Set
`SPORTRADAR_API_KEY`, `SPORTRADAR_ENABLED=true`, and `SPORTRADAR_SEASON_ID` in
`backend/.env` to populate it from Sportradar Squash **v2**. See `backend/README.md`.

## Docs

- `docs/COURT_PAIRING_SPEC.md` — court pairing & scoring design
- `docs/SPORTRADAR_AND_DEVICE_ACCESS_SPEC.md` — Sportradar integration + device access control
- `HANDOFF.md` — contributor notes and sandbox build tips
