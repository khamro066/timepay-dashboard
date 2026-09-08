import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Download, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import FilterBar from '../components/FilterBar'
import LatenessBars from '../components/LatenessBars'
import NoteCell from '../components/NoteCell'
import ScoreBadge from '../components/ScoreBadge'

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

// Notes attach to a fixed calendar period (a day, an ISO week, a month, or —
// for a custom range — that exact date_from/date_to pair) rather than a
// rolling window that shifts "as of today" — so a note written any day this
// week still shows up when "this week" is viewed again later in the same week,
// and a custom range keeps its own notes every time that same range is picked.
function getPeriodKey(period, customRange) {
  const today = new Date()
  if (period === 'Today') return today.toISOString().slice(0, 10)
  if (period === 'Week') {
    const { year, week } = getISOWeek(today)
    return `${year}-W${String(week).padStart(2, '0')}`
  }
  if (period === 'Custom') return `custom:${customRange?.date_from || ''}:${customRange?.date_to || ''}`
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function scoreBorderTone(score) {
  if (score === null || score === undefined) return 'border-l-white/10'
  if (score >= 0.85) return 'border-l-teal-400/70'
  if (score >= 0.6) return 'border-l-amber-400/70'
  return 'border-l-red-400/70'
}

const DETAIL_FIELDS = [
  { key: 'unexcused_absence_days', labelKey: 'reports.colUnexcused' },
  { key: 'excused_absence_days', labelKey: 'reports.colExcused' },
  { key: 'total_late_minutes', labelKey: 'reports.colLateMinutes' },
  { key: 'average_check_in_time', labelKey: 'reports.colAvgCheckIn' },
  { key: 'early_leaving_days', labelKey: 'reports.colEarlyLeaving' },
  { key: 'average_check_out_time', labelKey: 'reports.colAvgCheckOut' },
]

const STATUS_TAG = {
  paused: { labelKey: 'employeeDetail.statusOptionPaused', className: 'text-amber-300 bg-amber-500/15' },
  archived: { labelKey: 'employeeDetail.statusOptionArchived', className: 'text-red-300 bg-red-500/15' },
}

function fmtVal(row, key) {
  const value = row[key]
  return value === null || value === undefined || value === '' ? '—' : value
}

export default function Reports() {
  const { t } = useTranslation()
  const api = useApi()
  const [period, setPeriod] = useState('Month')
  const [customRange, setCustomRange] = useState({ date_from: '', date_to: '' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [expandedCards, setExpandedCards] = useState({})
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState(null)
  const [sortDir, setSortDir] = useState('worst')
  const [lateness, setLateness] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const { date_from, date_to } = getDateRange(period, customRange)
  const rangeReady = Boolean(date_from && date_to)
  const periodKey = getPeriodKey(period, customRange)

  useEffect(() => {
    if (!rangeReady) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/reports', {
          params: { date_from, date_to, period_key: periodKey, include_archived: showArchived },
        })
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
  }, [api, date_from, date_to, periodKey, showArchived, rangeReady])

  useEffect(() => {
    if (!rangeReady) return
    let cancelled = false

    async function loadLateness() {
      try {
        const params = { date_from, date_to }
        if (department) params.department = department
        const res = await api.get('/api/lateness-distribution', { params })
        if (!cancelled) setLateness(res.data)
      } catch {
        if (!cancelled) setLateness(null)
      }
    }

    loadLateness()
    return () => {
      cancelled = true
    }
  }, [api, date_from, date_to, department, rangeReady])

  const departmentOptions = useMemo(() => {
    const set = new Set(data.map((r) => r.department).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((r) => {
      if (department && r.department !== department) return false
      if (q && !r.full_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, search, department])

  const byDepartment = useMemo(() => {
    const groups = {}
    for (const row of filtered) {
      const dept = row.department || 'Unknown'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(row)
    }
    for (const dept of Object.keys(groups)) {
      groups[dept].sort((a, b) =>
        sortDir === 'worst' ? (a.overall_score ?? -1) - (b.overall_score ?? -1) : (b.overall_score ?? -1) - (a.overall_score ?? -1),
      )
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, sortDir])

  function toggleDept(dept) {
    setCollapsed((prev) => ({ ...prev, [dept]: !prev[dept] }))
  }

  function toggleCard(employeeId) {
    setExpandedCards((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }))
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
        params: { date_from, date_to, period_key: periodKey, include_archived: showArchived },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `hisobot_${date_from}_${date_to}.xlsx`
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

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        departmentOptions={departmentOptions}
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        resultShown={filtered.length}
        resultTotal={data.length}
      />

      {lateness && lateness.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 mb-6">
          <h2 className="text-white font-semibold">{t('reports.latenessTitle')}</h2>
          <p className="text-white/40 text-xs mb-4">{t('reports.latenessSubtitle')}</p>
          <LatenessBars buckets={lateness.buckets} />
        </motion.div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <motion.button
          type="button"
          onClick={() => setSortDir((d) => (d === 'worst' ? 'best' : 'worst'))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          {sortDir === 'worst' ? <ArrowUpAZ className="w-4 h-4 text-red-300" /> : <ArrowDownAZ className="w-4 h-4 text-teal-300" />}
          {sortDir === 'worst' ? t('reports.worstFirst') : t('reports.bestFirst')}
        </motion.button>

        <motion.button
          type="button"
          onClick={handleExport}
          disabled={exporting || data.length === 0}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2 px-4 py-3 md:py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white text-sm font-medium shadow-lg shadow-violet-600/20 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? t('reports.exporting') : t('reports.exportButton')}
        </motion.button>
      </div>

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div className={`transition-opacity duration-200 flex flex-col gap-4 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        {byDepartment.map(([dept, rows], deptIdx) => {
          const isForcedSection = Boolean(department)
          const isCollapsed = !isForcedSection && Boolean(collapsed[dept])
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
                onClick={() => !isForcedSection && toggleDept(dept)}
                disabled={isForcedSection}
                className={`w-full flex items-center justify-between px-5 py-4 text-left min-h-[44px] transition-colors ${isForcedSection ? '' : 'hover:bg-white/[0.03]'}`}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-white font-semibold text-lg">{dept}</h2>
                  <span className="text-white/40 text-sm">{t('reports.employeeCount', { count: rows.length })}</span>
                </div>
                {!isForcedSection && (
                  <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-white/50" />
                  </motion.div>
                )}
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 border-t border-white/5">
                      {rows.map((row) => {
                        const isExpanded = Boolean(expandedCards[row.employee_id])
                        return (
                          <div
                            key={row.employee_id}
                            className={`rounded-xl bg-white/[0.03] border border-white/5 border-l-4 ${scoreBorderTone(row.overall_score)} p-3.5`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar src={row.profile_image} name={row.full_name} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-white font-medium truncate">{row.full_name}</p>
                                  {STATUS_TAG[row.status] && (
                                    <span
                                      className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_TAG[row.status].className}`}
                                    >
                                      {t(STATUS_TAG[row.status].labelKey)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-white/45 text-xs truncate">
                                  {t('reports.cardSummary', {
                                    present: row.present_days,
                                    late: row.late_days,
                                    absent: row.absent_days,
                                  })}
                                </p>
                              </div>
                              <ScoreBadge score={row.overall_score} label={t('common.overallScore')} size="lg" />
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleCard(row.employee_id)}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors min-h-[32px]"
                            >
                              <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </motion.span>
                              {isExpanded ? t('reports.hideDetails') : t('reports.details')}
                            </button>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/5 text-xs">
                                    {DETAIL_FIELDS.map((f) => (
                                      <div key={f.key}>
                                        <p className="text-white/40 mb-0.5">{t(f.labelKey)}</p>
                                        <p className="text-white/80 font-medium">{fmtVal(row, f.key)}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3">
                                    <p className="text-white/40 text-xs mb-1">{t('reports.colNote')}</p>
                                    <NoteCell value={row.note} onSave={(note) => handleNoteSave(row.employee_id, note)} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        {!loading && byDepartment.length === 0 && (
          <p className="text-white/40 text-sm text-center py-8">{t(data.length === 0 ? 'reports.noData' : 'filters.noResults')}</p>
        )}
      </div>
    </div>
  )
}
