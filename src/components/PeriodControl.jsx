import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { todayStr, yesterdayStr } from '../utils/dateRange'
import DateStepper from './DateStepper'
import PillGroup from './PillGroup'

/**
 * The one period/date control used everywhere a page lets you pick a time
 * window: Bugun / Kecha / Hafta / Oy / Boshqa presets, a date stepper +
 * native calendar picker for the single-day modes, the "Boshqa" custom
 * range inputs, and a plain-text line showing the resolved date/range so
 * the active window is never ambiguous.
 *
 * `period` stays one of 'Today' | 'Week' | 'Month' | 'Custom' — Bugun and
 * Kecha are both `period === 'Today'`, distinguished only by which
 * `selectedDate` they land on. Passing `onCustomRangeChange` is what turns
 * the "Boshqa" pill (and its date inputs) on — pages that never had a
 * custom-range feature (Dashboard, DepartmentDetail) simply omit it.
 *
 * `onDayPresetChange(date)` is separate from `onPeriodChange`/
 * `onSelectedDateChange` deliberately: Bugun/Kecha need `period` and `day`
 * set together, and every page's setter is backed by useFilterParams'
 * useSearchParams, whose setter does NOT queue functional updates the way
 * React's does — two sequential set-one-field calls each read the same
 * stale `prev`, so the second silently clobbers the first. Routing the
 * combined change through one callback lets the page apply it as a single
 * patch (`setF({ period: 'Today', day })`) instead.
 */
export default function PeriodControl({
  period,
  onPeriodChange,
  selectedDate,
  onSelectedDateChange,
  onDayPresetChange,
  customRange,
  onCustomRangeChange,
  dateFrom,
  dateTo,
}) {
  const { t } = useTranslation()
  const today = todayStr()
  const yesterday = yesterdayStr()
  const showCustom = typeof onCustomRangeChange === 'function'
  const showDay = typeof onDayPresetChange === 'function'

  let activePreset = null
  if (showDay && period === 'Today') {
    if (selectedDate === today) activePreset = 'today'
    else if (selectedDate === yesterday) activePreset = 'yesterday'
    // else: stepped to some other day — no preset pill highlighted, the
    // DateStepper below is the "which day" indicator.
  } else if (period === 'Week') {
    activePreset = 'week'
  } else if (period === 'Month') {
    activePreset = 'month'
  } else if (period === 'Custom') {
    activePreset = 'custom'
  }

  const presetOptions = [
    ...(showDay ? [{ value: 'today', label: t('period.today') }, { value: 'yesterday', label: t('period.yesterday') }] : []),
    { value: 'week', label: t('period.week') },
    { value: 'month', label: t('period.month') },
    ...(showCustom ? [{ value: 'custom', label: t('filters.custom') }] : []),
  ]

  function handlePresetChange(key) {
    if (key === 'today') {
      onDayPresetChange(today)
    } else if (key === 'yesterday') {
      onDayPresetChange(yesterday)
    } else if (key === 'week') {
      onPeriodChange('Week')
    } else if (key === 'month') {
      onPeriodChange('Month')
    } else if (key === 'custom') {
      onPeriodChange('Custom')
    }
  }

  // The stepper already shows the resolved date front-and-centre, so the
  // text line below is only for the other modes (and only once there's
  // something to show).
  const showResolvedRange = (!showDay || period !== 'Today') && dateFrom && dateTo

  return (
    <div className="flex flex-col gap-2">
      <PillGroup options={presetOptions} value={activePreset} onChange={handlePresetChange} />

      <AnimatePresence initial={false}>
        {showDay && period === 'Today' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <DateStepper date={selectedDate} onChange={onSelectedDateChange} maxDate={today} />
          </motion.div>
        )}
        {showCustom && period === 'Custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 flex-wrap overflow-hidden"
          >
            <label className="flex items-center gap-1.5 text-xs text-white/40">
              {t('filters.dateFrom')}
              <input
                type="date"
                value={customRange?.date_from ?? ''}
                max={customRange?.date_to || undefined}
                onChange={(e) => onCustomRangeChange({ ...customRange, date_from: e.target.value })}
                className="[color-scheme:dark] rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white/40">
              {t('filters.dateTo')}
              <input
                type="date"
                value={customRange?.date_to ?? ''}
                min={customRange?.date_from || undefined}
                onChange={(e) => onCustomRangeChange({ ...customRange, date_to: e.target.value })}
                className="[color-scheme:dark] rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {showResolvedRange && (
        <p className="text-white/40 text-xs tabular-nums">{dateFrom === dateTo ? dateFrom : `${dateFrom} — ${dateTo}`}</p>
      )}
    </div>
  )
}
