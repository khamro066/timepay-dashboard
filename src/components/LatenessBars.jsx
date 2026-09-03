import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const BUCKET_META = [
  { key: 'on_time', labelKey: 'reports.bucketOnTime', color: '#2dd4bf' },
  { key: 'late_5_15', labelKey: 'reports.bucketLate5_15', color: '#fbbf24' },
  { key: 'late_15_30', labelKey: 'reports.bucketLate15_30', color: '#fb923c' },
  { key: 'late_30_plus', labelKey: 'reports.bucketLate30Plus', color: '#f87171' },
]

export default function LatenessBars({ buckets }) {
  const { t } = useTranslation()
  const byKey = Object.fromEntries((buckets || []).map((b) => [b.key, b]))

  return (
    <div className="flex flex-col gap-4">
      {BUCKET_META.map((meta) => {
        const bucket = byKey[meta.key] ?? { count: 0, pct: 0 }
        return (
          <div key={meta.key}>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="flex-1 text-white text-sm font-medium">{t(meta.labelKey)}</span>
              <span className="font-bold tabular-nums" style={{ color: meta.color }}>
                {bucket.pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${bucket.pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1.5">{t('reports.lateIncidentsHint', { count: bucket.count })}</p>
          </div>
        )
      })}
    </div>
  )
}
