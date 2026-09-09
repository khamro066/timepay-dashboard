// Canonical attendance status colour language, shared by anything that
// paints per-day attendance cells (the company schedule matrix, and — same
// hex values — the Employee-detail calendar heatmap). Keep these in sync
// with the backend statuses returned by /api/schedule-matrix.
//
//   teal   on-time      amber  late        red   absent
//   violet excused      indigo holiday     dim   day off / no data
export const STATUS_COLORS = {
  on_time: '#2dd4bf',
  late: '#fbbf24',
  absent: '#f87171',
  excused: '#a78bfa',
  holiday: '#818cf8',
}

// Statuses with no coloured fill — drawn as a faint/empty cell.
export const NEUTRAL_STATUSES = new Set(['day_off', 'no_data'])

export const STATUS_LABEL_KEY = {
  on_time: 'schedule.statusOnTime',
  late: 'schedule.statusLate',
  absent: 'schedule.statusAbsent',
  excused: 'schedule.statusExcused',
  holiday: 'schedule.statusHoliday',
  day_off: 'schedule.statusDayOff',
  no_data: 'schedule.statusNoData',
}

// Legend order. day_off + no_data share one neutral swatch, so no_data is
// covered by the day_off row's label ("dam olish / ma'lumot yo'q").
export const LEGEND_STATUSES = ['on_time', 'late', 'absent', 'excused', 'holiday', 'day_off']

// Monday-first weekday index (0=Mon .. 6=Sun) for a 'YYYY-MM-DD' string,
// parsed as a local date so it doesn't drift a day across time zones.
export function weekdayIndex(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

export function dayOfMonth(dateStr) {
  return Number(dateStr.slice(8, 10))
}
