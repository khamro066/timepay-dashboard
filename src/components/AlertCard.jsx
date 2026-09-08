import { motion } from 'framer-motion'

const TONE_BORDER = {
  bad: 'border-l-red-400',
  warn: 'border-l-amber-400',
  ok: 'border-l-teal-400',
}

const TONE_ICON = {
  bad: 'text-red-300 bg-red-500/15',
  warn: 'text-amber-300 bg-amber-500/15',
  ok: 'text-teal-300 bg-teal-500/15',
}

export default function AlertCard({ icon: Icon, title, subtitle, actionLabel, onAction, tone = 'bad' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl border-l-4 ${TONE_BORDER[tone]} p-4 mb-6`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`shrink-0 p-2 rounded-xl ${TONE_ICON[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold">{title}</p>
          {subtitle && <p className="text-white/45 text-sm mt-0.5">{subtitle}</p>}
          {actionLabel && (
            <motion.button
              type="button"
              onClick={onAction}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="mt-3 inline-flex items-center px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
            >
              {actionLabel}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
