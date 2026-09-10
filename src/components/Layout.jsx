import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navTypeRef = useRef(navigationType)
  navTypeRef.current = navigationType

  // A forward navigation starts at the top. Done once the outgoing page has
  // finished exiting (and saved its own scroll position), so this can't
  // clobber it. Back/forward (POP) is left alone — the list pages restore
  // their remembered scroll on POP via useScrollRestoration.
  function handleExitComplete() {
    if (navTypeRef.current === 'PUSH') window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 pb-28 md:pb-8 md:pt-8 md:p-8">
        <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomTabBar />
    </div>
  )
}
