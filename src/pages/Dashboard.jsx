import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import DateStepper from '../components/DateStepper'
import LegendRow from '../components/LegendRow'
import PeriodTabs from '../components/PeriodTabs'
import PillGroup from '../components/PillGroup'
import RingChart from '../components/RingChart'
import ScoreBadge from '../components/ScoreBadge'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getDateRange(period, selectedDate) {
  if (period === 'Today') return { date_from: selectedDate, date_to: selectedDate }
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

const TOP_LABEL_KEY = {
  Today: 'dashboard.topToday',
  Week: 'dashboard.topWeek',
  Month: 'dashboard.topMonth',
}

// Rank the "top 5" by the same attendance % the cards show, not the
// server's default overall_score ordering.
function topFiveByAttendance(rows) {
  return [...rows].sort((a, b) => (b.attendance_rate ?? -1) - (a.attendance_rate ?? -1)).slice(0, 5)
}

export default function Dashboard() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('Today')
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [business, setBusiness] = useState(null)
  const [rankRows, setRankRows] = useState([])
  const [todayStats, setTodayStats] = useState(null)
  const [rankLoading, setRankLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')

  const { date_from, date_to } = getDateRange(period, selectedDate)

  // Ranking rows for the current period — always fetched for every business, so
  // the business filter list stays stable and Top-5 can filter client-side.
  useEffect(() => {
    let cancelled = false
    setRankLoading(true)
    setError('')
    api
      .get('/api/ranking', { params: { date_from, date_to } })
      .then((res) => {
        if (!cancelled) setRankRows(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('dashboard.loadError')
      })
      .finally(() => {
        if (!cancelled) setRankLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, date_from, date_to])

  // "Today" headcount comes from the dedicated endpoint, which is business-aware.
  useEffect(() => {
    if (period !== 'Today') {
      setStatsLoading(false)
      return
    }
    let cancelled = false
    setStatsLoading(true)
    const params = { date: selectedDate }
    if (business) params.department = business
    api
      .get('/api/company/daily-stats', { params })
      .then((res) => {
        if (!cancelled) setTodayStats(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('dashboard.loadError')
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, period, selectedDate, business])

  const businessOptions = useMemo(
    () => [...new Set(rankRows.map((r) => r.department).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [rankRows],
  )

  useEffect(() => {
    if (business && businessOptions.length > 0 && !businessOptions.includes(business)) setBusiness(null)
  }, [business, businessOptions])

  const businessRows = useMemo(
    () => (business ? rankRows.filter((r) => r.department === business) : rankRows),
    [rankRows, business],
  )

  const topFive = useMemo(() => topFiveByAttendance(businessRows), [businessRows])

  const stats = useMemo(() => {
    if (period === 'Today') return todayStats
    return {
      total_employees: businessRows.length,
      present: businessRows.reduce((sum, r) => sum + r.present_days, 0),
      late: businessRows.reduce((sum, r) => sum + r.late_days, 0),
      absent: businessRows.reduce((sum, r) => sum + r.absent_days, 0),
    }
  }, [period, todayStats, businessRows])

  const loading = rankLoading || (period === 'Today' && statsLoading)
  const ontimeCount = Math.max(0, (stats?.present ?? 0) - (stats?.late ?? 0))
  const workdayTotal = (stats?.present ?? 0) + (stats?.absent ?? 0)
  const attendanceRate = workdayTotal > 0 ? Math.round(((stats?.present ?? 0) / workdayTotal) * 100) : 0

  const businessPillOptions = [
    { value: null, label: t('filters.all') },
    ...businessOptions.map((b) => ({ value: b, label: b })),
  ]

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        {t('nav.dashboard')}
      </motion.h1>

      {/* Pinned controls: date / period / business stay reachable while scrolling. */}
      <div className="sticky top-0 z-20 -mx-6 mb-4 border-b border-white/[0.06] bg-bg/95 px-6 pt-3 pb-3 backdrop-blur-md md:-mx-8 md:px-8">
        {period === 'Today' ? (
          <DateStepper date={selectedDate} onChange={setSelectedDate} maxDate={todayStr()} />
        ) : (
          <p className="text-white/40 text-sm">{todayStr()}</p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <PeriodTabs period={period} onChange={setPeriod} className="" />
          {businessOptions.length > 1 && (
            <PillGroup options={businessPillOptions} value={business} onChange={setBusiness} />
          )}
        </div>
      </div>

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-card rounded-3xl p-5 mb-8"
        >
          <div className="flex items-center gap-6">
            <RingChart pct={attendanceRate} label={t('dashboard.ishda')} size={104} />
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <LegendRow color="#2dd4bf" value={ontimeCount} label={t('dashboard.ishda')} />
              <LegendRow color="#fbbf24" value={stats?.late ?? 0} label={t('dashboard.kech')} />
              <LegendRow color="#f87171" value={stats?.absent ?? 0} label={t('dashboard.ishdaEmas')} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
            <span className="text-white/45">{t('dashboard.barchasi')}</span>
            <span className="text-white font-semibold tabular-nums">{stats?.total_employees ?? 0}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="glass-card rounded-3xl p-5"
        >
          <h2 className="text-white font-semibold mb-4">{t(TOP_LABEL_KEY[period])}</h2>
          <div className="flex flex-col gap-1">
            {topFive.map((emp, i) => (
              <motion.div
                key={emp.employee_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/employees/${emp.employee_id}`)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold">
                    {i + 1}
                  </span>
                  <Avatar src={emp.profile_image} name={emp.full_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{emp.full_name}</p>
                    <p className="text-white/40 text-xs truncate">{emp.department}</p>
                  </div>
                </div>
                <ScoreBadge score={emp.attendance_rate} label={t('common.attendance')} />
              </motion.div>
            ))}
            {!loading && topFive.length === 0 && (
              <p className="text-white/40 text-sm py-4">{t('dashboard.noData')}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
