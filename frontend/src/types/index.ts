/**
 * Shared domain types for the ESF U15 & U17 Squash Championship app.
 * All data is mock/static — there is no backend.
 */

export interface Country {
  /** ISO-ish short code, e.g. "SWE" */
  code: string
  name: string
  /** Emoji flag for lightweight, dependency-free rendering */
  flag: string
}

export type MatchStatus = 'finished' | 'live' | 'upcoming'

export interface Match {
  id: string
  time: string
  /** Draw / pool label, e.g. "U15 Open A" */
  draw: string
  home: Country
  away: Country
  /** Rubber score, e.g. "3-1". Empty for upcoming matches. */
  score: string
  court: string
  status: MatchStatus
}

/** One day's worth of matches (used by MatchView). */
export interface MatchDay {
  /** ISO date string */
  date: string
  label: string
  matches: Match[]
}

/** A row in a championship / group standings table. */
export interface StandingRow {
  position: number
  country: Country
  played: number
  won: number
  draws: number
  lost: number
  /** Rubbers won-lost, e.g. "14-6" */
  rubbers: string
  /** Games won-lost, e.g. "42-21" */
  games: string
  points: number
}

/** Overall team statistics block (SwedenView, 7 matches). */
export interface OverallStatRow {
  type: string
  played: number
  rubbers: string
  games: string
  points: number
  walkovers: number
}

export interface Player {
  id: string
  name: string
  played: number
  /** Player nationality (from Sportradar competitor) */
  country?: Country
  /** 'male' | 'female' when provided by the feed */
  gender?: string | null
  /** Match stats derived from synced results */
  won?: number
  lost?: number
  /** Games won-lost across matches, e.g. "42-31" */
  games?: string
  /** Win percentage (0-100) */
  winPct?: number
  /** Global rank by wins (null if no completed matches) */
  rank?: number | null
}

/** Live scoreboard state shared between the TV and controller views. */
export interface ScoreboardState {
  home: Country
  away: Country
  court: string
  draw: string
  /** Current game rubber number (1..5) */
  rubber: number
  /** Points in the current game */
  homePoints: number
  awayPoints: number
  /** Games (rubbers) won so far */
  homeGames: number
  awayGames: number
  /** Accumulated fouls / lets-strokes for the current game */
  homeFouls: number
  awayFouls: number
  /** Who is serving */
  serving: 'home' | 'away'
  /** Match clock running */
  running: boolean
  updatedAt: number
}
