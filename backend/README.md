# Club Malmö — Backend (NestJS)

Production-ready backend for the squash court platform. Implements the two specs in
`../docs/`: **court pairing & scoring** and **Sportradar integration + device access control**.

- **Framework:** NestJS (TypeScript)
- **Database:** **SQLite** (TypeORM `sqljs` driver — pure JS, no native build). A single
  `data/squash.sqlite` file. Swappable to Postgres by changing `database.module.ts`.
- **Cache / rate-limit:** Redis when `REDIS_URL` is set, otherwise an in-process fallback.
- **Real-time:** Socket.IO gateway (`court:{id}` rooms).
- **Boots with zero external services** (SQLite + in-memory cache + Sportradar disabled).

## Quick start

```bash
cd backend
cp .env.example .env        # then edit values (see below)
npm install
npm run start:dev           # http://localhost:3000/api/v1
# or production:
npm run build && npm run start:prod
# or Docker:
docker compose up --build
```

## Where do I put my Sportradar API token?

In **`backend/.env`**:

```ini
SPORTRADAR_API_KEY=your_token_here
SPORTRADAR_ENABLED=true
SPORTRADAR_BASE_URL=https://api.sportradar.com/squash/trial/v1/en   # match your plan
```

The key is read only on the server (`SportradarClient`) — it is never sent to the browser.
When `SPORTRADAR_ENABLED=false` or the key is empty, sync is skipped and the read endpoints
serve whatever is cached locally (empty on a fresh DB). The app runs fine without a key.

## Key endpoints (prefix `/api/v1`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | — | Liveness |
| POST | `/devices/enroll` | — (TV uses provisioning key) | Register a device, get a registration token |
| POST | `/auth/session` | registration token | Exchange for a short-lived session JWT |
| GET | `/courts` · `/courts/:id/state` | — | Read models (pairing code, status, board) |
| GET | `/scoreboard/:id` | JWT · **TV only** | Scoreboard read (device-class enforced) |
| POST | `/pairing/claim` | JWT · **MOBILE only** | Claim a court by 6-digit code → court token |
| POST | `/courts/:id/match` | JWT · MOBILE + court token | Configure a match |
| POST | `/courts/:id/score` | JWT · MOBILE + court token | Apply a scoring command (idempotent `seq`) |
| POST | `/courts/:id/reset` | JWT · ADMIN | Reset a court |
| GET | `/sportradar/status` · `/live` · `/schedule` · `/rankings` | — | Cached sports read models |

WebSocket: connect to the server, emit `court:join {courtId}`; receive `court:state`,
`pairing:code`, `score:applied`.

## What the smoke test verifies (`node scripts/smoke.mjs`)

Enrolment → session JWT → 6-digit code → claim → COURT_BUSY on duplicate → match config →
scoring to a finish → **new code generated at match end** → token revoked → TV can read the
scoreboard, MOBILE cannot (403) → TV cannot open the controller (403) → unauthenticated 401 →
Sportradar disabled status. (18 assertions, all passing.)

## Mapping to the specs

- Pairing codes, 10-min idle regeneration, post-match regeneration, collision-free generation,
  sessions/sweeper → `pairing/` (+ `courts/`, `matches/`). See `../docs/COURT_PAIRING_SPEC.md`.
- Device enrolment, session JWT, `RolesGuard` + `DeviceClassGuard`, Sportradar client
  (ETag/token-bucket/retry/breaker), tiered sync scheduler, local mirror → `devices/`,
  `common/guards/`, `sportradar/`. See `../docs/SPORTRADAR_AND_DEVICE_ACCESS_SPEC.md`.

## Production notes

- Set a strong `JWT_SECRET` and `DEVICE_PROVISIONING_KEY`.
- For multi-instance, set `REDIS_URL` (shared cache + rate-limit) and add the Socket.IO Redis
  adapter; switch `database.module.ts` to Postgres and use migrations instead of `synchronize`.
- Auto-approval of devices is enabled in non-production for convenience; in production only the
  provisioning key (TVs) or an admin approval issues a registration token.
