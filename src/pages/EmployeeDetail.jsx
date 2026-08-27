import { motion } from 'framer-motion'
import { ArrowLeft, Award, CheckCircle2, Clock, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import PeriodTabs from '../components/PeriodTabs'
import StatCard from '../components/StatCard'

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
  if (!day.is_working_day) return { label: 'Day off', className: 'text-white/30 bg-white/5' }
  if (day.absent) return { label: 'Absent', className: 'text-red-300 bg-red-500/15' }
  if (day.late) return { label: 'Late', className: 'text-amber-300 bg-amber-500/15' }
  return { label: 'Present', className: 'text-teal-300 bg-teal-500/15' }
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const api = useApi()
  const [period, setPeriod] = useState('Month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageFailed, setImageFailed] = useState(false)

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
        if (!cancelled) setError('Could not load employee data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, id, period])

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
        Back
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

      <PeriodTabs period={period} onChange={setPeriod} />

      {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}

      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Overall score" value={fmtPct(data?.overall_score)} icon={Award} tone="purple" />
          <StatCard label="Attendance rate" value={fmtPct(data?.attendance_rate)} icon={CheckCircle2} tone="teal" />
          <StatCard label="Punctuality rate" value={fmtPct(data?.punctuality_rate)} icon={Clock} tone="amber" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface shadow-lg shadow-black/20 overflow-hidden"
        >
          <div className="p-5 pb-0">
            <h2 className="text-white font-semibold">Day by day</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Check-in</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Check-out</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Status</th>
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
                          {status.label}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
                {days.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                      No data for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
