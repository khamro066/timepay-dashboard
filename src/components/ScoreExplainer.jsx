import { AnimatePresence, motion } from 'framer-motion'
import { Info, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function ScoreExplainer() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={t('common.howCalculated')}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
          open ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'
        }`}
      >
        <Info className="w-3.5 h-3.5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full left-0 mt-2 w-72 max-w-[85vw] rounded-2xl border border-white/10 bg-surface-light shadow-xl shadow-black/40 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-sm font-semibold">{t('common.howCalculated')}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <dl className="flex flex-col gap-3 text-xs">
                <div>
                  <dt className="text-teal-300 font-semibold mb-0.5">{t('common.attendanceRate')}</dt>
                  <dd className="text-white/60 leading-relaxed">{t('common.attendanceExplain')}</dd>
                </div>
                <div>
                  <dt className="text-amber-300 font-semibold mb-0.5">{t('common.punctualityRate')}</dt>
                  <dd className="text-white/60 leading-relaxed">{t('common.punctualityExplain')}</dd>
                </div>
                <div>
                  <dt className="text-violet-300 font-semibold mb-0.5">{t('common.overallScore')}</dt>
                  <dd className="text-white/60 leading-relaxed">{t('common.overallScoreExplain')}</dd>
                </div>
              </dl>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
