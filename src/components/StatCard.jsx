import { motion } from 'framer-motion'
import CountUp from './CountUp'

const gradients = {
  purple: 'from-violet-600/20 to-violet-900/5 border-violet-500/20',
  teal: 'from-teal-500/20 to-teal-900/5 border-teal-400/20',
  amber: 'from-amber-500/20 to-amber-900/5 border-amber-400/20',
  red: 'from-red-500/20 to-red-900/5 border-red-400/20',
}

const iconClasses = {
  purple: 'text-violet-300 bg-violet-500/10',
  teal: 'text-teal-300 bg-teal-500/10',
  amber: 'text-amber-300 bg-amber-500/10',
  red: 'text-red-300 bg-red-500/10',
}

export default function StatCard({ label, value, icon: Icon, tone = 'purple' }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, filter: 'brightness(1.12)' }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`rounded-2xl border bg-gradient-to-br ${gradients[tone]} p-5 shadow-lg shadow-black/20 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-sm font-medium">{label}</span>
        <div className={`p-2 rounded-lg ${iconClasses[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">
        <CountUp value={value} />
      </div>
    </motion.div>
  )
}
