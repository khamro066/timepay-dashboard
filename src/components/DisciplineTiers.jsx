import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const TIER_META = [
  { key: 'perfect', labelKey: 'ranking.tierPerfect', color: '#2dd4bf' },
  { key: 'tier95', labelKey: 'ranking.tier95', color: '#5eead4' },
  { key: 'tier85', labelKey: 'ranking.tier85', color: '#fbbf24' },
  { key: 'tier60', labelKey: 'ranking.tier60', color: '#fb923c' },
  { key: 'low', labelKey: 'ranking.tierLow', color: '#f87171' },
]

export default function DisciplineTiers({ total, counts, lowNames }) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex flex-col gap-4">
        {TIER_META.map((meta) => {
          const count = counts[meta.key] ?? 0
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={meta.key}>
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="flex-1 text-white text-sm font-medium">{t(meta.labelKey)}</span>
                <span className="font-bold tabular-nums" style={{ color: meta.color }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: meta.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
              <p className="text-white/40 text-xs mt-1.5">{t('ranking.tierEmployeeCount', { count })}</p>
            </div>
          )
        })}
      </div>

      {lowNames.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-2.5">
            {t('ranking.tierLowNamesTitle', { count: lowNames.length })}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lowNames.map((name) => (
              <span key={name} className="px-2.5 py-1 rounded-full text-xs font-medium text-red-300 bg-red-500/15">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
