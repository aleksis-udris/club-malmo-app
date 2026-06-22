/* Championship dataset served by the API (ported from the former frontend mock).
 * In production a sync job would populate these from Sportradar / the club's
 * source of record; the shapes match the frontend's read models. */

export interface Country { code: string; name: string; flag: string }
export type MatchStatus = 'finished' | 'live' | 'upcoming'
export interface Match {
  id: string; time: string; draw: string
  home: Country; away: Country; score: string; court: string; status: MatchStatus
}
export interface MatchDay { date: string; label: string; matches: Match[] }
export interface StandingRow {
  position: number; country: Country
  played: number; won: number; draws: number; lost: number
  rubbers: string; games: string; points: number
}
export interface OverallStatRow {
  type: string; played: number; rubbers: string; games: string; points: number; walkovers: number
}
export interface Player { id: string; name: string; played: number }

const COUNTRIES: Record<string, Country> = {
  SWE: { code: 'SWE', name: 'Sweden', flag: '🇸🇪' },
  ENG: { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  GER: { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  FRA: { code: 'FRA', name: 'France', flag: '🇫🇷' },
  ESP: { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  NED: { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  SUI: { code: 'SUI', name: 'Switzerland', flag: '🇨🇭' },
  BEL: { code: 'BEL', name: 'Belgium', flag: '🇧🇪' },
  ITA: { code: 'ITA', name: 'Italy', flag: '🇮🇹' },
  AUT: { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  WAL: { code: 'WAL', name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  SCO: { code: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  FIN: { code: 'FIN', name: 'Finland', flag: '🇫🇮' },
  NOR: { code: 'NOR', name: 'Norway', flag: '🇳🇴' },
  DEN: { code: 'DEN', name: 'Denmark', flag: '🇩🇰' },
  POL: { code: 'POL', name: 'Poland', flag: '🇵🇱' },
}
const c = (code: string): Country => COUNTRIES[code] ?? { code, name: code, flag: '🏳️' }

export const championship = {
  title: 'ESF European Mixed Team U15 & U17 Squash Championships',
  year: 2026,
  host: 'Squash Club Malmö, Sweden',
  venue: 'The Squash Club of Malmö',
  startDate: '2026-06-18',
  endDate: '2026-06-24',
}

export const matchDays: MatchDay[] = [
  { date: '2026-06-22', label: 'Today', matches: [
    { id: 'm-t1', time: '09:00', draw: 'U15 Open A', home: c('SWE'), away: c('GER'), score: '3-1', court: 'Court 1', status: 'finished' },
    { id: 'm-t2', time: '09:45', draw: 'U15 Open B', home: c('ENG'), away: c('FRA'), score: '2-3', court: 'Court 2', status: 'finished' },
    { id: 'm-t3', time: '10:30', draw: 'U17 Open A', home: c('NED'), away: c('ESP'), score: '2-1', court: 'Court 1', status: 'live' },
    { id: 'm-t4', time: '11:15', draw: 'U17 Open B', home: c('SUI'), away: c('BEL'), score: '', court: 'Court 3', status: 'upcoming' },
    { id: 'm-t5', time: '12:00', draw: 'U15 Open A', home: c('ITA'), away: c('AUT'), score: '', court: 'Court 2', status: 'upcoming' },
    { id: 'm-t6', time: '12:45', draw: 'U17 Open A', home: c('SWE'), away: c('WAL'), score: '', court: 'Court 1', status: 'upcoming' },
  ]},
  { date: '2026-06-21', label: 'Yesterday', matches: [
    { id: 'm-y1', time: '09:00', draw: 'U15 Open A', home: c('SWE'), away: c('FRA'), score: '3-0', court: 'Court 1', status: 'finished' },
    { id: 'm-y2', time: '10:00', draw: 'U17 Open B', home: c('GER'), away: c('NED'), score: '1-3', court: 'Court 2', status: 'finished' },
    { id: 'm-y3', time: '11:00', draw: 'U15 Open B', home: c('ESP'), away: c('BEL'), score: '3-2', court: 'Court 3', status: 'finished' },
    { id: 'm-y4', time: '12:00', draw: 'U17 Open A', home: c('ENG'), away: c('SUI'), score: '2-3', court: 'Court 1', status: 'finished' },
    { id: 'm-y5', time: '13:00', draw: 'U15 Open A', home: c('ITA'), away: c('SCO'), score: '3-1', court: 'Court 2', status: 'finished' },
  ]},
  { date: '2026-06-20', label: 'Sat 20 Jun', matches: [
    { id: 'm-s1', time: '09:30', draw: 'U17 Open A', home: c('SWE'), away: c('NED'), score: '2-3', court: 'Court 1', status: 'finished' },
    { id: 'm-s2', time: '10:30', draw: 'U15 Open B', home: c('FRA'), away: c('GER'), score: '3-1', court: 'Court 2', status: 'finished' },
    { id: 'm-s3', time: '11:30', draw: 'U17 Open B', home: c('ESP'), away: c('ENG'), score: '0-3', court: 'Court 3', status: 'finished' },
    { id: 'm-s4', time: '12:30', draw: 'U15 Open A', home: c('BEL'), away: c('ITA'), score: '1-3', court: 'Court 1', status: 'finished' },
  ]},
  { date: '2026-06-19', label: 'Fri 19 Jun', matches: [
    { id: 'm-f1', time: '10:00', draw: 'U15 Open A', home: c('SWE'), away: c('ESP'), score: '3-2', court: 'Court 1', status: 'finished' },
    { id: 'm-f2', time: '11:00', draw: 'U17 Open A', home: c('GER'), away: c('FRA'), score: '3-0', court: 'Court 2', status: 'finished' },
    { id: 'm-f3', time: '12:00', draw: 'U17 Open B', home: c('NED'), away: c('SUI'), score: '2-3', court: 'Court 3', status: 'finished' },
  ]},
]

export const standingsTop: StandingRow[] = [
  { position: 1, country: c('ENG'), played: 6, won: 6, draws: 0, lost: 0, rubbers: '26-4', games: '78-22', points: 18 },
  { position: 2, country: c('NED'), played: 6, won: 5, draws: 0, lost: 1, rubbers: '22-8', games: '70-31', points: 15 },
  { position: 3, country: c('SWE'), played: 6, won: 4, draws: 1, lost: 1, rubbers: '20-10', games: '64-38', points: 13 },
  { position: 4, country: c('GER'), played: 6, won: 4, draws: 0, lost: 2, rubbers: '18-12', games: '58-44', points: 12 },
  { position: 5, country: c('FRA'), played: 6, won: 3, draws: 0, lost: 3, rubbers: '15-15', games: '50-50', points: 9 },
  { position: 6, country: c('ESP'), played: 6, won: 2, draws: 1, lost: 3, rubbers: '13-17', games: '46-54', points: 7 },
  { position: 7, country: c('SUI'), played: 6, won: 1, draws: 0, lost: 5, rubbers: '9-21', games: '34-66', points: 3 },
  { position: 8, country: c('BEL'), played: 6, won: 0, draws: 0, lost: 6, rubbers: '5-25', games: '22-78', points: 0 },
]
export const standingsBottom: StandingRow[] = [
  { position: 9, country: c('ITA'), played: 6, won: 5, draws: 0, lost: 1, rubbers: '21-9', games: '66-34', points: 15 },
  { position: 10, country: c('AUT'), played: 6, won: 4, draws: 1, lost: 1, rubbers: '19-11', games: '60-40', points: 13 },
  { position: 11, country: c('WAL'), played: 6, won: 4, draws: 0, lost: 2, rubbers: '17-13', games: '55-45', points: 12 },
  { position: 12, country: c('SCO'), played: 6, won: 3, draws: 0, lost: 3, rubbers: '14-16', games: '48-52', points: 9 },
  { position: 13, country: c('FIN'), played: 6, won: 2, draws: 1, lost: 3, rubbers: '12-18', games: '44-56', points: 7 },
  { position: 14, country: c('NOR'), played: 6, won: 2, draws: 0, lost: 4, rubbers: '11-19', games: '40-60', points: 6 },
  { position: 15, country: c('DEN'), played: 6, won: 1, draws: 0, lost: 5, rubbers: '8-22', games: '32-68', points: 3 },
  { position: 16, country: c('POL'), played: 6, won: 0, draws: 1, lost: 5, rubbers: '6-24', games: '28-72', points: 1 },
]
export const latestTop: Match[] = [
  { id: 'l-1', time: '14:00', draw: 'U17 Open', home: c('ENG'), away: c('NED'), score: '3-2', court: 'Court 1', status: 'finished' },
  { id: 'l-2', time: '13:15', draw: 'U17 Open', home: c('SWE'), away: c('GER'), score: '3-1', court: 'Court 2', status: 'finished' },
  { id: 'l-3', time: '12:30', draw: 'U17 Open', home: c('FRA'), away: c('ESP'), score: '2-3', court: 'Court 1', status: 'finished' },
  { id: 'l-4', time: '11:45', draw: 'U17 Open', home: c('SUI'), away: c('BEL'), score: '3-0', court: 'Court 3', status: 'finished' },
  { id: 'l-5', time: '11:00', draw: 'U15 Open', home: c('ENG'), away: c('SWE'), score: '2-3', court: 'Court 1', status: 'finished' },
  { id: 'l-6', time: '10:15', draw: 'U15 Open', home: c('NED'), away: c('FRA'), score: '3-1', court: 'Court 2', status: 'finished' },
]
export const latestBottom: Match[] = [
  { id: 'lb-1', time: '14:00', draw: 'U17 Plate', home: c('ITA'), away: c('AUT'), score: '3-2', court: 'Court 4', status: 'finished' },
  { id: 'lb-2', time: '13:15', draw: 'U17 Plate', home: c('WAL'), away: c('SCO'), score: '3-1', court: 'Court 5', status: 'finished' },
  { id: 'lb-3', time: '12:30', draw: 'U17 Plate', home: c('FIN'), away: c('NOR'), score: '2-3', court: 'Court 4', status: 'finished' },
  { id: 'lb-4', time: '11:45', draw: 'U17 Plate', home: c('DEN'), away: c('POL'), score: '3-0', court: 'Court 6', status: 'finished' },
  { id: 'lb-5', time: '11:00', draw: 'U15 Plate', home: c('ITA'), away: c('WAL'), score: '1-3', court: 'Court 4', status: 'finished' },
  { id: 'lb-6', time: '10:15', draw: 'U15 Plate', home: c('AUT'), away: c('FIN'), score: '3-2', court: 'Court 5', status: 'finished' },
]
export const swedenGroupStandings: StandingRow[] = [
  { position: 1, country: c('SWE'), played: 7, won: 5, draws: 1, lost: 1, rubbers: '23-12', games: '72-44', points: 16 },
  { position: 2, country: c('GER'), played: 7, won: 5, draws: 0, lost: 2, rubbers: '21-14', games: '68-48', points: 15 },
  { position: 3, country: c('FRA'), played: 7, won: 4, draws: 0, lost: 3, rubbers: '18-17', games: '60-56', points: 12 },
  { position: 4, country: c('ESP'), played: 7, won: 2, draws: 1, lost: 4, rubbers: '14-21', games: '50-66', points: 7 },
  { position: 5, country: c('SUI'), played: 7, won: 1, draws: 0, lost: 6, rubbers: '9-26', games: '38-78', points: 3 },
]
export const swedenOverallStats: OverallStatRow[] = [
  { type: 'U15 Boys', played: 7, rubbers: '11-3', games: '34-16', points: 38, walkovers: 0 },
  { type: 'U15 Girls', played: 7, rubbers: '9-5', games: '30-22', points: 30, walkovers: 1 },
  { type: 'U17 Boys', played: 7, rubbers: '12-2', games: '36-14', points: 42, walkovers: 0 },
  { type: 'U17 Girls', played: 7, rubbers: '8-6', games: '28-24', points: 26, walkovers: 1 },
  { type: 'Total', played: 7, rubbers: '40-16', games: '128-76', points: 136, walkovers: 2 },
]
export const swedenMen: Player[] = [
  { id: 'm-1', name: 'Erik Lindqvist', played: 7 },
  { id: 'm-2', name: 'Oscar Bergström', played: 6 },
  { id: 'm-3', name: 'Liam Andersson', played: 7 },
  { id: 'm-4', name: 'Hugo Karlsson', played: 5 },
  { id: 'm-5', name: 'Viktor Nilsson', played: 4 },
  { id: 'm-6', name: 'Axel Johansson', played: 3 },
]
export const swedenWomen: Player[] = [
  { id: 'w-1', name: 'Maja Lundgren', played: 7 },
  { id: 'w-2', name: 'Elsa Holm', played: 6 },
  { id: 'w-3', name: 'Alva Sandberg', played: 7 },
  { id: 'w-4', name: 'Wilma Ek', played: 5 },
  { id: 'w-5', name: 'Ebba Forsberg', played: 4 },
]
