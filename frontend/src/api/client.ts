/**
 * Tiny typed API client. All app data comes from the backend API.
 *
 * Base URL resolution:
 *  - If VITE_API_BASE_URL is set, that single URL is used.
 *  - Otherwise it tries the LAN IP first (192.168.1.123:3000) and falls back to
 *    localhost:3000 if the first can't be reached. The first base that responds
 *    is cached so later requests skip the probing.
 */
const ENV_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined

const API_BASES: string[] = ENV_BASE
  ? [ENV_BASE]
  : ['http://192.168.1.5:3000/api/v1', 'http://localhost:3000/api/v1']

// Remembered working base (set after the first successful request).
let activeBase: string | null = null

export const API_BASE: string = API_BASES[0] ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  // Try the cached base first, then the remaining candidates in order.
  const bases = activeBase
    ? [activeBase, ...API_BASES.filter((b) => b !== activeBase)]
    : API_BASES

  let lastNetworkError = false
  for (const base of bases) {
    let res: Response
    try {
      res = await fetch(`${base}${path}`, { signal, headers: { accept: 'application/json' } })
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      lastNetworkError = true
      continue // this base is unreachable — try the next one
    }
    activeBase = base // reachable: remember it for next time
    if (!res.ok) throw new ApiError(`Request failed (${res.status}) for ${path}`, res.status)
    return (await res.json()) as T
  }

  void lastNetworkError
  throw new ApiError(
    `Cannot reach the API at ${API_BASES.join(' or ')}. Is the backend running?`,
  )
}
