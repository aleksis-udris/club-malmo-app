const BASE = 'http://localhost:3011/api/v1'
let pass = 0, fail = 0
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'OK  ' : 'FAIL') + ' ' + m) }
const J = async (r) => { try { return await r.json() } catch { return null } }

async function main() {
  // health
  for (let i = 0; i < 40; i++) {
    try { const h = await fetch(BASE + '/health'); if (h.ok) break } catch {}
    await new Promise(r => setTimeout(r, 250))
  }
  ok((await (await fetch(BASE + '/health')).json()).status === 'ok', 'health ok')

  // enroll a MOBILE device (auto-approved in dev) -> registration token
  const mEnroll = await J(await fetch(BASE + '/devices/enroll', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceClass: 'MOBILE', fingerprint: 'fp-mobile', label: 'Ref phone' }),
  }))
  ok(!!mEnroll.registrationToken, 'mobile enrolled + registration token issued')

  // exchange for session JWT
  const mSession = await J(await fetch(BASE + '/auth/session', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ registrationToken: mEnroll.registrationToken, fingerprint: 'fp-mobile' }),
  }))
  ok(!!mSession.token && mSession.role === 'ROLE_CONTROLLER', 'mobile session JWT (ROLE_CONTROLLER)')
  const mAuth = { Authorization: 'Bearer ' + mSession.token, 'x-device-fp': 'fp-mobile', 'content-type': 'application/json' }

  // read court 1 state -> pairing code
  const st = await J(await fetch(BASE + '/courts/1/state'))
  ok(/^\d{6}$/.test(st.pairing.code), 'court 1 exposes a 6-digit pairing code: ' + st.pairing.code)
  const code = st.pairing.code

  // claim with mobile session
  const claim = await J(await fetch(BASE + '/pairing/claim', {
    method: 'POST', headers: mAuth, body: JSON.stringify({ code, label: 'Ref phone' }),
  }))
  ok(!!claim.token && claim.courtId === 1, 'mobile claimed court 1 -> pairing token')
  const ptoken = claim.token

  // second claim should be COURT_BUSY
  const claim2 = await J(await fetch(BASE + '/pairing/claim', {
    method: 'POST', headers: mAuth, body: JSON.stringify({ code, label: 'X' }),
  }))
  ok(claim2.error === 'COURT_BUSY', 'duplicate claim blocked (COURT_BUSY)')

  // set match
  const setM = await J(await fetch(BASE + '/courts/1/match', {
    method: 'POST', headers: mAuth, body: JSON.stringify({ token: ptoken, home: 'Sweden', away: 'Germany', draw: 'U17' }),
  }))
  ok(setM.home === 'Sweden' && setM.away === 'Germany', 'match configured (Sweden vs Germany)')

  // score 3 games to 11 for home -> match finished + code regenerated
  let seq = 1
  for (let g = 0; g < 3; g++) for (let p = 0; p < 11; p++) {
    await fetch(BASE + '/courts/1/score', { method: 'POST', headers: mAuth, body: JSON.stringify({ token: ptoken, seq: seq++, type: 'POINT', side: 'home' }) })
  }
  const after = await J(await fetch(BASE + '/courts/1/state'))
  ok(after.court.status === 'FINISHED', 'court FINISHED after 3 games')
  ok(after.match.winner === 'home', 'winner = home')
  ok(after.pairing.code !== code, 'NEW pairing code generated after match end (req 5): ' + after.pairing.code)

  // idempotent replay
  const dup = await J(await fetch(BASE + '/courts/1/score', { method: 'POST', headers: mAuth, body: JSON.stringify({ token: ptoken, seq: 1, type: 'POINT', side: 'home' }) }))
  // token was revoked at match end -> should be 403 INVALID_PAIRING_TOKEN
  ok(dup.message === 'INVALID_PAIRING_TOKEN' || dup.statusCode === 403, 'pairing token revoked after match end')

  // enroll a TV device
  const tvEnroll = await J(await fetch(BASE + '/devices/enroll', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceClass: 'TV', fingerprint: 'fp-tv', provisioningKey: 'dev-tv-provisioning-key' }),
  }))
  const tvSession = await J(await fetch(BASE + '/auth/session', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ registrationToken: tvEnroll.registrationToken, fingerprint: 'fp-tv' }),
  }))
  ok(tvSession.role === 'ROLE_TV', 'TV session JWT (ROLE_TV)')
  const tvAuth = { Authorization: 'Bearer ' + tvSession.token, 'x-device-fp': 'fp-tv' }

  // TV can read scoreboard
  const sb = await fetch(BASE + '/scoreboard/2', { headers: tvAuth })
  ok(sb.status === 200, 'TV device can access scoreboard (200)')

  // MOBILE cannot read scoreboard (device-class guard)
  const sbBad = await fetch(BASE + '/scoreboard/2', { headers: mAuth })
  ok(sbBad.status === 403, 'MOBILE blocked from scoreboard (403)')

  // TV cannot claim controller (device-class guard)
  const claimBad = await fetch(BASE + '/pairing/claim', { method: 'POST', headers: { ...tvAuth, 'content-type': 'application/json' }, body: JSON.stringify({ code: '123456' }) })
  ok(claimBad.status === 403, 'TV blocked from controller pairing (403)')

  // unauthenticated blocked
  const noAuth = await fetch(BASE + '/scoreboard/2')
  ok(noAuth.status === 401, 'unauthenticated blocked (401)')

  // sportradar status (disabled)
  const sr = await J(await fetch(BASE + '/sportradar/status'))
  ok(sr.enabled === false, 'sportradar disabled by default (serves local read models)')
  const srLive = await J(await fetch(BASE + '/sportradar/live'))
  ok(Array.isArray(srLive), 'sportradar /live returns array (empty without key)')

  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(1) })
