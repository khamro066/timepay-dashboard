import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import NoteCell from '../components/NoteCell'
import PeriodTabs from '../components/PeriodTabs'

function getDateRange(period) {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

// Standard ISO-8601 week number: week 1 is the week containing the year's
// first Thursday; weeks run Monday-Sunday.
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

// Notes attach to a fixed calendar period (a day, an ISO week, or a
// month) rather than the rolling date_from/date_to a period tab computes
// "as of today" — so a note written any day this week still shows up
// when "this week" is viewed again later in the same week.
function getPeriodKey(period) {
  const today = new Date()
  if (period === 'Today') return today.toISOString().slice(0, 10)
  if (period === 'Week') {
    const { year, week } = getISOWeek(today)
    return `${year}-W${String(week).padStart(2, '0')}`
  }
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function scoreBorderTone(score) {
  if (score === null || score === undefined) return 'border-l-white/10'
  if (score >= 0.85) return 'border-l-teal-400/70'
  if (score >= 0.6) return 'border-l-amber-400/70'
  return 'border-l-red-400/70'
}

const COLUMNS = [
  { key: 'present_days', labelKey: 'reports.colWorkedDays' },
  { key: 'absent_days', labelKey: 'reports.colNotWorkedDays' },
  { key: 'unexcused_absence_days', labelKey: 'reports.colUnexcused' },
  { key: 'excused_absence_days', labelKey: 'reports.colExcused' },
  { key: 'late_days', labelKey: 'reports.colLateDays' },
  { key: 'total_late_minutes', labelKey: 'reports.colLateMinutes' },
  { key: 'average_check_in_time', labelKey: 'reports.colAvgCheckIn' },
  { key: 'early_leaving_days', labelKey: 'reports.colEarlyLeaving' },
  { key: 'average_check_out_time', labelKey: 'reports.colAvgCheckOut' },
  { key: 'total_worked_formatted', labelKey: 'reports.colTotalWorked' },
]

function fmtVal(row, key) {
  const value = row[key]
  return value === null || value === undefined || value === '' ? '—' : value
}

export default function Reports() {
  const { t } = useTranslation()
  const api = useApi()
  const [period, setPeriod] = useState('Month')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [collapsed, setCollapsed] = useState({})

  const dateRange = useMemo(() => getDateRange(period), [period])
  const periodKey = useMemo(() => getPeriodKey(period), [period])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/reports', { params: { ...dateRange, period_key: periodKey } })
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setError('reports.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, dateRange.date_from, dateRange.date_to, periodKey])

  const byDepartment = useMemo(() => {
    const groups = {}
    for (const row of data) {
      const dept = row.department || 'Unknown'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(row)
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [data])

  function toggleDept(dept) {
    setCollapsed((prev) => ({ ...prev, [dept]: !prev[dept] }))
  }

  async function handleNoteSave(employeeId, note) {
    await api.put('/api/notes', {
      employee_id: employeeId,
      period_key: periodKey,
      note,
    })
    setData((prev) => prev.map((r) => (r.employee_id === employeeId ? { ...r, note } : r)))
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await api.get('/api/reports/export', {
        params: { ...dateRange, period_key: periodKey },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `hisobot_${dateRange.date_from}_${dateRange.date_to}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError('reports.loadError')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        {t('nav.reports')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{t('reports.employeeCount', { count: data.length })}</p>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodTabs period={period} onChange={setPeriod} />
        <motion.button
          type="button"
          onClick={handleExport}
          disabled={exporting || data.length === 0}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-3 md:py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-medium shadow-lg shadow-violet-600/20 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? t('reports.exporting') : t('reports.exportButton')}
        </motion.button>
      </div>

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div className={`transition-opacity duration-200 flex flex-col gap-4 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        {byDepartment.map(([dept, rows], deptIdx) => {
          const isCollapsed = Boolean(collapsed[dept])
          return (
            <motion.div
              key={dept}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(deptIdx * 0.05, 0.3), duration: 0.2 }}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface shadow-lg shadow-black/20 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleDept(dept)}
                className="w-full flex items-center justify-between px-5 py-4 text-left min-h-[44px] hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-white font-semibold text-lg">{dept}</h2>
                  <span className="text-white/40 text-sm">{t('reports.employeeCount', { count: rows.length })}</span>
                </div>
                <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-5 h-5 text-white/50" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {/* Desktop table (needs real width for 12 columns) */}
                    <div className="hidden lg:block overflow-x-auto border-t border-white/5">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left px-4 py-3 text-white/40 font-medium sticky left-0 bg-surface z-10">
                              {t('reports.colName')}
                            </th>
                            {COLUMNS.map((col) => (
                              <th
                                key={col.key}
                                className="text-left px-3 py-3 text-white/40 font-medium whitespace-nowrap"
                              >
                                {t(col.labelKey)}
                              </th>
                            ))}
                            <th className="text-left px-3 py-3 text-white/40 font-medium">{t('reports.colNote')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr
                              key={row.employee_id}
                              className={`border-b border-white/5 last:border-0 border-l-2 ${scoreBorderTone(row.overall_score)}`}
                            >
                              <td className="px-4 py-2.5 sticky left-0 bg-surface">
                                <div className="flex items-center gap-2.5 whitespace-nowrap">
                                  <Avatar src={row.profile_image} name={row.full_name} size="sm" />
                                  <span className="text-white font-medium">{row.full_name}</span>
                                </div>
                              </td>
                              {COLUMNS.map((col) => (
                                <td key={col.key} className="px-3 py-2.5 text-white/70 whitespace-nowrap">
                                  {fmtVal(row, col.key)}
                                </td>
                              ))}
                              <td className="px-3 py-1.5 min-w-[180px]">
                                <NoteCell value={row.note} onSave={(note) => handleNoteSave(row.employee_id, note)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Card list: below lg (tablet + phone) */}
                    <div className="lg:hidden flex flex-col gap-2 p-3 border-t border-white/5">
                      {rows.map((row) => (
                        <div
                          key={row.employee_id}
                          className={`rounded-xl bg-white/5 border border-white/5 border-l-2 ${scoreBorderTone(row.overall_score)} p-3.5`}
                        >
                          <div className="flex items-center gap-2.5 mb-3">
                            <Avatar src={row.profile_image} name={row.full_name} size="sm" />
                            <span className="text-white font-medium truncate">{row.full_name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                            {COLUMNS.map((col) => (
                              <div key={col.key} className="flex justify-between gap-2">
                                <span className="text-white/40">{t(col.labelKey)}</span>
                                <span className="text-white/80 font-medium">{fmtVal(row, col.key)}</span>
                              </div>
                            ))}
                          </div>
                          <NoteCell value={row.note} onSave={(note) => handleNoteSave(row.employee_id, note)} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        {!loading && byDepartment.length === 0 && (
          <p className="text-white/40 text-sm text-center py-8">{t('reports.noData')}</p>
        )}
      </div>
    </div>
  )
}
