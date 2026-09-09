import { motion } from 'framer-motion'
import { CalendarRange } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'
import FilterBar from '../components/FilterBar'
import ScheduleMatrix from '../components/ScheduleMatrix'

// Longest custom range we'll render — a company-wide grid past a quarter is
// both a heavy response and an unreadable wall of cells.
const MAX_DAYS = 92

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

function spanInDays(date_from, date_to) {
  return Math.round((new Date(date_to) - new Date(date_from)) / 86400000) + 1
}

export default function Schedule() {
  const { t } = useTranslation()
  const api = useApi()
  const [period, setPeriod] = useState('Week')
  const [customRange, setCustomRange] = useState({ date_from: '', date_to: '' })
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { date_from, date_to } = getDateRange(period, customRange)
  const rangeReady = Boolean(date_from && date_to && date_from <= date_to)
  const rangeTooWide = rangeReady && spanInDays(date_from, date_to) > MAX_DAYS

  useEffect(() => {
    if (!rangeReady || rangeTooWide) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/schedule-matrix', {
          params: { date_from, date_to, include_archived: showArchived },
        })
        if (!cancelled) setData(res.data)
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
  }, [api, date_from, date_to, showArchived, rangeReady, rangeTooWide])

  const departmentOptions = useMemo(() => {
    if (!data) return []
    return [...new Set(data.employees.map((e) => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }, [data])

  const filteredEmployees = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.employees.filter((e) => {
      if (department && e.department !== department) return false
      if (q && !e.full_name?.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, search, department])

  const totalEmployees = data?.employees.length ?? 0

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold text-white mb-1">
        {t('nav.schedule')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">
        {data && rangeReady && !rangeTooWide
          ? `${t('schedule.subtitle', { employees: filteredEmployees.length, days: data.dates.length })} · ${data.date_from} — ${data.date_to}`
          : t('schedule.tagline')}
      </p>

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
          {data && filteredEmployees.length > 0 ? (
            <ScheduleMatrix dates={data.dates} employees={filteredEmployees} />
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
