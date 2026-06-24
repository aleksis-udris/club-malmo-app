/**
 * Client-side pairing domain types.
 *
 * These mirror the backend contracts in docs/COURT_PAIRING_SPEC.md. The in-browser
 * courtHub is an authoritative simulation of that backend so the full pairing flow
 * is demonstrable without a server.
 */

export type CourtStatus = 'OFFLINE' | 'IDLE' | 'PAIRED' | 'LIVE' | 'FINISHED'

export interface Team {
  name: string
  flag: string
}

export interface MatchBoard {
  home: Team
  away: Team
  draw: string
  rubber: number
  homePoints: number
  awayPoints: number
  homeGames: number
  awayGames: number
  homeFouls: number
  awayFouls: number
  serving: 'home' | 'away'
  winner: 'home' | 'away' | null
  /** Epoch ms when the match finished (null while unfinished). Used to time-box the winner banner. */
  endedAt: number | null
}

export interface CourtState {
  id: number
  name: string
  status: CourtStatus
  /** Active 6-digit pairing code (unique across all courts). */
  code: string
  codeGeneratedAt: number
  codeExpiresAt: number
  /** Token of the single active controller session, or null. */
  controllerToken: string | null
  controllerLabel: string | null
  controllerExpiresAt: number | null
  board: MatchBoard
  updatedAt: number
}

export type ClaimError =
  | 'CODE_NOT_FOUND'
  | 'CODE_EXPIRED'
  | 'COURT_BUSY'
  | 'COURT_LIVE_LOCKED'

export interface ClaimResult {
  ok: boolean
  error?: ClaimError
  token?: string
  courtId?: number
}

export const CLAIM_ERROR_MESSAGE: Record<ClaimError, string> = {
  CODE_NOT_FOUND: 'No court is using that code. Check the code on the TV and try again.',
  CODE_EXPIRED: 'That code has expired. Read the new code shown on the TV.',
  COURT_BUSY: 'This court already has an active controller.',
  COURT_LIVE_LOCKED: 'This court is mid-match and locked to its controller.',
}
