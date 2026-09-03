import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import FilterBar from '../components/FilterBar'
import ScoreBadge from '../components/ScoreBadge'

function last30Days() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: end.toISOString().slice(0, 10) }
}

const SORT_OPTIONS = [
  { value: 'score_desc', labelKey: 'filters.sortScoreDesc' },
  { value: 'score_asc', labelKey: 'filters.sortScoreAsc' },
  { value: 'name_asc', labelKey: 'filters.sortNameAsc' },
]

function sortRows(rows, sort) {
  const sorted = [...rows]
  switch (sort) {
    case 'score_asc':
      return sorted.sort((a, b) => (a.overall_score ?? -1) - (b.overall_score ?? -1))
    case 'name_asc':
      return sorted.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    case 'score_desc':
    default:
      return sorted.sort((a, b) => (b.overall_score ?? -1) - (a.overall_score ?? -1))
  }
}

export default function Employees() {
  const { t } = useTranslation()
  const api = useApi()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState(null)
  const [sort, setSort] = useState('score_desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { date_from, date_to } = last30Days()
        const res = await api.get('/api/ranking', { params: { date_from, date_to } })
        if (!cancelled) setData(res.data)
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

  const departmentOptions = useMemo(() => {
    const set = new Set(data.map((e) => e.department).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = data.filter((e) => {
      if (department && e.department !== department) return false
      if (q && !e.full_name?.toLowerCase().includes(q)) return false
      return true
    })
    return sortRows(rows, sort)
  }, [data, search, department, sort])

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        {t('nav.employees')}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{t('employees.countSubtitle', { filtered: filtered.length, total: data.length })}</p>

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        departmentOptions={departmentOptions}
        sort={sort}
        onSortChange={setSort}
        sortOptions={SORT_OPTIONS}
        resultShown={filtered.length}
        resultTotal={data.length}
      />

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
                  <p className="text-white font-medium truncate">{emp.full_name}</p>
                  <p className="text-white/40 text-xs truncate">
                    {emp.department} · {emp.position}
                  </p>
                </div>
              </div>
              <ScoreBadge score={emp.overall_score} label={t('common.overallScore')} />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-white/50">
              <span>
                {t('employees.late')}: {emp.late_days}
              </span>
              <span>
                {t('employees.absent')}: {emp.absent_days}
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
