import { motion } from 'framer-motion'
import { ArrowUpDown, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import PeriodTabs from '../components/PeriodTabs'
import RankingChart from '../components/RankingChart'
import ScoreBadge from '../components/ScoreBadge'
import ScoreExplainer from '../components/ScoreExplainer'

function getDateRange(period) {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  const startStr = start.toISOString().slice(0, 10)
  return { date_from: startStr, date_to: endStr }
}

const COLUMN_KEYS = [
  { key: 'full_name', labelKey: 'ranking.colName' },
  { key: 'department', labelKey: 'ranking.colDepartment' },
  { key: 'attendance_rate', labelKey: 'ranking.colAttendance' },
  { key: 'punctuality_rate', labelKey: 'ranking.colPunctuality' },
  { key: 'overall_score', labelKey: 'ranking.colScore' },
  { key: 'late_days', labelKey: 'ranking.colLate' },
  { key: 'absent_days', labelKey: 'ranking.colAbsent' },
]

function fmtPct(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}

export default function Ranking() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const department = searchParams.get('department')
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
        const params = { date_from, date_to }
        if (department) params.department = department
        const res = await api.get('/api/ranking', { params })
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setError('ranking.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, period, department])

  function clearDepartmentFilter() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('department')
      return next
    })
  }

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
        {t('nav.ranking')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{t('ranking.employeeCount', { count: data.length })}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <PeriodTabs period={period} onChange={setPeriod} />
        {department && (
          <motion.button
            type="button"
            onClick={clearDepartmentFilter}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 mb-6 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-200 text-sm"
          >
            {department}
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface p-5 shadow-lg shadow-black/20 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-white font-semibold">{t('ranking.top15')}</h2>
            <ScoreExplainer />
          </div>
          {topByScore.length > 0 && <RankingChart data={topByScore} />}
          {topByScore.length === 0 && (
            <p className="text-white/40 text-sm py-4">{t('ranking.noData')}</p>
          )}
        </motion.div>

        {/* Table: md and up */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="hidden md:block rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/40 font-medium">#</th>
                  {COLUMN_KEYS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left px-4 py-3 text-white/40 font-medium cursor-pointer select-none hover:text-white/70 transition-colors whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {t(col.labelKey)}
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
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(`/employees/${row.employee_id}`)}
                    className={`border-b border-white/5 last:border-0 cursor-pointer ${i < 10 ? 'bg-violet-500/[0.04]' : ''}`}
                  >
                    <td className="px-4 py-3 text-white/40">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={row.profile_image} name={row.full_name} size="sm" />
                        {row.full_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap">{row.department}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{fmtPct(row.attendance_rate)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{fmtPct(row.punctuality_rate)}</td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={row.overall_score} size="lg" />
                    </td>
                    <td className="px-4 py-3 text-white/60">{row.late_days}</td>
                    <td className="px-4 py-3 text-white/60">{row.absent_days}</td>
                  </motion.tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMN_KEYS.length + 1} className="px-4 py-8 text-center text-white/40">
                      {t('ranking.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Card list: below md */}
        <div className="md:hidden flex flex-col gap-2">
          {sorted.map((row, i) => (
            <motion.div
              key={row.employee_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.2 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/employees/${row.employee_id}`)}
              className={`rounded-2xl border p-3.5 shadow-lg shadow-black/20 cursor-pointer bg-gradient-to-br from-surface-light to-surface ${i < 10 ? 'border-violet-500/20' : 'border-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                  {i + 1}
                </span>
                <Avatar src={row.profile_image} name={row.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">{row.full_name}</p>
                  <p className="text-white/40 text-xs truncate">{row.department}</p>
                </div>
                <ScoreBadge score={row.overall_score} label={t('common.overallScore')} />
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
                <div>
                  <p className="text-white text-sm font-semibold">{fmtPct(row.attendance_rate)}</p>
                  <p className="text-white/40 text-[10px]">{t('ranking.colAttendance')}</p>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{fmtPct(row.punctuality_rate)}</p>
                  <p className="text-white/40 text-[10px]">{t('ranking.colPunctuality')}</p>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{row.late_days}</p>
                  <p className="text-white/40 text-[10px]">{t('ranking.colLate')}</p>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{row.absent_days}</p>
                  <p className="text-white/40 text-[10px]">{t('ranking.colAbsent')}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {sorted.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">{t('ranking.noData')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
