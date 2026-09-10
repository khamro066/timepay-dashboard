import { useTranslation } from 'react-i18next'

// Plain-language "how the attendance % was worked out" for one employee /
// one period. Pure presentational — the caller owns the show/hide and the
// numbers (present_days / expected_working_days straight off the ranking or
// employee-summary response).
export default function AttendanceBreakdownPanel({
  presentDays,
  expectedDays,
  rate,
  excusedDays = 0,
  periodLabel,
}) {
  const { t } = useTranslation()
  const hasData = typeof expectedDays === 'number' && expectedDays > 0
  const pct = rate === null || rate === undefined ? null : Math.round(rate * 100)

  return (
    <div className="rounded-xl bg-surface-light border border-white/10 p-3 text-left">
      <p className="text-white/45 text-[10px] font-semibold uppercase tracking-wide mb-1.5">
        {t('attendanceBreakdown.title')}
      </p>
      {hasData ? (
        <>
          <p className="text-white/75 text-[13px] leading-relaxed">
            {t('attendanceBreakdown.formula', { present: presentDays ?? 0, expected: expectedDays })}
          </p>
          <p className="text-white font-semibold text-sm mt-0.5 tabular-nums">
            {t('attendanceBreakdown.result', { pct: pct ?? 0 })}
          </p>
          {excusedDays > 0 && (
            <p className="text-white/45 text-xs mt-1">{t('attendanceBreakdown.excused', { count: excusedDays })}</p>
          )}
        </>
      ) : (
        <p className="text-white/55 text-[13px]">{t('attendanceBreakdown.noData')}</p>
      )}
      {periodLabel && <p className="text-white/30 text-[10px] mt-1.5">{periodLabel}</p>}
    </div>
  )
}
