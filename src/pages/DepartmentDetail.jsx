import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import AttendanceBadge from '../components/AttendanceBadge'
import Avatar from '../components/Avatar'
import ListNavRow from '../components/ListNavRow'
import PeriodTabs from '../components/PeriodTabs'

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
        if (!cancelled) {
          // Order by the attendance % we display, not the API's default sort.
          setData([...res.data].sort((a, b) => (b.attendance_rate ?? -1) - (a.attendance_rate ?? -1)))
        }
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`glass-card rounded-2xl px-5 transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}
      >
        {data.map((emp) => (
          <ListNavRow
            key={emp.employee_id}
            leading={<Avatar src={emp.profile_image} name={emp.full_name} size="md" />}
            title={emp.full_name}
            subtitle={emp.position}
            trailing={
              <AttendanceBadge
                score={emp.attendance_rate}
                label={t('common.attendance')}
                presentDays={emp.present_days}
                expectedDays={emp.expected_working_days}
                excusedDays={emp.excused_absence_days}
              />
            }
            onClick={() => navigate(`/employees/${emp.employee_id}`)}
          />
        ))}
        {!loading && data.length === 0 && <p className="text-white/40 text-sm text-center py-8">{t('employees.notFound')}</p>}
      </motion.div>
    </div>
  )
}
