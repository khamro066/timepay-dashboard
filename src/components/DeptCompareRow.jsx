import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { colorForKey } from '../utils/colorHash'

export default function DeptCompareRow({ department, employeeCount, attendanceRatio, lateIncidents, absentDays, onClick }) {
  const { t } = useTranslation()
  const color = colorForKey(department).hex
  const pct = Math.round(Math.max(0, Math.min(1, attendanceRatio ?? 0)) * 100)

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 2 }}
      className="py-3.5 border-b border-white/5 last:border-0 cursor-pointer"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="font-semibold text-white flex-1 truncate">{department}</span>
        <span className="font-bold text-sm tabular-nums shrink-0" style={{ color }}>{pct}%</span>
        <span className="text-white/40 text-xs shrink-0">{t('departments.employeeCount', { count: employeeCount })}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/40">
        <span>{t('departments.captionLate', { count: lateIncidents ?? 0 })}</span>
        <span>{t('departments.captionAbsent', { count: absentDays })}</span>
      </div>
    </motion.div>
  )
}
