import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'

function pad(n) {
  return String(n).padStart(2, '0')
}

function monthBounds(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  return { first, last, daysInMonth: last.getDate() }
}

function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

// Monday-first weekday index (0=Mon..6=Sun), matching the region's week convention.
function mondayIndex(date) {
  return (date.getDay() + 6) % 7
}

const LEGEND_KEYS = ['present', 'late', 'absent', 'excused', 'holiday', 'dayOff']

const CELL_COLORS = {
  present: '#2dd4bf',
  late: '#fbbf24',
  absent: '#f87171',
  excused: '#a78bfa',
  holiday: '#818cf8',
}

function cellStatusKey(day) {
  if (!day) return null
  if (day.is_holiday) return 'holiday'
  if (!day.is_working_day) return 'dayOff'
  if (day.absent && day.excused) return 'excused'
  if (day.absent) return 'absent'
  if (day.late) return 'late'
  return 'present'
}

const STATUS_LABEL_KEY = {
  present: 'employeeDetail.statusPresent',
  late: 'employeeDetail.statusLate',
  absent: 'employeeDetail.statusAbsent',
  excused: 'employeeDetail.statusExcused',
  holiday: 'employeeDetail.statusHoliday',
  dayOff: 'employeeDetail.statusDayOff',
}

export default function EmployeeCalendarHeatmap({ employeeId }) {
  const { t } = useTranslation()
  const api = useApi()
  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const [monthKey, setMonthKey] = useState(currentMonthKey)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { last } = monthBounds(monthKey)
        const today = new Date()
        const cappedLast = last > today ? today : last
        const date_from = `${monthKey}-01`
        const date_to = `${cappedLast.getFullYear()}-${pad(cappedLast.getMonth() + 1)}-${pad(cappedLast.getDate())}`
        if (date_from > date_to) {
          if (!cancelled) setDays([])
          return
        }
        const res = await api.get(`/api/employees/${employeeId}/summary`, { params: { date_from, date_to } })
        if (!cancelled) setDays(res.data.days || [])
      } catch {
        if (!cancelled) setDays([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, employeeId, monthKey])

  const grid = useMemo(() => {
    const { first, daysInMonth } = monthBounds(monthKey)
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]))
    const leadingBlanks = mondayIndex(first)
    const cells = Array(leadingBlanks).fill(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthKey}-${pad(day)}`
      cells.push({ dateStr, day, data: byDate[dateStr] || null })
    }
    return cells
  }, [monthKey, days])

  const months = t('employeeDetail.calendarMonths', { returnObjects: true })
  const weekdays = t('employeeDetail.calendarWeekdays', { returnObjects: true })
  const [year, month] = monthKey.split('-').map(Number)
  const monthLabel = `${months[month - 1]} ${year}`
  const canGoNext = monthKey < currentMonthKey

  return (
    <div className="glass-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">{t('employeeDetail.calendarTitle')}</h3>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonthKey((m) => shiftMonth(m, -1))}
            aria-label="previous month"
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/70 text-sm font-medium min-w-[120px] text-center">{monthLabel}</span>
          <button
            type="button"
            onClick={() => canGoNext && setMonthKey((m) => shiftMonth(m, 1))}
            disabled={!canGoNext}
            aria-label="next month"
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {weekdays.map((label, i) => (
            <div key={i} className="text-center text-white/30 text-[10px] font-medium">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((cell, i) => {
            if (!cell) return <div key={`blank-${i}`} />
            const statusKey = cellStatusKey(cell.data)
            const isNeutral = !statusKey || statusKey === 'dayOff'
            const color = statusKey ? CELL_COLORS[statusKey] : null
            return (
              <div
                key={cell.dateStr}
                title={statusKey ? `${cell.dateStr} — ${t(STATUS_LABEL_KEY[statusKey])}` : cell.dateStr}
                className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium"
                style={{
                  backgroundColor: isNeutral ? 'rgba(255,255,255,0.05)' : `${color}26`,
                  color: isNeutral ? 'rgba(255,255,255,0.3)' : color,
                }}
              >
                {cell.day}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/5">
        {LEGEND_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CELL_COLORS[key] ?? 'rgba(255,255,255,0.2)' }}
            />
            <span className="text-white/50 text-xs">{t(STATUS_LABEL_KEY[key])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
