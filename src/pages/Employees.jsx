import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import AttendanceBadge from '../components/AttendanceBadge'
import Avatar from '../components/Avatar'
import FilterBar from '../components/FilterBar'
import PillGroup from '../components/PillGroup'
import { boolParam, enumParam, strParam, useFilterParams } from '../hooks/useFilterParams'
import { useScrollRestoration } from '../hooks/useScrollRestoration'

// Local calendar date — toISOString() is UTC and shifts a day for anyone
// east of Greenwich in the early hours.
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function last30Days() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { date_from: localDateStr(start), date_to: localDateStr(end) }
}

// 1st of the current calendar month through today, inclusive — the window
// the per-card "Bu oy" late/absent counts are scoped to.
function monthToDate() {
  const now = new Date()
  return { date_from: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), date_to: localDateStr(now) }
}

const SORT_OPTIONS = [
  { value: 'attendance_desc', labelKey: 'filters.sortAttendanceDesc' },
  { value: 'attendance_asc', labelKey: 'filters.sortAttendanceAsc' },
  { value: 'name_asc', labelKey: 'filters.sortNameAsc' },
]

function sortRows(rows, sort) {
  const sorted = [...rows]
  switch (sort) {
    case 'attendance_asc':
      return sorted.sort((a, b) => (a.attendance_rate ?? -1) - (b.attendance_rate ?? -1))
    case 'name_asc':
      return sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    case 'attendance_desc':
    default:
      return sorted.sort((a, b) => (b.attendance_rate ?? -1) - (a.attendance_rate ?? -1))
  }
}

const STATUS_TAG = {
  paused: { labelKey: 'employeeDetail.statusOptionPaused', className: 'text-amber-300 bg-amber-500/15' },
  archived: { labelKey: 'employeeDetail.statusOptionArchived', className: 'text-red-300 bg-red-500/15' },
}

// Filter state lives in the URL query string so back/forward and reload
// restore it — see useFilterParams.
const FILTER_SPEC = {
  q: { default: '' },
  dept: strParam,
  pos: strParam,
  sort: enumParam('attendance_desc'),
  archived: boolParam,
}

