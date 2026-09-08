import { motion } from 'framer-motion'
import { ArrowLeft, Award, CheckCircle2, Clock, Clock3, LogOut, PlusCircle, TimerReset, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import EmployeeCalendarHeatmap from '../components/EmployeeCalendarHeatmap'
import EmployeeLeaveManager from '../components/EmployeeLeaveManager'
import EmployeeStatusSelect from '../components/EmployeeStatusSelect'
import LegendRow from '../components/LegendRow'
import PeriodTabs from '../components/PeriodTabs'
import ScoreExplainer from '../components/ScoreExplainer'
import StatCard from '../components/StatCard'

function fmtHoursUz(totalMinutes) {
  const m = totalMinutes || 0
  return `${Math.floor(m / 60)} soat ${m % 60} daq`
}

function getDateRange(period) {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

function fmtPct(value) {
  return value === null || value === undefined ? '—' : Math.round(value * 100)
}

function dayStatus(day) {
  if (!day.is_working_day) return { labelKey: 'employeeDetail.statusDayOff', className: 'text-white/30 bg-white/5' }
  if (day.absent && day.excused) return { labelKey: 'employeeDetail.statusExcused', className: 'text-violet-300 bg-violet-500/15' }
  if (day.absent) return { labelKey: 'employeeDetail.statusAbsent', className: 'text-red-300 bg-red-500/15' }
  if (day.late) return { labelKey: 'employeeDetail.statusLate', className: 'text-amber-300 bg-amber-500/15' }
  return { labelKey: 'employeeDetail.statusPresent', className: 'text-teal-300 bg-teal-500/15' }
}

export default function EmployeeDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const [period, setPeriod] = useState('Month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { date_from, date_to } = getDateRange(period)
        const res = await api.get(`/api/employees/${id}/summary`, { params: { date_from, date_to } })
        if (!cancelled) {
          setData(res.data)
          setImageFailed(false)
        }
      } catch {
        if (!cancelled) setError('employeeDetail.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, id, period, refreshKey])

  const days = data?.days ? [...data.days].reverse() : []

  return (
    <div>
      <motion.button
        type="button"
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('employeeDetail.back')}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-4"
      >
        {data?.profile_image && !imageFailed ? (
          <img
            src={data.profile_image}
            alt=""
            onError={() => setImageFailed(true)}
            className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-white/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-violet-300" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{data?.full_name ?? '—'}</h1>
          <p className="text-white/40 text-sm truncate">
            {data?.department ?? ''}
            {data?.department && data?.position ? ' · ' : ''}
            {data?.position ?? ''}
          </p>
        </div>
      </motion.div>

      {data && (
        <div className="mb-4">
          <EmployeeStatusSelect
            employeeId={data.employee_id}
            status={data.status}
            onSaved={(next) => setData((prev) => (prev ? { ...prev, status: next } : prev))}
          />
        </div>
      )}

      {data && <EmployeeLeaveManager employeeId={data.employee_id} onChanged={() => setRefreshKey((k) => k + 1)} />}

      <PeriodTabs period={period} onChange={setPeriod} />

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white/40 text-xs font-medium uppercase tracking-wide">{t('employeeDetail.statsTitle')}</span>
          <ScoreExplainer />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label={t('employeeDetail.overallScore')} value={fmtPct(data?.overall_score)} icon={Award} tone="purple" />
          <StatCard label={t('employeeDetail.attendanceRate')} value={fmtPct(data?.attendance_rate)} icon={CheckCircle2} tone="teal" />
          <StatCard label={t('employeeDetail.punctualityRate')} value={fmtPct(data?.punctuality_rate)} icon={Clock} tone="amber" />
        </div>

        <div className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap gap-x-8 gap-y-3">
          <LegendRow color="#2dd4bf" value={Math.max(0, (data?.present_days ?? 0) - (data?.late_days ?? 0))} label={t('dashboard.ishda')} />
          <LegendRow color="#fbbf24" value={data?.late_days ?? 0} label={t('dashboard.kech')} />
          <LegendRow color="#f87171" value={data?.absent_days ?? 0} label={t('dashboard.ishdaEmas')} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label={t('reports.statAvgCheckIn')} value={data?.average_check_in_time ?? '—'} icon={Clock3} tone="teal" />
          <StatCard label={t('reports.colAvgCheckOut')} value={data?.average_check_out_time ?? '—'} icon={LogOut} tone="amber" />
          <StatCard label={t('reports.statTotalWorked')} value={fmtHoursUz(data?.total_worked_minutes)} icon={TimerReset} tone="purple" />
          <StatCard label={t('reports.statOvertime')} value={fmtHoursUz(data?.total_extra_minutes)} icon={PlusCircle} tone="red" />
        </div>

        {data && <EmployeeCalendarHeatmap employeeId={data.employee_id} />}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="p-5 pb-0">
            <h2 className="text-white font-semibold">{t('employeeDetail.dayByDay')}</h2>
          </div>

          {/* Table: md and up */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/40 font-medium">{t('employeeDetail.colDate')}</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">{t('employeeDetail.colCheckIn')}</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">{t('employeeDetail.colCheckOut')}</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">{t('employeeDetail.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, i) => {
                  const status = dayStatus(day)
                  return (
                    <motion.tr
                      key={day.date}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.15 }}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-white/70 whitespace-nowrap">{day.date}</td>
                      <td className="px-4 py-2.5 text-white/60">{day.first_check_in ?? '—'}</td>
                      <td className="px-4 py-2.5 text-white/60">{day.last_check_out ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}
                        >
                          {t(status.labelKey)}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
                {days.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                      {t('employeeDetail.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stacked cards: below md */}
          <div className="md:hidden flex flex-col gap-2 p-4 pt-3">
            {days.map((day, i) => {
              const status = dayStatus(day)
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.15 }}
                  className="rounded-xl bg-white/5 border border-white/5 p-3.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm font-medium">{day.date}</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}
                    >
                      {t(status.labelKey)}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-white/40 text-[11px]">{t('employeeDetail.colCheckIn')}</p>
                      <p className="text-white/80">{day.first_check_in ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[11px]">{t('employeeDetail.colCheckOut')}</p>
                      <p className="text-white/80">{day.last_check_out ?? '—'}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {days.length === 0 && (
              <p className="text-white/40 text-sm text-center py-8">{t('employeeDetail.noData')}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
