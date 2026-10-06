import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NEUTRAL_STATUSES, STATUS_COLORS, STATUS_LABEL_KEY, groupByDepartment } from '../utils/attendanceStatus'
import Avatar from './Avatar'

// Same precedence as the backend's _schedule_day_status / the matrix's
// per-cell status: day off beats a manual entry, which beats
// excused/absent, which beats late, otherwise on time.
function dayStatus(emp) {
  if (!emp.is_working_day) return 'day_off'
  if (emp.source === 'MANUAL') return 'manual'
  if (emp.absent) return emp.excused ? 'excused' : 'absent'
  if (emp.late) return 'late'
  return 'on_time'
}

function badgeStyle(status) {
  if (NEUTRAL_STATUSES.has(status)) {
    return { color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.08)' }
  }
  const color = STATUS_COLORS[status] ?? 'rgba(255,255,255,0.5)'
  return { color, backgroundColor: `${color}26` }
}

function EmployeeRow({ emp }) {
  const { t } = useTranslation()
  const status = dayStatus(emp)
  const hasTimes = emp.first_check_in || emp.last_check_out

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-3.5 py-2.5">
      <Avatar src={emp.profile_image} name={emp.full_name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-white/85 text-sm font-medium truncate">{emp.full_name}</p>
        <p className="text-white/35 text-[11px] truncate">{emp.department}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
          style={badgeStyle(status)}
        >
          {t(STATUS_LABEL_KEY[status])}
        </span>
        {hasTimes && (
          <span className="text-white/40 text-[11px] tabular-nums whitespace-nowrap">
            {emp.first_check_in ?? '—'} → {emp.last_check_out ?? '—'}
          </span>
        )}
      </div>
    </div>
  )
}

// Jadval's single-day ("Bugun"/"Kecha"/stepped-to-a-day) view: a matrix with
// one date column is awkward, so this renders a flat per-employee list
// instead — grouped by department like the matrix is, but with a status
// badge and that day's check-in/out times per row rather than a grid cell.
export default function ScheduleDayList({ employees }) {
  const groups = useMemo(() => {
    const sorted = [...employees].sort(
      (a, b) => (a.department || '').localeCompare(b.department || '') || (a.full_name || '').localeCompare(b.full_name || ''),
    )
    return groupByDepartment(sorted)
  }, [employees])

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.department}>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wide">{group.department}</span>
            <span className="text-white/30 text-[11px] tabular-nums">{group.employees.length}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {group.employees.map((emp) => (
              <EmployeeRow key={emp.employee_id} emp={emp} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
