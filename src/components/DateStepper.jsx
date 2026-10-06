import { ChevronLeft, ChevronRight } from 'lucide-react'
import { shiftDateStr } from '../utils/dateRange'

// date/onChange/maxDate drive a specific single day: prev/next arrows step
// by one day (next disabled once `date` is already `maxDate`, so this can
// never reach into the future), and the date itself is a real native
// <input type="date">, not a plain label — tapping it opens the browser's
// own calendar picker to jump straight to any day.
export default function DateStepper({ date, onChange, maxDate }) {
  const nextDate = shiftDateStr(date, 1)
  const canGoNext = !maxDate || nextDate <= maxDate

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(shiftDateStr(date, -1))}
        aria-label="previous day"
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <input
        type="date"
        value={date}
        max={maxDate}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label="pick a date"
        className="[color-scheme:dark] bg-transparent text-white/70 text-sm tabular-nums text-center rounded-lg px-1 py-1 min-w-[128px] border border-transparent hover:border-white/10 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
      />
      <button
        type="button"
        onClick={() => canGoNext && onChange(nextDate)}
        disabled={!canGoNext}
        aria-label="next day"
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
