import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useApi } from '../api/useApi'
import PeriodTabs from '../components/PeriodTabs'
import RankingChart from '../components/RankingChart'
import ScoreBadge from '../components/ScoreBadge'

function getDateRange(period) {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  const startStr = start.toISOString().slice(0, 10)
  return { date_from: startStr, date_to: endStr }
}

const COLUMNS = [
  { key: 'full_name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'attendance_rate', label: 'Attendance' },
  { key: 'punctuality_rate', label: 'Punctuality' },
  { key: 'overall_score', label: 'Score' },
  { key: 'late_days', label: 'Late' },
  { key: 'absent_days', label: 'Absent' },
]

function fmtPct(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}

export default function Ranking() {
  const api = useApi()
  const [period, setPeriod] = useState('Month')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'overall_score', dir: 'desc' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { date_from, date_to } = getDateRange(period)
        const res = await api.get('/api/ranking', { params: { date_from, date_to } })
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setError('Could not load ranking data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, period])

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'string') {
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sort.dir === 'asc' ? av - bv : bv - av
    })
  }, [data, sort])

  const topByScore = useMemo(() => {
    return [...data]
      .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0))
      .slice(0, 15)
  }, [data])

  function toggleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        Ranking
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{data.length} employees</p>

      <PeriodTabs period={period} onChange={setPeriod} />

      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface p-5 shadow-lg shadow-black/20 mb-6"
      >
        <h2 className="text-white font-semibold mb-4">Top 15 by score</h2>
        {!loading && topByScore.length > 0 && <RankingChart data={topByScore} />}
        {!loading && topByScore.length === 0 && (
          <p className="text-white/40 text-sm py-4">No data for this period.</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface shadow-lg shadow-black/20 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-white/40 font-medium">#</th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-4 py-3 text-white/40 font-medium cursor-pointer select-none hover:text-white/70 transition-colors whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sort.key === col.key && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <motion.tr
                  key={row.employee_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  className={`border-b border-white/5 last:border-0 cursor-default ${i < 10 ? 'bg-violet-500/[0.04]' : ''}`}
                >
                  <td className="px-4 py-3 text-white/40">{i + 1}</td>
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{row.full_name}</td>
                  <td className="px-4 py-3 text-white/60 whitespace-nowrap">{row.department}</td>
                  <td className="px-4 py-3 text-white/60">{fmtPct(row.attendance_rate)}</td>
                  <td className="px-4 py-3 text-white/60">{fmtPct(row.punctuality_rate)}</td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={row.overall_score} />
                  </td>
                  <td className="px-4 py-3 text-white/60">{row.late_days}</td>
                  <td className="px-4 py-3 text-white/60">{row.absent_days}</td>
                </motion.tr>
              ))}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-white/40">
                    No data for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
