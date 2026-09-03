import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import Avatar from '../components/Avatar'
import PeriodTabs from '../components/PeriodTabs'
import ScoreBadge from '../components/ScoreBadge'

function getDateRange(period) {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  if (period === 'Week') start.setDate(start.getDate() - 6)
  if (period === 'Month') start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

export default function DepartmentDetail() {
  const { t } = useTranslation()
  const { name } = useParams()
  const department = decodeURIComponent(name)
  const navigate = useNavigate()
  const api = useApi()
  const [period, setPeriod] = useState('Month')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { date_from, date_to } = getDateRange(period)
        const res = await api.get('/api/ranking', { params: { date_from, date_to, department } })
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setError('departments.loadError')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, period, department])

  return (
    <div>
      <motion.button
        type="button"
        onClick={() => navigate('/departments')}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors min-h-[44px] -ml-1 pl-1"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('employeeDetail.back')}
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-1"
      >
        {department}
      </motion.h1>
      <p className="text-white/40 text-sm mb-4">{t('departments.employeeCount', { count: data.length })}</p>

      <PeriodTabs period={period} onChange={setPeriod} />

      {error && <p className="text-red-400 mb-4 text-sm">{t(error)}</p>}

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}
      >
        {data.map((emp, i) => (
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
                  <p className="text-white/40 text-xs truncate">{emp.position}</p>
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
        {!loading && data.length === 0 && (
          <p className="text-white/40 text-sm col-span-full text-center py-8">{t('employees.notFound')}</p>
        )}
      </div>
    </div>
  )
}
