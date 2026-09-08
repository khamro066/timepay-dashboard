import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ListNavRow({ leading, title, subtitle, trailing, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center gap-3 py-3 border-b border-white/5 last:border-0 text-left min-h-[44px]"
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="text-white font-medium truncate">{title}</p>
        {subtitle && <p className="text-white/40 text-xs truncate">{subtitle}</p>}
      </div>
      {trailing}
      <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
    </motion.button>
  )
}
