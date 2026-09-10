import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// window.scrollY per list-page pathname, kept for the life of the SPA
// session. Survives the AnimatePresence remount that happens when the route
// changes, so returning to a list restores where the user was. Keyed by
// pathname (not the full URL) so it keeps tracking across in-page filter
// changes and still matches on the way back.
const store = new Map()

/**
 * Restores the saved scroll position for this page once `ready` turns true
 * (the list has loaded and the page is tall enough to scroll). Records the
 * position on scroll — debounced, and cancelled on unmount — so the
 * browser's scroll clamp when a shorter detail page mounts (which fires one
 * last scroll event as this page is torn down) can't overwrite the saved
 * value. No-ops cleanly when nothing is saved: the page stays at the top.
 */
export function useScrollRestoration(ready) {
  const { pathname } = useLocation()
  const mountPath = useRef(pathname)
  const restored = useRef(false)

  useEffect(() => {
    if (pathname !== mountPath.current) return undefined
    let timer
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => store.set(mountPath.current, window.scrollY), 120)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname])

  useEffect(() => {
    if (restored.current || !ready) return
    restored.current = true
    const y = store.get(mountPath.current) ?? 0
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)))
  }, [ready])
}
