import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import DeptCompareRow from '../components/DeptCompareRow'
import FilterBar from '../components/FilterBar'
import { enumParam, useFilterParams } from '../hooks/useFilterParams'
import { useScrollRestoration } from '../hooks/useScrollRestoration'

function getDateRange(period, customRange) {
  if (period === 'Custom') {
    return { date_from: customRange?.date_from || '', date_to: customRange?.date_to || '' }
  }
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

// Filter state is kept in the URL query string so back/forward and reload
// restore it — see useFilterParams.
const FILTER_SPEC = {
  period: enumParam('Month'),
  df: { default: '' },
  dt: { default: '' },
}

export default function Departments() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [f, setF] = useFilterParams(FILTER_SPEC)
  const { period } = f
  const customRange = useMemo(() => ({ date_from: f.df, date_to: f.dt }), [f.df, f.dt])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { date_from, date_to } = getDateRange(period, customRange)
  const rangeReady = Boolean(date_from && date_to)

  useEffect(() => {
    if (!rangeReady) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, date_from, date_to, rangeReady])

  useScrollRestoration(!loading && data.length > 0)

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

      <FilterBar
        period={period}
        onPeriodChange={(v) => setF('period', v)}
        customRange={customRange}
        onCustomRangeChange={(r) => setF({ df: r.date_from, dt: r.date_to })}
      />

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`glass-card rounded-2xl px-5 transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}
      >
        {data.map((dept) => (
          <DeptCompareRow
            key={dept.department}
            department={dept.department}
            employeeCount={dept.employee_count}
            attendanceRatio={dept.average_attendance_rate}
            lateIncidents={dept.total_late_incidents}
            absentDays={dept.total_absent_incidents}
            onClick={() => navigate(`/departments/${encodeURIComponent(dept.department)}`)}
          />
        ))}
        {!loading && data.length === 0 && <p className="text-white/40 text-sm text-center py-8">{t('departments.noData')}</p>}
      </motion.div>
    </div>
  )
}
