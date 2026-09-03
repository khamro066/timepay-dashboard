import { AnimatePresence, motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PERIOD_TABS = [
  { value: 'Today', key: 'period.today' },
  { value: 'Week', key: 'period.week' },
  { value: 'Month', key: 'period.month' },
  { value: 'Custom', key: 'filters.custom' },
]

function SearchInput({ value, onChange, placeholder }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  const timerRef = useRef(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  function handleChange(e) {
    const next = e.target.value
    setDraft(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(next), 200)
  }

  function handleClear() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setDraft('')
    onChange('')
  }

  return (
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      <input
        value={draft}
        onChange={handleChange}
        placeholder={placeholder ?? t('filters.searchPlaceholder')}
        className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-9 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
      />
      {draft && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="clear"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function PeriodControl({ period, onPeriodChange, customRange, onCustomRangeChange }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex bg-white/5 rounded-xl p-1">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onPeriodChange(tab.value)}
            className="relative px-3 py-3 md:py-1.5 text-sm font-medium"
          >
            {period === tab.value && (
              <motion.div
                layoutId="filterbar-period-indicator"
                className="absolute inset-0 rounded-lg bg-violet-600"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <span className={`relative z-10 whitespace-nowrap ${period === tab.value ? 'text-white' : 'text-white/50'}`}>
              {t(tab.key)}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {period === 'Custom' && (
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
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-white/40">
              {t('filters.dateTo')}
              <input
                type="date"
                value={customRange?.date_to ?? ''}
                min={customRange?.date_from || undefined}
                onChange={(e) => onCustomRangeChange({ ...customRange, date_to: e.target.value })}
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  department,
  onDepartmentChange,
  departmentOptions,
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
  sort,
  onSortChange,
  sortOptions,
  resultShown,
  resultTotal,
}) {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const showSearch = typeof onSearchChange === 'function'
  const showDepartment = Array.isArray(departmentOptions)
  const showSort = Array.isArray(sortOptions)
  const showPeriod = period !== undefined
  const showCount = resultShown !== undefined && resultTotal !== undefined

  const activeExtraFilters =
    (showDepartment && department ? 1 : 0) + (showSort && sortOptions.length > 0 && sort !== sortOptions[0].value ? 1 : 0)

  function clearExtraFilters() {
    if (showDepartment) onDepartmentChange(null)
    if (showSort) onSortChange(sortOptions[0].value)
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-start gap-3">
        {showSearch && <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />}

        {/* Desktop: everything inline */}
        <div className="hidden md:flex items-start gap-3 flex-wrap">
          {showPeriod && (
            <PeriodControl
              period={period}
              onPeriodChange={onPeriodChange}
              customRange={customRange}
              onCustomRangeChange={onCustomRangeChange}
            />
          )}
          {showDepartment && (
            <select
              value={department ?? ''}
              onChange={(e) => onDepartmentChange(e.target.value || null)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition cursor-pointer"
            >
              <option value="" className="bg-surface-light">
                {t('filters.allDepartments')}
              </option>
              {departmentOptions.map((d) => (
                <option key={d} value={d} className="bg-surface-light">
                  {d}
                </option>
              ))}
            </select>
          )}
          {showSort && (
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface-light">
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mobile: period stays inline (compact); department + sort collapse into a drawer */}
        <div className="md:hidden flex items-center gap-2 flex-wrap">
          {showPeriod && (
            <PeriodControl
              period={period}
              onPeriodChange={onPeriodChange}
              customRange={customRange}
              onCustomRangeChange={onCustomRangeChange}
            />
          )}
          {(showDepartment || showSort) && (
            <motion.button
              type="button"
              onClick={() => setDrawerOpen(true)}
              whileTap={{ scale: 0.96 }}
              className="relative inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('filters.filterButton')}
              {activeExtraFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-violet-500 text-white text-[10px] font-bold">
                  {activeExtraFilters}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {showCount && (
        <p className="text-white/40 text-xs mt-2.5">{t('filters.resultCount', { shown: resultShown, total: resultTotal })}</p>
      )}

      {/* Mobile bottom-sheet drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('common.close')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-surface-light border-t border-white/10 p-5 pb-8 shadow-2xl shadow-black/50 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{t('filters.filterButton')}</h3>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {showDepartment && (
                  <div>
                    <label className="block text-white/40 text-xs font-medium mb-1.5">{t('filters.department')}</label>
                    <select
                      value={department ?? ''}
                      onChange={(e) => onDepartmentChange(e.target.value || null)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">{t('filters.allDepartments')}</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {showSort && (
                  <div>
                    <label className="block text-white/40 text-xs font-medium mb-1.5">{t('filters.sortBy')}</label>
                    <select
                      value={sort}
                      onChange={(e) => onSortChange(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {activeExtraFilters > 0 && (
                  <button type="button" onClick={clearExtraFilters} className="text-violet-300 text-sm font-medium text-left">
                    {t('filters.clearAll')}
                  </button>
                )}
              </div>

              <motion.button
                type="button"
                onClick={() => setDrawerOpen(false)}
                whileTap={{ scale: 0.97 }}
                className="w-full mt-5 py-3 rounded-xl bg-violet-600 text-white font-medium"
              >
                {t('filters.filterButton')}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
