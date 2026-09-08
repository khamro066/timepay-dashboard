import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import FilterBar from '../components/FilterBar'
import RankingChart from '../components/RankingChart'
import ScoreBadge from '../components/ScoreBadge'
import ScoreExplainer from '../components/ScoreExplainer'

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
  { key: 'punctuality_rate', labelKey: 'ranking.colPunctuality' },
  { key: 'overall_score', labelKey: 'ranking.colScore' },
  { key: 'late_days', labelKey: 'ranking.colLate' },
  { key: 'absent_days', labelKey: 'ranking.colAbsent' },
]

const SORT_OPTIONS = [
  { value: 'score_desc', labelKey: 'filters.sortScoreDesc' },
  { value: 'score_asc', labelKey: 'filters.sortScoreAsc' },
  { value: 'name_asc', labelKey: 'filters.sortNameAsc' },
  { value: 'late_desc', labelKey: 'filters.sortLateDesc' },
]

function sortRows(rows, sort) {
  const sorted = [...rows]
  switch (sort) {
    case 'score_asc':
      return sorted.sort((a, b) => (a.overall_score ?? -1) - (b.overall_score ?? -1))
    case 'name_asc':
      return sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    case 'late_desc':
      return sorted.sort((a, b) => b.late_days - a.late_days)
    case 'score_desc':
    default:
      return sorted.sort((a, b) => (b.overall_score ?? -1) - (a.overall_score ?? -1))
  }
}

function fmtPct(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}

const STATUS_TAG = {
  paused: { labelKey: 'employeeDetail.statusOptionPaused', className: 'text-amber-300 bg-amber-500/15' },
  archived: { labelKey: 'employeeDetail.statusOptionArchived', className: 'text-red-300 bg-red-500/15' },
}

export default function Ranking() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('Month')
  const [customRange, setCustomRange] = useState({ date_from: '', date_to: '' })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState(null)
  const [sort, setSort] = useState('score_desc')
  const [showArchived, setShowArchived] = useState(false)

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

  const topByScore = useMemo(() => {
    return [...filtered].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)).slice(0, 15)
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
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        departmentOptions={departmentOptions}
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
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
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-white font-semibold">{t('ranking.top15')}</h2>
            <ScoreExplainer />
          </div>
          {topByScore.length > 0 && <RankingChart data={topByScore} />}
          {topByScore.length === 0 && <p className="text-white/40 text-sm py-4">{t('ranking.noData')}</p>}
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
                        {STATUS_TAG[row.status] && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_TAG[row.status].className}`}>
                            {t(STATUS_TAG[row.status].labelKey)}
                          </span>
                        )}
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
            <p className="text-white/40 text-sm text-center py-8">
              {t(data.length === 0 ? 'ranking.noData' : 'filters.noResults')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
