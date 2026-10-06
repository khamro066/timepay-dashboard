import { motion } from 'framer-motion'
import { CalendarRange } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'
import FilterBar from '../components/FilterBar'
import ScheduleDayList from '../components/ScheduleDayList'
import ScheduleMatrix from '../components/ScheduleMatrix'
import { boolParam, enumParam, strParam, useFilterParams } from '../hooks/useFilterParams'
import { useScrollRestoration } from '../hooks/useScrollRestoration'
import { todayStr } from '../utils/dateRange'

// Longest custom range we'll render — a company-wide grid past a quarter is
// both a heavy response and an unreadable wall of cells.
const MAX_DAYS = 92

function getDateRange(period, customRange, selectedDate) {
  if (period === 'Custom') {
    return { date_from: customRange?.date_from || '', date_to: customRange?.date_to || '' }
  }
  if (period === 'Today') return { date_from: selectedDate, date_to: selectedDate }
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

function spanInDays(date_from, date_to) {
  return Math.round((new Date(date_to) - new Date(date_from)) / 86400000) + 1
}

// Filter state is kept in the URL query string so back/forward and reload
// restore it — see useFilterParams.
const FILTER_SPEC = {
  q: { default: '' },
  dept: strParam,
  archived: boolParam,
  period: enumParam('Week'),
  day: strParam,
  df: { default: '' },
  dt: { default: '' },
}

export default function Schedule() {
  const { t } = useTranslation()
  const api = useApi()
  const [f, setF] = useFilterParams(FILTER_SPEC)
  const { q: search, dept: department, archived: showArchived, period } = f
  const selectedDate = f.day || todayStr()
  const customRange = useMemo(() => ({ date_from: f.df, date_to: f.dt }), [f.df, f.dt])
  const isDayMode = period === 'Today'
  const [matrixData, setMatrixData] = useState(null)
  const [dayData, setDayData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { date_from, date_to } = getDateRange(period, customRange, selectedDate)
  const rangeReady = Boolean(date_from && date_to && date_from <= date_to)
  const rangeTooWide = rangeReady && spanInDays(date_from, date_to) > MAX_DAYS

  // Single-day mode reuses the dashboard's per-employee breakdown endpoint
  // (already has avatar/status/check-in/out shape) instead of the matrix —
  // a one-column grid is awkward, see ScheduleDayList.
  useEffect(() => {
    if (!isDayMode) return
    let cancelled = false
    setLoading(true)
    setError('')
    api
      .get('/api/company/daily-breakdown', { params: { date: selectedDate, include_archived: showArchived } })
      .then((res) => {
        if (!cancelled) setDayData(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('schedule.loadError')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, isDayMode, selectedDate, showArchived])

  useEffect(() => {
    if (isDayMode || !rangeReady || rangeTooWide) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/schedule-matrix', {
          params: { date_from, date_to, include_archived: showArchived },
        })
        if (!cancelled) setMatrixData(res.data)
      } catch {
        if (!cancelled) setError('schedule.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, isDayMode, date_from, date_to, showArchived, rangeReady, rangeTooWide])

  const rawEmployees = useMemo(
    () => (isDayMode ? (dayData?.employees ?? []) : (matrixData?.employees ?? [])),
    [isDayMode, dayData, matrixData],
  )

  const departmentOptions = useMemo(() => {
    return [...new Set(rawEmployees.map((e) => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }, [rawEmployees])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rawEmployees.filter((e) => {
      if (department && e.department !== department) return false
      if (q && !e.full_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [rawEmployees, search, department])

  const totalEmployees = rawEmployees.length
  const hasData = isDayMode ? Boolean(dayData) : Boolean(matrixData)

  useScrollRestoration(!loading && filteredEmployees.length > 0)

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white mb-1">
        {t('nav.schedule')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">
        {hasData && rangeReady && !rangeTooWide
          ? isDayMode
            ? t('departments.employeeCount', { count: filteredEmployees.length })
            : t('schedule.subtitle', { employees: filteredEmployees.length, days: matrixData.dates.length })
          : t('schedule.tagline')}
      </p>

      <FilterBar
        search={search}
        onSearchChange={(v) => setF('q', v)}
        department={department}
        onDepartmentChange={(v) => setF('dept', v)}
        departmentOptions={departmentOptions}
        period={period}
        onPeriodChange={(v) => setF('period', v)}
        selectedDate={selectedDate}
        onSelectedDateChange={(d) => setF('day', d)}
        onDayPresetChange={(d) => setF({ period: 'Today', day: d })}
        customRange={customRange}
        onCustomRangeChange={(r) => setF({ df: r.date_from, dt: r.date_to })}
        dateFrom={date_from}
        dateTo={date_to}
        showArchived={showArchived}
        onShowArchivedChange={(v) => setF('archived', v)}
        resultShown={filteredEmployees.length}
        resultTotal={totalEmployees}
      />

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      {rangeTooWide && (
        <p className="text-white/50 text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
          {t('schedule.rangeTooWide', { max: MAX_DAYS })}
        </p>
      )}

      {!rangeReady && !rangeTooWide && (
        <p className="text-white/40 text-sm text-center py-8">{t('schedule.pickRange')}</p>
      )}

      {rangeReady && !rangeTooWide && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}
        >
          {hasData && filteredEmployees.length > 0 ? (
            isDayMode ? (
              <ScheduleDayList employees={filteredEmployees} />
            ) : (
              <ScheduleMatrix dates={matrixData.dates} employees={filteredEmployees} />
            )
          ) : (
            !loading && (
              <div className="flex flex-col items-center gap-2 py-12 text-white/40">
                <CalendarRange className="w-8 h-8 text-white/20" />
                <p className="text-sm">{t(totalEmployees === 0 ? 'schedule.noData' : 'filters.noResults')}</p>
              </div>
            )
          )}
        </motion.div>
      )}
    </div>
  )
}
