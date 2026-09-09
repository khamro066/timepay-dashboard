import { AnimatePresence, motion } from 'framer-motion'
import { Building2, CalendarRange, FileSpreadsheet, LayoutDashboard, LogOut, MoreHorizontal, Trophy, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

const PRIMARY_TABS = [
  { to: '/', labelKey: 'nav.dashboardShort', icon: LayoutDashboard, end: true },
  { to: '/employees', labelKey: 'nav.employees', icon: Users, end: false },
  { to: '/jadval', labelKey: 'nav.schedule', icon: CalendarRange, end: false },
  { to: '/departments', labelKey: 'nav.departments', icon: Building2, end: false },
]

// Everything not on the bottom bar lives in the "More" sheet.
const MORE_LINKS = [
  { to: '/ranking', labelKey: 'nav.ranking', icon: Trophy },
  { to: '/reports', labelKey: 'nav.reports', icon: FileSpreadsheet },
]

export default function BottomTabBar() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const isMoreActive = MORE_LINKS.some((l) => location.pathname.startsWith(l.to))

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('common.close')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50"
            />
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              className="md:hidden fixed z-50 left-3 right-3 bottom-[calc(78px+env(safe-area-inset-bottom))] rounded-2xl border border-white/10 bg-surface-light/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-2"
            >
              {MORE_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setMoreOpen(false)}>
                  {({ isActive }) => (
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                        isActive ? 'text-white bg-violet-600/20' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{t(link.labelKey)}</span>
                    </div>
                  )}
                </NavLink>
              ))}

              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-white/70 text-sm font-medium">{t('common.language')}</span>
                <LanguageSwitcher />
              </div>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-red-400 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">{t('nav.logout')}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed z-30 left-3 right-3 bottom-[calc(12px+env(safe-area-inset-bottom))] rounded-2xl border border-white/10 bg-surface-light/95 backdrop-blur-xl shadow-2xl shadow-black/50">
        <div className="grid grid-cols-5">
          {PRIMARY_TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} onClick={() => setMoreOpen(false)}>
              {({ isActive }) => (
                <div className="relative flex flex-col items-center justify-center gap-1 py-3 min-h-[56px]">
                  {isActive && (
                    <motion.div
                      layoutId="bottom-tab-indicator"
                      className="absolute top-1.5 w-11 h-7 rounded-xl bg-teal-400/15"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <tab.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-teal-300' : 'text-white/40'}`} />
                  <span className={`relative z-10 text-[10px] font-medium ${isActive ? 'text-teal-300' : 'text-white/40'}`}>
                    {t(tab.labelKey)}
                  </span>
                </div>
              )}
            </NavLink>
          ))}

          <button type="button" onClick={() => setMoreOpen((o) => !o)} className="flex flex-col items-center justify-center gap-1 py-3 min-h-[56px]">
            <MoreHorizontal className={`w-5 h-5 ${isMoreActive || moreOpen ? 'text-teal-300' : 'text-white/40'}`} />
            <span className={`text-[10px] font-medium ${isMoreActive || moreOpen ? 'text-teal-300' : 'text-white/40'}`}>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
