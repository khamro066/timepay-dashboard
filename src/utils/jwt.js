// Decodes a JWT's payload client-side, without verifying the signature —
// good enough to read the "exp" claim and decide whether a stored token is
// still worth sending; the backend is the one place that actually verifies
// it, and rejects it with a 401 if it doesn't (see useApi's interceptor).
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

// True only for a well-formed, non-empty JWT whose "exp" claim is still in
// the future. Anything else (missing, malformed, expired) is treated as
// invalid so a stale token never gets sent and never blocks the login page.
export function isTokenValid(token) {
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > Date.now()
}
