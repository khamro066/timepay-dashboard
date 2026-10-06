// Local-calendar-day date strings ("YYYY-MM-DD"), shared by every page that
// computes a date range or compares a date to "today"/"yesterday". Plain
// `new Date().toISOString().slice(0, 10)` is UTC, which silently shifts a
// day for anyone east of Greenwich in the early hours — including right
// around the Bugun/Kecha boundary this is most likely to be checked near.
export function todayStr() {
  return localDateStr(new Date())
}

export function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function shiftDateStr(dateStr, delta) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + delta)
  return localDateStr(d)
}

export function yesterdayStr() {
  return shiftDateStr(todayStr(), -1)
}
