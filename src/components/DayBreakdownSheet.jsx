import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from './Avatar'

// Per-employee drill-down behind the dashboard "Today" stat block. Opens as
// a bottom sheet on mobile, a centered dialog on desktop. Data comes from
// /api/company/daily-breakdown for the same date + business the block shows.
// Built to stay readable at 100+ names: one scroll container, a name filter,
// and each status group collapsible.

const DOT = { present: '#2dd4bf', late: '#fbbf24', early: '#fb923c', absent: '#f87171' }

function PersonRow({ person, kind, t }) {
  let detail = null
  if (kind === 'late') {
    detail = (
      <span className="text-amber-300/90 text-xs whitespace-nowrap">
        {person.first_check_in ? t('dashboard.cameAt', { time: person.first_check_in }) : ''}
        {person.late_minutes ? ` · ${t('dashboard.lateBy', { count: person.late_minutes })}` : ''}
      </span>
    )
  } else if (kind === 'early') {
    detail = (
      <span className="text-orange-300/90 text-xs whitespace-nowrap">
        {person.last_check_out ? t('dashboard.leftAt', { time: person.last_check_out }) : ''}
      </span>
    )
  } else if (kind === 'absent') {
    detail = person.excused ? (
      <span className="text-violet-300/90 text-xs text-right">
        {t('dashboard.tagExcused')}
        {person.leave_reason ? ` · ${person.leave_reason}` : ''}
      </span>
    ) : (
      <span className="text-red-300/80 text-xs">{t('dashboard.tagUnexcused')}</span>
    )
  }

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Avatar src={person.profile_image} name={person.full_name} size="xs" />
      <div className="min-w-0 flex-1">
        <p className="text-white/90 text-sm truncate">{person.full_name}</p>
        {person.department && <p className="text-white/35 text-[11px] truncate">{person.department}</p>}
      </div>
      {detail}
    </div>
  )
}

function Group({ id, label, color, people, kind, collapsed, onToggle, t }) {
  if (people.length === 0) return null
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-2 py-2.5 text-left"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-white/80 text-sm font-medium flex-1">{label}</span>
        <span className="text-white/40 text-xs tabular-nums">{people.length}</span>
        <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-white/30" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {people.map((p) => (
                <PersonRow key={`${p.employee_id}-${kind}`} person={p} kind={kind} t={t} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DayBreakdownSheet({ open, onClose, date, department, api }) {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    if (!open || !date) return undefined
    let cancelled = false
    setLoading(true)
    setError(false)
    const params = { date }
    if (department) params.department = department
    api
      .get('/api/company/daily-breakdown', { params })
      .then((res) => {
        if (!cancelled) setRows(res.data.employees || [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, date, department, api])

  // Reset the transient view state each time the sheet is opened.
  useEffect(() => {
    if (open) {
      setQuery('')
      setCollapsed({})
    }
  }, [open])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (p) => !q || p.full_name?.toLowerCase().includes(q)
    const working = rows.filter((p) => p.is_working_day && match(p))
    return {
      present: working.filter((p) => !p.absent && !p.late && !p.left_early),
      late: working.filter((p) => !p.absent && p.late),
      early: working.filter((p) => !p.absent && p.left_early),
      absentExcused: working.filter((p) => p.absent && p.excused),
      absentUnexcused: working.filter((p) => p.absent && !p.excused),
    }
  }, [rows, query])

  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))
  const nothing =
    !loading &&
    !error &&
    groups.present.length +
      groups.late.length +
      groups.early.length +
      groups.absentExcused.length +
      groups.absentUnexcused.length ===
      0

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.button
            type="button"
            aria-label={t('common.close')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="relative w-full md:max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl md:rounded-3xl bg-surface-light border border-white/10 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div>
                <h3 className="text-white font-semibold">{t('dashboard.breakdownTitle')}</h3>
                {date && <p className="text-white/40 text-xs mt-0.5">{t('dashboard.breakdownDate', { date })}</p>}
              </div>
              <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('filters.searchPlaceholder')}
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-9 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={t('common.close')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {loading && <p className="text-white/40 text-sm py-6 text-center">…</p>}
              {error && <p className="text-red-400/80 text-sm py-6 text-center">{t('dashboard.loadError')}</p>}
              {nothing && (
                <p className="text-white/40 text-sm py-6 text-center">
                  {rows.length === 0 ? t('dashboard.breakdownEmpty') : t('dashboard.breakdownNoMatch')}
                </p>
              )}
              {!loading && !error && (
                <>
                  <Group id="present" label={t('dashboard.ishda')} color={DOT.present} people={groups.present} kind="present" collapsed={collapsed.present} onToggle={toggle} t={t} />
                  <Group id="late" label={t('dashboard.kech')} color={DOT.late} people={groups.late} kind="late" collapsed={collapsed.late} onToggle={toggle} t={t} />
                  <Group id="early" label={t('dashboard.ertaKetgan')} color={DOT.early} people={groups.early} kind="early" collapsed={collapsed.early} onToggle={toggle} t={t} />
                  <Group id="absentUnexcused" label={t('dashboard.groupAbsentUnexcused')} color={DOT.absent} people={groups.absentUnexcused} kind="absent" collapsed={collapsed.absentUnexcused} onToggle={toggle} t={t} />
                  <Group id="absentExcused" label={t('dashboard.groupAbsentExcused')} color="#a78bfa" people={groups.absentExcused} kind="absent" collapsed={collapsed.absentExcused} onToggle={toggle} t={t} />
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
