import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const TABS = [
  { value: 'Today', key: 'period.today' },
  { value: 'Week', key: 'period.week' },
  { value: 'Month', key: 'period.month' },
]

export default function PeriodTabs({ period, onChange }) {
  const { t } = useTranslation()

  return (
    <div className="inline-flex bg-white/5 rounded-xl p-1 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className="relative px-4 py-3 md:py-1.5 text-sm font-medium"
        >
          {period === tab.value && (
            <motion.div
              layoutId="period-tab-indicator"
              className="absolute inset-0 rounded-lg bg-violet-600"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className={`relative z-10 ${period === tab.value ? 'text-white' : 'text-white/50'}`}>
            {t(tab.key)}
          </span>
        </button>
      ))}
    </div>
  )
}
