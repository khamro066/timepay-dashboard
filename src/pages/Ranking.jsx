import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import AttendanceBadge from '../components/AttendanceBadge'
import AttendanceBreakdownPanel from '../components/AttendanceBreakdownPanel'
import Avatar from '../components/Avatar'
import DisciplineTiers from '../components/DisciplineTiers'
import FilterBar from '../components/FilterBar'
import RankingChart from '../components/RankingChart'
import ScoreBadge from '../components/ScoreBadge'
import { boolParam, enumParam, strParam, useFilterParams } from '../hooks/useFilterParams'
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

const COLUMN_KEYS = [
  { key: 'full_name', labelKey: 'ranking.colName' },
  { key: 'department', labelKey: 'ranking.colDepartment' },
  { key: 'attendance_rate', labelKey: 'ranking.colAttendance' },
  { key: 'late_days', labelKey: 'ranking.colLate' },
  { key: 'absent_days', labelKey: 'ranking.colAbsent' },
]

const SORT_OPTIONS = [
  { value: 'attendance_desc', labelKey: 'filters.sortAttendanceDesc' },
  { value: 'attendance_asc', labelKey: 'filters.sortAttendanceAsc' },
  { value: 'name_asc', labelKey: 'filters.sortNameAsc' },
  { value: 'late_desc', labelKey: 'filters.sortLateDesc' },
]

function sortRows(rows, sort) {
  const sorted = [...rows]
  switch (sort) {
    case 'attendance_asc':
      return sorted.sort((a, b) => (a.attendance_rate ?? -1) - (b.attendance_rate ?? -1))
    case 'name_asc':
      return sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    case 'late_desc':
      return sorted.sort((a, b) => b.late_days - a.late_days)
    case 'attendance_desc':
    default:
      return sorted.sort((a, b) => (b.attendance_rate ?? -1) - (a.attendance_rate ?? -1))
  }
}

const STATUS_TAG = {
  paused: { labelKey: 'employeeDetail.statusOptionPaused', className: 'text-amber-300 bg-amber-500/15' },
  archived: { labelKey: 'employeeDetail.statusOptionArchived', className: 'text-red-300 bg-red-500/15' },
}

// Filter state is kept in the URL query string so back/forward and reload
// restore it — see useFilterParams.
const FILTER_SPEC = {
  q: { default: '' },
  dept: strParam,
  sort: enumParam('attendance_desc'),
  archived: boolParam,
  period: enumParam('Month'),
  df: { default: '' },
  dt: { default: '' },
}

