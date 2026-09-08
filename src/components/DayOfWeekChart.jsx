import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export default function DayOfWeekChart({ data }) {
  const { t } = useTranslation()
  const fullNames = t('reports.weekdaysFull', { returnObjects: true })
  const byKey = Object.fromEntries((data || []).map((d) => [d.key, d]))

  const chartData = WEEKDAY_KEYS.map((key, i) => {
    const d = byKey[key]
    return {
      key,
      name: fullNames[i],
      late: d && d.late_rate !== null ? Math.round(d.late_rate * 100) : 0,
      absent: d && d.absent_rate !== null ? Math.round(d.absent_rate * 100) : 0,
      total: d?.total ?? 0,
    }
  })

  const worstLate = chartData.reduce((best, d) => (d.total > 0 && (!best || d.late > best.late) ? d : best), null)
  const worstAbsent = chartData.reduce((best, d) => (d.total > 0 && (!best || d.absent > best.absent) ? d : best), null)

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#fbbf24' }} />
          {t('reports.weekdayLate')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-white/50">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#f87171' }} />
          {t('reports.weekdayAbsent')}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke="rgba(255,255,255,0.25)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value, name) => [`${value}%`, name === 'late' ? t('reports.weekdayLate') : t('reports.weekdayAbsent')]}
            contentStyle={{
              background: '#211d33',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: 'white',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="late" fill="#fbbf24" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="absent" fill="#f87171" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      {(worstLate || worstAbsent) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-xs text-white/50">
          {worstLate && <p>{t('reports.weekdayWorstLate', { day: worstLate.name })}</p>}
          {worstAbsent && <p>{t('reports.weekdayWorstAbsent', { day: worstAbsent.name })}</p>}
        </div>
      )}
    </div>
  )
}
