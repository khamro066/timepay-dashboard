import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import Sidebar from './Sidebar'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 pb-28 md:pb-8 md:pt-8 md:p-8">
        <AnimatePresence mode="wait">
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