export default function Ranking() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [f, setF] = useFilterParams(FILTER_SPEC)
  const { q: search, dept: department, sort, archived: showArchived, period } = f
  const customRange = useMemo(() => ({ date_from: f.df, date_to: f.dt }), [f.df, f.dt])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Row whose attendance-% breakdown is expanded (desktop table only).
  const [expandedId, setExpandedId] = useState(null)

  const { date_from, date_to } = getDateRange(period, customRange)
  const rangeReady = Boolean(date_from && date_to)

  useEffect(() => {
    if (!rangeReady) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/ranking', { params: { date_from, date_to, include_archived: showArchived } })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, date_from, date_to, showArchived, rangeReady])

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

  const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort])

  useScrollRestoration(!loading && data.length > 0)

  const topByAttendance = useMemo(() => {
    return [...filtered].sort((a, b) => (b.attendance_rate ?? 0) - (a.attendance_rate ?? 0)).slice(0, 15)
  }, [filtered])

  const disciplineTiers = useMemo(() => {
    const scored = filtered.filter((r) => r.attendance_rate !== null && r.attendance_rate !== undefined)
    const counts = {
      perfect: scored.filter((r) => r.attendance_rate >= 1).length,
      tier95: scored.filter((r) => r.attendance_rate >= 0.95 && r.attendance_rate < 1).length,
      tier85: scored.filter((r) => r.attendance_rate >= 0.85 && r.attendance_rate < 0.95).length,
      tier60: scored.filter((r) => r.attendance_rate >= 0.6 && r.attendance_rate < 0.85).length,
      low: scored.filter((r) => r.attendance_rate < 0.6).length,
    }
    const lowNames = scored
      .filter((r) => r.attendance_rate < 0.6)
      .sort((a, b) => (a.attendance_rate ?? 0) - (b.attendance_rate ?? 0))
      .map((r) => r.full_name)
    return { total: scored.length, counts, lowNames }
  }, [filtered])

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

      <FilterBar
        search={search}
        onSearchChange={(v) => setF('q', v)}
        department={department}
        onDepartmentChange={(v) => setF('dept', v)}
        departmentOptions={departmentOptions}
        period={period}
        onPeriodChange={(v) => setF('period', v)}
        customRange={customRange}
        onCustomRangeChange={(r) => setF({ df: r.date_from, dt: r.date_to })}
        sort={sort}
        onSortChange={(v) => setF('sort', v)}
        sortOptions={SORT_OPTIONS}
        showArchived={showArchived}
        onShowArchivedChange={(v) => setF('archived', v)}
        resultShown={sorted.length}
        resultTotal={data.length}
      />

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface p-5 shadow-lg shadow-black/20 mb-6"
        >
          <h2 className="text-white font-semibold mb-4">{t('ranking.top15')}</h2>
          {topByAttendance.length > 0 && <RankingChart data={topByAttendance} />}
          {topByAttendance.length === 0 && <p className="text-white/40 text-sm py-4">{t('ranking.noData')}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface p-5 shadow-lg shadow-black/20 mb-6"
        >
          <h2 className="text-white font-semibold mb-1">{t('ranking.disciplineTitle')}</h2>
          <p className="text-white/40 text-xs mb-4">{t('ranking.disciplineSubtitle')}</p>
          {disciplineTiers.total > 0 ? (
            <DisciplineTiers total={disciplineTiers.total} counts={disciplineTiers.counts} lowNames={disciplineTiers.lowNames} />
          ) : (
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
                    <th key={col.key} className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">
                      {t(col.labelKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const expanded = expandedId === row.employee_id
                  return (
                   <Fragment key={row.employee_id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.2 }}
                      onClick={() => navigate(`/employees/${row.employee_id}`)}
                      className={`border-b border-white/5 cursor-pointer ${
                        i < 10 && !expanded ? 'bg-violet-500/[0.04]' : ''
                      } ${expanded ? 'bg-white/[0.03] !border-transparent' : 'last:border-0'}`}
                    >
                      <td className="px-4 py-3 text-white/40">{i + 1}</td>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={row.profile_image} name={row.full_name} size="sm" />
                          {row.full_name}
                          {STATUS_TAG[row.status] && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_TAG[row.status].className}`}>
                              {t(STATUS_TAG[row.status].labelKey)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/60 whitespace-nowrap">{row.department}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedId(expanded ? null : row.employee_id)
                          }}
                          aria-expanded={expanded}
                          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <ScoreBadge
                            score={row.attendance_rate}
                            size="lg"
                            trailing={
                              typeof row.expected_working_days === 'number' ? (
                                <motion.span
                                  animate={{ rotate: expanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="text-white/30"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </motion.span>
                              ) : null
                            }
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white/60">{row.late_days}</td>
                      <td className="px-4 py-3 text-white/60">{row.absent_days}</td>
                    </motion.tr>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-white/5"
                        >
                          <td colSpan={COLUMN_KEYS.length + 1} className="px-4 pb-3 pt-0">
                            <div className="max-w-sm">
                              <AttendanceBreakdownPanel
                                presentDays={row.present_days}
                                expectedDays={row.expected_working_days}
                                rate={row.attendance_rate}
                                excusedDays={row.excused_absence_days}
                              />
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                   </Fragment>
                  )
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMN_KEYS.length + 1} className="px-4 py-8 text-center text-white/40">
                      {t(data.length === 0 ? 'ranking.noData' : 'filters.noResults')}
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-medium truncate">{row.full_name}</p>
                    {STATUS_TAG[row.status] && (
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_TAG[row.status].className}`}>
                        {t(STATUS_TAG[row.status].labelKey)}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs truncate">{row.department}</p>
                </div>
                <AttendanceBadge
                  score={row.attendance_rate}
                  label={t('common.attendance')}
                  presentDays={row.present_days}
                  expectedDays={row.expected_working_days}
                  excusedDays={row.excused_absence_days}
                />
              </div>
              <p className="text-white/45 text-xs mt-2.5 pt-2.5 border-t border-white/5">
                {t('ranking.cardSupport', { late: row.late_days, absent: row.absent_days })}
              </p>
            </motion.div>
          ))}
          {sorted.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">
              {t(data.length === 0 ? 'ranking.noData' : 'filters.noResults')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
