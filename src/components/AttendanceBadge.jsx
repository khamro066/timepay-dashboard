import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AttendanceBreakdownPanel from './AttendanceBreakdownPanel'
import ScoreBadge from './ScoreBadge'

// ScoreBadge that reveals its calculation on tap. The panel is anchored
// below the badge (absolute, right-aligned) rather than inline, so opening
// it never reflows the row/card it sits in — important where the badge is a
// compact trailing element in a tight horizontal row (DepartmentDetail).
// The badge is a real <button>, so every caller must be a non-button
// element; we stop propagation so opening the panel doesn't also fire the
// row's navigation.
export default function AttendanceBadge({
  score,
  label,
  size = 'md',
  presentDays,
  expectedDays,
  excusedDays = 0,
  periodLabel,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const canExplain = typeof expectedDays === 'number'

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

  function toggle(e) {
    e.stopPropagation()
    e.preventDefault()
    if (canExplain) setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={(e) => e.stopPropagation()}
        aria-expanded={open}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ScoreBadge
          score={score}
          label={label}
          size={size}
          trailing={
            canExplain ? (
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/30">
                <ChevronDown className="w-3 h-3" />
              </motion.span>
            ) : null
          }
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full z-30 mt-1.5 w-60 max-w-[75vw] cursor-default"
          >
            <div className="shadow-xl shadow-black/40 rounded-xl">
              <AttendanceBreakdownPanel
                presentDays={presentDays}
                expectedDays={expectedDays}
                rate={score}
                excusedDays={excusedDays}
                periodLabel={periodLabel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
