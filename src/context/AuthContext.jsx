import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { isTokenValid } from '../utils/jwt'

const AuthContext = createContext(null)

// localStorage over sessionStorage: the backend issues a 24h token (see
// JWT_EXPIRE_MINUTES), and this is a staff tool people reopen from a fresh
// tab or the next morning, not a banking app — sessionStorage would still
// force a re-login on every new tab and after the browser is closed, which
// is the same disruption we're trying to remove. isTokenValid() below is
// what keeps a token from outliving its actual expiry regardless of where
// it's stored.
const STORAGE_KEY = 'timepay.authToken'

function readStoredToken() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    if (isTokenValid(stored)) return stored
    localStorage.removeItem(STORAGE_KEY) // expired or tampered — don't keep it around
    return null
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) —
    // fall back to in-memory-only auth for this tab.
    return null
  }
}

export function AuthProvider({ children }) {
  // Lazy initializer runs once, synchronously, before first paint — so a
  // valid stored token is already in state on the very first render and the
  // app never flashes the login page before redirecting away from it.
  const [token, setToken] = useState(readStoredToken)

  const login = useCallback((newToken) => {
    setToken(newToken)
    try {
      localStorage.setItem(STORAGE_KEY, newToken)
    } catch {
      // Storage failed — the session still works in-memory for this tab,
      // it just won't survive a refresh.
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to clean up if storage was never reachable.
    }
  }, [])

  const value = useMemo(
    () => ({ token, login, logout, isAuthenticated: Boolean(token) }),
    [token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
