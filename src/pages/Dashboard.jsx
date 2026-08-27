import { motion } from 'framer-motion'
import { Clock, UserCheck, Users, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApi } from '../api/useApi'
import ScoreBadge from '../components/ScoreBadge'
import StatCard from '../components/StatCard'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const api = useApi()
  const [stats, setStats] = useState(null)
  const [topFive, setTopFive] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const date = todayStr()

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [statsRes, rankRes] = await Promise.all([
          api.get('/api/company/daily-stats', { params: { date } }),
          api.get('/api/ranking', { params: { date_from: date, date_to: date } }),
        ])
        if (!cancelled) {
          setStats(statsRes.data)
          setTopFive(rankRes.data.slice(0, 5))
        }
      } catch {
        if (!cancelled) setError('Could not load dashboard data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api])

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        Dashboard
      </motion.h1>
      <p className="text-white/40 text-sm mb-6">{todayStr()}</p>

      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Barchasi" value={stats?.total_employees ?? 0} icon={Users} tone="purple" />
        <StatCard label="Ishda" value={stats?.present ?? 0} icon={UserCheck} tone="teal" />
        <StatCard label="Kech" value={stats?.late ?? 0} icon={Clock} tone="amber" />
        <StatCard label="Ishda emas" value={stats?.absent ?? 0} icon={UserX} tone="red" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
        className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface p-5 shadow-lg shadow-black/20"
      >
        <h2 className="text-white font-semibold mb-4">Top 5 today</h2>
        <div className="flex flex-col gap-1">
          {topFive.map((emp, i) => (
            <motion.div
              key={emp.employee_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{emp.full_name}</p>
                  <p className="text-white/40 text-xs truncate">{emp.department}</p>
                </div>
              </div>
              <ScoreBadge score={emp.overall_score} />
            </motion.div>
          ))}
          {!loading && topFive.length === 0 && (
            <p className="text-white/40 text-sm py-4">No data for today yet.</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