export default function Employees() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [f, setF] = useFilterParams(FILTER_SPEC)
  const { q: search, dept: department, pos: position, sort, archived: showArchived } = f
  const [data, setData] = useState([])
  // employee_id -> { late_days, absent_days } for the current month so far.
  // Kept separate from `data` (which is the 30-day window powering the
  // attendance %) so the two windows can be labelled independently.
  const [monthCounts, setMonthCounts] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Every status is fetched once, unconditionally — the archive pill's
  // count and the toggle itself both become instant client-side filters
  // below instead of a second round trip each time it's flipped.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const wide = last30Days()
        const mtd = monthToDate()
        const [wideRes, mtdRes] = await Promise.all([
          api.get('/api/ranking', { params: { ...wide, include_archived: true } }),
          api.get('/api/ranking', { params: { ...mtd, include_archived: true } }),
        ])
        if (cancelled) return
        setData(wideRes.data)
        // Split present_days into on-time vs late so the card shows three
        // counts that add up to the working days elapsed this month.
        setMonthCounts(
          new Map(
            mtdRes.data.map((r) => [
              r.employee_id,
              {
                present: Math.max(0, r.present_days - r.late_days),
                late: r.late_days,
                absent: r.absent_days,
              },
            ]),
          ),
        )
      } catch {
        if (!cancelled) setError('employees.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api])

  // Paused/archived staff are hidden unless the "Arxiv" pill is on — same
  // rows as before, just filtered client-side now that everything is
  // fetched up front.
  const visibleData = useMemo(
    () => (showArchived ? data : data.filter((e) => e.status === 'active')),
    [data, showArchived],
  )
  const archivedCount = useMemo(() => data.filter((e) => e.status !== 'active').length, [data])

  const departmentOptions = useMemo(() => {
    const set = new Set(visibleData.map((e) => e.department).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [visibleData])

  // Distinct positions with counts, most common first — cascaded to the
  // selected department so the pill row only offers positions that exist
  // there. "Barchasi" department => the full unfiltered list.
  const positionCounts = useMemo(() => {
    const counts = new Map()
    for (const e of visibleData) {
      if (!e.position) continue
      if (department && e.department !== department) continue
      counts.set(e.position, (counts.get(e.position) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [visibleData, department])

  // Clear the position filter when it no longer applies — either an
  // archive-toggle flip or a department change that cascades it away.
  useEffect(() => {
    if (position && !positionCounts.some(([p]) => p === position)) setF('pos', null)
  }, [position, positionCounts, setF])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = visibleData.filter((e) => {
      if (department && e.department !== department) return false
      if (position && e.position !== position) return false
      if (q && !e.full_name?.toLowerCase().includes(q)) return false
      return true
    })
    return sortRows(rows, sort)
  }, [visibleData, search, department, position, sort])

  useScrollRestoration(!loading && data.length > 0)

  const departmentPillOptions = [
    { value: null, label: t('filters.all') },
    ...departmentOptions.map((d) => ({ value: d, label: d })),
  ]
  const positionPillOptions = [
    { value: null, label: t('filters.allPositions') },
    ...positionCounts.map(([p, count]) => ({ value: p, label: p, count })),
  ]

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        {t('nav.employees')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{t('employees.countSubtitle', { filtered: filtered.length, total: visibleData.length })}</p>

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <FilterBar
        search={search}
        onSearchChange={(v) => setF('q', v)}
        sort={sort}
        onSortChange={(v) => setF('sort', v)}
        sortOptions={SORT_OPTIONS}
      >
        {/* Department / archive / position pill rows — kept inside FilterBar's
            sticky container (see its `children` slot) so they stay pinned
            together with the search bar, matching the sticky behaviour the
            rest of the filter UI already has. */}
        <div data-testid="employee-filter-pills" className="flex flex-col gap-2.5 mt-3">
          <PillGroup options={departmentPillOptions} value={department} onChange={(v) => setF('dept', v)} />
          <PillGroup
            options={[{ value: 'archived', label: t('employees.archivePill'), count: archivedCount }]}
            value={showArchived ? 'archived' : null}
            onChange={() => setF('archived', !showArchived)}
          />
          <PillGroup options={positionPillOptions} value={position} onChange={(v) => setF('pos', v)} />
        </div>
      </FilterBar>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        {filtered.map((emp, i) => (
          <motion.div
            key={emp.employee_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}
            whileHover={{ scale: 1.03, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/employees/${emp.employee_id}`)}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface p-4 shadow-lg shadow-black/20 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={emp.profile_image} name={emp.full_name} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-medium truncate">{emp.full_name}</p>
                    {STATUS_TAG[emp.status] && (
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_TAG[emp.status].className}`}>
                        {t(STATUS_TAG[emp.status].labelKey)}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs truncate">
                    {emp.department} · {emp.position}
                  </p>
                </div>
              </div>
              <AttendanceBadge
                score={emp.attendance_rate}
                label={t('common.attendance')}
                presentDays={emp.present_days}
                expectedDays={emp.expected_working_days}
                excusedDays={emp.excused_absence_days}
                periodLabel={t('attendanceBreakdown.last30')}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-white/50">
              <span className="whitespace-nowrap">
                {t('employees.mtdPresent')}: {monthCounts.get(emp.employee_id)?.present ?? 0}
              </span>
              <span className="whitespace-nowrap">
                {t('employees.mtdLate')}: {monthCounts.get(emp.employee_id)?.late ?? 0}
              </span>
              <span className="whitespace-nowrap">
                {t('employees.mtdAbsent')}: {monthCounts.get(emp.employee_id)?.absent ?? 0}
              </span>
            </div>
          </motion.div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-white/40 text-sm col-span-full text-center py-8">
            {t(data.length === 0 ? 'employees.notFound' : 'filters.noResults')}
          </p>
        )}
      </div>
    </div>
  )
}
