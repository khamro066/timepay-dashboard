import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LEGEND_STATUSES,
  NEUTRAL_STATUSES,
  STATUS_COLORS,
  STATUS_LABEL_KEY,
  dayOfMonth,
  weekdayIndex,
} from '../utils/attendanceStatus'
import Avatar from './Avatar'

// day_off and no_data share the neutral swatch, so the legend entry for
// day_off carries a label that covers both.
const LEGEND_LABEL_KEY = { ...STATUS_LABEL_KEY, day_off: 'schedule.legendNeutral' }

// Fixed 7 × 26px column tracks for the mobile per-employee calendar grids
// (and their shared weekday header), so cells stay small and aligned.
const MOBILE_GRID = 'repeat(7, 1.625rem)'

function groupByDepartment(employees) {
  const groups = []
  let current = null
  for (const emp of employees) {
    const dept = emp.department || '—'
    if (!current || current.department !== dept) {
      current = { department: dept, employees: [] }
      groups.push(current)
    }
    current.employees.push(emp)
  }
  return groups
}

function cellBackground(status) {
  if (status === 'no_data') return 'rgba(255,255,255,0.05)'
  if (NEUTRAL_STATUSES.has(status)) return 'rgba(255,255,255,0.11)'
  return STATUS_COLORS[status] || 'rgba(255,255,255,0.05)'
}

function Legend() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/5">
      {LEGEND_STATUSES.map((key) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: STATUS_COLORS[key] ?? 'rgba(255,255,255,0.14)' }}
          />
          <span className="text-white/50 text-xs">{t(LEGEND_LABEL_KEY[key])}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScheduleMatrix({ dates, employees }) {
  const { t } = useTranslation()
  const groups = useMemo(() => groupByDepartment(employees), [employees])
  const weekdayLabels = t('employeeDetail.calendarWeekdays', { returnObjects: true })
  const leadingBlanks = dates.length ? weekdayIndex(dates[0]) : 0

  if (!dates.length) return null

  return (
    <div>
      {/* Desktop: sticky-first-column matrix, single horizontal scroll region.
          w-fit keeps the card hugging the grid instead of a wide empty panel.
          The scroll lives on an inner div with no padding, so scrolled cells
          never bleed past the sticky name column into the card padding. */}
      <div className="hidden md:block w-fit max-w-full rounded-2xl border border-white/5 bg-surface shadow-lg shadow-black/20 p-4">
       <div className="overflow-x-auto no-scrollbar">
        <table className="border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-surface text-left align-bottom pr-3 pb-2 border-r border-white/10">
                <span className="text-white/40 text-xs font-medium">{t('schedule.colEmployee')}</span>
              </th>
              {dates.map((d) => (
                <th key={d} className="w-[25px] min-w-[25px] px-[1.5px] pb-2 font-normal">
                  <div className="text-white/25 text-[9px] leading-none mb-0.5">{weekdayLabels[weekdayIndex(d)]}</div>
                  <div className="text-white/45 text-[10px] leading-none tabular-nums">{dayOfMonth(d)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.department}>
                <tr>
                  <td className="sticky left-0 z-10 bg-surface py-1.5 pr-3 whitespace-nowrap border-r border-white/10">
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-wide">{group.department}</span>
                    <span className="text-white/30 text-[11px] ml-1.5 tabular-nums">{group.employees.length}</span>
                  </td>
                  <td colSpan={dates.length}>
                    <div className="border-b border-white/5" />
                  </td>
                </tr>
                {group.employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td className="sticky left-0 z-10 bg-surface pr-3 border-r border-white/10">
                      <div className="flex items-center gap-2 py-0.5">
                        <Avatar src={emp.profile_image} name={emp.full_name} size="xs" />
                        <span className="block max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-white/80 text-[13px]">
                          {emp.full_name}
                        </span>
                      </div>
                    </td>
                    {emp.days.map((day) => (
                      <td key={day.date} className="p-[1.5px]">
                        <div
                          title={`${day.date} · ${t(STATUS_LABEL_KEY[day.status])}`}
                          className="w-[22px] h-[22px] rounded-[6px]"
                          style={{ background: cellBackground(day.status) }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
       </div>
      </div>

      {/* Mobile: one calendar-aligned mini-grid per employee (weeks as rows,
          weekday columns) — everything visible, no horizontal scroll. Fixed
          column tracks keep cells compact so a longer range just adds rows. */}
      <div className="md:hidden">
        <div className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: MOBILE_GRID }}>
          {weekdayLabels.map((label, i) => (
            <div key={i} className="text-center text-white/25 text-[10px] font-medium">
              {label}
            </div>
          ))}
        </div>
        {groups.map((group) => (
          <div key={group.department} className="mb-4">
            <div className="flex items-baseline gap-1.5 mb-2 mt-1">
              <span className="text-white/70 text-xs font-semibold uppercase tracking-wide">{group.department}</span>
              <span className="text-white/30 text-[11px] tabular-nums">{group.employees.length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {group.employees.map((emp) => (
                <div key={emp.employee_id} className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar src={emp.profile_image} name={emp.full_name} size="xs" />
                    <p className="text-white/80 text-[13px] font-medium truncate">{emp.full_name}</p>
                  </div>
                  <div className="grid gap-1" style={{ gridTemplateColumns: MOBILE_GRID }}>
                    {Array.from({ length: leadingBlanks }).map((_, i) => (
                      <div key={`blank-${i}`} />
                    ))}
                    {emp.days.map((day) => {
                      const neutral = NEUTRAL_STATUSES.has(day.status)
                      return (
                        <div
                          key={day.date}
                          title={`${day.date} · ${t(STATUS_LABEL_KEY[day.status])}`}
                          className="aspect-square rounded-[5px] flex items-center justify-center text-[8px] font-semibold tabular-nums"
                          style={{
                            background: cellBackground(day.status),
                            color: neutral ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.6)',
                          }}
                        >
                          {dayOfMonth(day.date)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Legend />
    </div>
  )
}
