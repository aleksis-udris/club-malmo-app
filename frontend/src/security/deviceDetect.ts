/**
 * Frontend device-class detection (UX gate only).
 *
 * IMPORTANT: per docs/SPORTRADAR_AND_DEVICE_ACCESS_SPEC.md (§B1/B6/B8), client-side
 * signals (User-Agent, screen size) are spoofable and are NOT a security boundary.
 * This module improves UX by steering devices to the right route; the real
 * enforcement is the server-side device-class + role + token guard.
 *
 * A dev/demo override is supported so the app remains usable on a desktop browser.
 * In production the override is compiled out (import.meta.env.PROD).
 */

export type DeviceClass = 'MOBILE' | 'TABLET' | 'TV' | 'DESKTOP'

const OVERRIDE_KEY = 'scm:deviceClassOverride'

const TV_UA =
  /(SMART-?TV|SmartTV|Tizen|Web0S|webOS|AppleTV|GoogleTV|Android ?TV|BRAVIA|AFT[A-Za-z]*|HbbTV|NetCast|DTV|CrKey|VIDAA|Roku)/i
const MOBILE_UA = /(iPhone|iPod|Android.*Mobile|\bMobile\b|Windows Phone)/i

/** Heuristic classification from UA + screen + pointer capabilities. */
export function detectDeviceClass(): DeviceClass {
  if (typeof navigator === 'undefined' || typeof screen === 'undefined') return 'DESKTOP'

  const ua = navigator.userAgent || ''
  const maxDim = Math.max(screen.width, screen.height)
  const minDim = Math.min(screen.width, screen.height)
  const touch = (navigator.maxTouchPoints ?? 0) > 0
  const coarse =
    typeof matchMedia === 'function' &&
    (matchMedia('(pointer: coarse)').matches || matchMedia('(pointer: none)').matches)

  if (TV_UA.test(ua) || (maxDim >= 1280 && !touch && coarse)) return 'TV'
  if (MOBILE_UA.test(ua) && touch && minDim < 820) return 'MOBILE'
  if (touch && minDim < 1280) return 'TABLET'
  return 'DESKTOP'
}

/** Dev/demo override (query `?as=tv|mobile|tablet|desktop` or persisted choice). */
export function getDeviceOverride(): DeviceClass | null {
  if (import.meta.env.PROD) return null
  try {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('as')?.toUpperCase()
    if (q && ['MOBILE', 'TABLET', 'TV', 'DESKTOP'].includes(q)) {
      localStorage.setItem(OVERRIDE_KEY, q)
    }
    const stored = localStorage.getItem(OVERRIDE_KEY) as DeviceClass | null
    return stored && ['MOBILE', 'TABLET', 'TV', 'DESKTOP'].includes(stored) ? stored : null
  } catch {
    return null
  }
}

export function setDeviceOverride(cls: DeviceClass | null) {
  try {
    if (cls) localStorage.setItem(OVERRIDE_KEY, cls)
    else localStorage.removeItem(OVERRIDE_KEY)
  } catch {
    /* ignore */
  }
}

/** The class the guards act on: explicit override (dev) wins, else detection. */
export function getEffectiveDeviceClass(): DeviceClass {
  return getDeviceOverride() ?? detectDeviceClass()
}
