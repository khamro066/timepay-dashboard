import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Same interaction pattern as AttendanceBadge: a button that reveals an
// absolute-positioned panel anchored below it, closing on outside
// click/Escape so it never reflows the row it sits in.
export default function CorrectionHistoryTag({ corrections }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!corrections || corrections.length === 0) return null

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 transition-colors"
      >
        {t('corrections.tag')}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full z-30 mt-1.5 w-72 max-w-[85vw] cursor-default"
          >
            <div className="rounded-xl bg-surface-light border border-white/10 shadow-xl shadow-black/40 p-3 flex flex-col gap-2.5">
              <p className="text-white/45 text-[10px] font-semibold uppercase tracking-wide">
                {t('corrections.historyTitle')}
              </p>
              {corrections.map((c) => (
                <div key={c.id} className="text-xs border-t border-white/5 pt-2 first:border-0 first:pt-0">
                  {c.corrected_check_in && (
                    <p className="text-white/70">
                      {t('corrections.timeChangeIn', { from: c.original_check_in ?? '—', to: c.corrected_check_in })}
                    </p>
                  )}
                  {c.corrected_check_out && (
                    <p className="text-white/70">
                      {t('corrections.timeChangeOut', { from: c.original_check_out ?? '—', to: c.corrected_check_out })}
                    </p>
                  )}
                  <p className="text-white/50 mt-1">{c.reason}</p>
                  <p className="text-white/30 text-[10px] mt-1">
                    {t('corrections.byLine', { user: c.corrected_by_username ?? '—', date: (c.created_at || '').slice(0, 16).replace('T', ' ') })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
