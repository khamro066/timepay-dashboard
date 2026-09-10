import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

// A tap-to-navigate list row. Rendered as a div (not a <button>) so callers
// can place their own interactive controls in `trailing` — a nested button
// is invalid markup. Keyboard access is preserved via role/tabIndex.
export default function ListNavRow({ leading, title, subtitle, trailing, onClick }) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        // Only when the row itself has focus — never when a control inside
        // `trailing` (e.g. the attendance badge) is the one being keyed.
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center gap-3 py-3 border-b border-white/5 last:border-0 text-left min-h-[44px] cursor-pointer"
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="text-white font-medium truncate">{title}</p>
        {subtitle && <p className="text-white/40 text-xs truncate">{subtitle}</p>}
      </div>
      {trailing}
      <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
    </motion.div>
  )
}
