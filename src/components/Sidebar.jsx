import { motion } from 'framer-motion'
import { Building2, LayoutDashboard, LogOut, Menu, Trophy, Users, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ranking', label: 'Ranking', icon: Trophy, end: false },
  { to: '/employees', label: 'Employees', icon: Users, end: false },
  { to: '/departments', label: "Bo'limlar", icon: Building2, end: false },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-light text-white shadow-lg"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-gradient-to-b from-surface-light to-bg border-r border-white/5 p-4 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-8 px-2 pt-2">
          <h1 className="text-white font-bold text-lg tracking-tight">Timepay</h1>
          <p className="text-white/40 text-xs">Analytics</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)}>
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
                  <span className="relative z-10 text-sm font-medium">{item.label}</span>
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
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </aside>
    </>
  )
}
