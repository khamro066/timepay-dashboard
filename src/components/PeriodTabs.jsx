import { motion } from 'framer-motion'

const TABS = ['Today', 'Week', 'Month']

export default function PeriodTabs({ period, onChange }) {
  return (
    <div className="inline-flex bg-white/5 rounded-xl p-1 mb-6">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className="relative px-4 py-1.5 text-sm font-medium"
        >
          {period === tab && (
            <motion.div
              layoutId="period-tab-indicator"
              className="absolute inset-0 rounded-lg bg-violet-600"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className={`relative z-10 ${period === tab ? 'text-white' : 'text-white/50'}`}>{tab}</span>
        </button>
      ))}
    </div>
  )
}
