// Post-build CSS fixup for old smart-TV browsers (Samsung Tizen / LG webOS).
//
// Tailwind v4 emits very modern CSS that old Chromium engines (~56-69) can't use:
//   - everything wrapped in `@layer` (unknown at-rule -> whole block ignored)
//   - logical properties: padding-inline / margin-inline / inset-inline (Chrome 87+)
//   - oklch() colours and color-mix() (Chrome 111+)
//   - CSS nesting (Chrome 112+)
//
// This script (run after `vite build`):
//   1) unwraps `@layer` so the rules apply at all, then
//   2) runs LightningCSS targeting old Chrome to downlevel logical properties to
//      left/right, oklch -> rgb, color-mix -> rgb, and flatten nesting.
//
// Usage:  node scripts/flatten-tv-css.mjs   (or: npm run build:tv)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(process.cwd(), 'dist', 'assets')

function unwrapLayers(css) {
  css = css.replace(/@layer[^{;]*;/g, '') // statement form: @layer a, b, c;
  let changed = true
  while (changed) {
    changed = false
    const start = css.indexOf('@layer')
    if (start === -1) break
    const brace = css.indexOf('{', start)
    if (brace === -1) break
    let depth = 1
    let j = brace + 1
    for (; j < css.length; j++) {
      const c = css[j]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) break
      }
    }
    css = css.slice(0, start) + css.slice(brace + 1, j) + css.slice(j + 1)
    changed = true
  }
  return css
}

// Old-TV targets (version encoded as major<<16 | minor<<8 | patch).
const targets = { chrome: 56 << 16, safari: (11 << 16) | (0 << 8) }

let lightning = null
try {
  lightning = await import('lightningcss')
} catch {
  console.warn('lightningcss not installed — doing @layer flatten only. Run: npm i -D lightningcss')
}

let count = 0
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.css')) continue
  const p = join(dir, f)
  let css = readFileSync(p, 'utf8')
  const flat = unwrapLayers(css)
  let out = flat
  if (lightning) {
    try {
      const res = lightning.transform({
        filename: f,
        code: Buffer.from(flat),
        targets,
        minify: true,
        errorRecovery: true,
      })
      out = res.code.toString()
    } catch (e) {
      console.warn(`lightningcss failed on ${f}: ${e.message}; using flattened CSS`)
    }
  }
  writeFileSync(p, out)
  count++
  console.log(`processed ${f} (${css.length} -> ${out.length} bytes)`)
}
console.log(count ? `Done: ${count} CSS file(s) made old-TV compatible.` : 'No CSS found in dist.')
