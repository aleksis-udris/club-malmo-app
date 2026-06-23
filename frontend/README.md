# Squash Club Malmö — ESF Championship App (Frontend)

A frontend-only Vue 3 application for the **ESF European Mixed Team U15 & U17 Squash
Championship**. It presents match overviews, championship standings, club statistics and
players, plus a live **TV court scoreboard** driven in real time by a **phone controller** —
all without any backend (data is mock/static; live sync uses the browser's `BroadcastChannel`
+ `localStorage`).

## Tech stack

- **Vue 3** (`<script setup>`, Composition API) + **TypeScript**
- **Vue Router** (lazy-loaded routes)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Vite** build tooling
- No backend, API, or database — mock data only.

## Setup & run

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5173)
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run lint       # oxlint + eslint
```

## Pages (mapped to the spec views)

| Route          | View                          | Spec view                    | Contents |
|----------------|-------------------------------|------------------------------|----------|
| `/`            | `HomeView`                    | —                            | Hero, key stats, quick links, today's matches & top standings |
| `/matches`     | `MatchView`                   | **MatchView**                | One table per day: today + 3 previous days (Time, Draw, Countries, Score, Court) |
| `/standings`   | `StandingChampionshipView`    | **StandingChampionshipView** | ESF standings positions 1-8 + latest matches |
| `/latest`      | `LatestChampionshipView`      | **LatestChampionshipView**   | Latest matches + standings positions 9-16 |
| `/sweden`      | `SwedenView`                  | **SwedenView**               | Men/women player counts, group standings, 7-match overall statistics |
| `/players`     | `SwedenPlayersView`           | **SwedenPlayersView**        | Sweden men's & women's squads (Player, Played) |
| `/tv`          | `TvScoreboardView`            | **TV view (court)**          | Fullscreen scoreboard: score, games, serving, fouls/strokes |
| `/controller`  | `ControllerView`              | **Phone view**               | Touch controls that update the TV view live |

## Live TV <-> Controller sync (no backend)

Open `/tv` on one screen/tab and `/controller` on another (e.g. a phone). Every action on the
controller — points, strokes, serve change, next game, match setup — is broadcast to the TV
view instantly via `BroadcastChannel`, with a `localStorage` fallback for cross-tab sync and
to restore the latest state when the TV view is (re)opened. Game/match logic (11-point games,
win-by-2, best-of-5) lives in `src/composables/useScoreboard.ts`.

## Project structure

```
src/
├── assets/main.css              # Tailwind import + brand design tokens (@theme)
├── components/                  # Reusable, presentational components
│   ├── AppFooter.vue            CountryFlag.vue        HeroHeader.vue
│   ├── LiveScoreButton.vue      MatchTable.vue         SectionCard.vue
│   ├── SideBar.vue              StandingsTable.vue     StatCard.vue
│   ├── StateBlock.vue           # Unified loading / empty / error states
│   └── TabBar.vue
├── composables/
│   ├── useMockFetch.ts          # Simulated async fetch -> loading/error/empty UI
│   └── useScoreboard.ts         # Shared live scoreboard (BroadcastChannel + storage)
├── data/                        # Static mock data
│   ├── championship.ts  countries.ts  matches.ts  sweden.ts
├── router/index.ts              # Lazy-loaded routes; /tv is fullscreen
├── types/index.ts               # Shared domain types
├── views/                       # One component per page/route
│   ├── HomeView.vue                 MatchView.vue
│   ├── StandingChampionshipView.vue LatestChampionshipView.vue
│   ├── SwedenView.vue               SwedenPlayersView.vue
│   ├── TvScoreboardView.vue         ControllerView.vue
├── App.vue                      # Shell: sidebar + router-view (fullscreen for /tv)
└── main.ts
```

## Notes

- **Responsive**: sidebar collapses into a top bar with a hamburger on mobile/tablet; tables
  scroll horizontally on narrow screens; layouts use responsive grids.
- **States**: data views simulate a fetch and render dedicated **loading**, **empty** and
  **error** (with retry) states via `StateBlock` + `useMockFetch`.
- **No backend**: all data is static; the only "live" behaviour is client-side scoreboard
  sync between browser tabs/devices on the same origin.
