import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import PeriodTabs from '../components/PeriodTabs'
import ScoreBadge from '../components/ScoreBadge'

function getDateRange(period) {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

function fmtPct(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}

export default function Departments() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('Month')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { date_from, date_to } = getDateRange(period)
        const res = await api.get('/api/departments/summary', { params: { date_from, date_to } })
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setError('departments.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, period])

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        {t('nav.departments')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{t('departments.countSubtitle', { count: data.length })}</p>

      <PeriodTabs period={period} onChange={setPeriod} />

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}
      >
        {data.map((dept, i) => {
          const isBest = i === 0 && data.length > 1
          const isWorst = i === data.length - 1 && data.length > 1
          const highlight = isBest
            ? 'border-teal-400/30 shadow-teal-900/20'
            : isWorst
              ? 'border-red-400/30 shadow-red-900/20'
              : 'border-white/5 shadow-black/20'

          return (
            <motion.div
              key={dept.department}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.2 }}
              whileHover={{ scale: 1.03, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/departments/${encodeURIComponent(dept.department)}`)}
              className={`rounded-2xl border bg-gradient-to-br from-surface-light to-surface p-5 shadow-lg cursor-pointer ${highlight}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-white font-semibold text-lg">{dept.department}</h2>
                  <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3" />
                    {t('departments.employeeCount', { count: dept.employee_count })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ScoreBadge score={dept.average_overall_score} label={t('departments.averageScore')} size="lg" />
                  {isBest && <span className="text-[10px] text-teal-300 font-medium">{t('departments.best')}</span>}
                  {isWorst && (
                    <span className="text-[10px] text-red-300 font-medium">{t('departments.needsAttention')}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-white text-lg font-bold">{fmtPct(dept.average_attendance_rate)}</p>
                  <p className="text-white/40 text-[11px]">{t('departments.attendance')}</p>
                </div>
                <div>
                  <p className="text-white text-lg font-bold">{fmtPct(dept.average_punctuality_rate)}</p>
                  <p className="text-white/40 text-[11px]">{t('departments.punctuality')}</p>
                </div>
                <div>
                  <p className="text-white text-lg font-bold">{dept.total_late_incidents}</p>
                  <p className="text-white/40 text-[11px]">{t('departments.lateIncidents')}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
        {!loading && data.length === 0 && (
          <p className="text-white/40 text-sm col-span-full text-center py-8">{t('departments.noData')}</p>
        )}
      </div>
    </div>
  )
}
