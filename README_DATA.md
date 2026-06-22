# Running the app with live API data

The frontend no longer bundles any mock data — every data view (Home, Matches,
Standings, Latest, Club Sweden, Players) now fetches from the backend API. A badge
in the bottom-right corner shows the current source:

- **Seed data · API** (amber) — data is served by the backend from its seeded dataset.
- **Live · Sportradar** (green) — backend has `SPORTRADAR_ENABLED=true` + a key.
- **API offline** (red) — the backend isn't reachable.

## Start both

```bash
# 1) Backend (provides the data)
cd backend
cp .env.example .env        # optional: add SPORTRADAR_API_KEY
npm install
npm run start:dev           # http://localhost:3000/api/v1

# 2) Frontend (in another terminal)
cd ..
npm install
npm run dev                 # http://localhost:5173
```

The frontend reads the API base from `VITE_API_BASE_URL` (see `.env.example`),
defaulting to `http://localhost:3000/api/v1`.

## What still uses the in-browser simulation

The Courts / TV scoreboard / Controller pairing flow runs on the client-side
`courtHub` (live scoring demo). The real backend equivalents exist under
`backend/src/{courts,pairing,matches}` and can be wired in the same way as the
content endpoints if you want those fully server-driven too.
