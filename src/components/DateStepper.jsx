import { ChevronLeft, ChevronRight } from 'lucide-react'

function shiftDate(dateStr, delta) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

export default function DateStepper({ date, onChange, maxDate }) {
  const nextDate = shiftDate(date, 1)
  const canGoNext = !maxDate || nextDate <= maxDate

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(shiftDate(date, -1))}
        aria-label="previous day"
        className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-white/40 text-sm tabular-nums min-w-[86px] text-center">{date}</span>
      <button
        type="button"
        onClick={() => canGoNext && onChange(nextDate)}
        disabled={!canGoNext}
        aria-label="next day"
        className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
