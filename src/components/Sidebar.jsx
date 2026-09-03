import { motion } from 'framer-motion'
import { Building2, FileSpreadsheet, LayoutDashboard, LogOut, Trophy, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

const navItems = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/ranking', key: 'nav.ranking', icon: Trophy, end: false },
  { to: '/employees', key: 'nav.employees', icon: Users, end: false },
  { to: '/departments', key: 'nav.departments', icon: Building2, end: false },
  { to: '/reports', key: 'nav.reports', icon: FileSpreadsheet, end: false },
]

// Desktop-only static sidebar. Mobile navigation lives in BottomTabBar.
export default function Sidebar() {
  const { logout } = useAuth()
  const { t } = useTranslation()

  return (
    <aside className="hidden md:flex md:static z-40 top-0 left-0 h-full w-64 bg-gradient-to-b from-surface-light to-bg border-r border-white/5 p-4 flex-col">
      <div className="mb-6 px-2 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">{t('nav.brand')}</h1>
          <p className="text-white/40 text-xs">{t('nav.brandSubtitle')}</p>
        </div>
      </div>

      <div className="mb-6 px-2">
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-violet-600/20 border border-violet-500/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <item.icon className="w-4 h-4 relative z-10 shrink-0" />
                <span className="relative z-10 text-sm font-medium">{t(item.key)}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">{t('nav.logout')}</span>
      </motion.button>
    </aside>
  )
}
