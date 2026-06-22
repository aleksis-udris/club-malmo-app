/**
 * Tiny typed API client. All app data now comes from the backend API
 * (no more bundled mock data). Configure the base URL via VITE_API_BASE_URL.
 */
export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { signal, headers: { accept: 'application/json' } })
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE}. Is the backend running?`,
    )
  }
  if (!res.ok) throw new ApiError(`Request failed (${res.status}) for ${path}`, res.status)
  return (await res.json()) as T
}
