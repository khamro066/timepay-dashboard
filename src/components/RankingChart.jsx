import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

const TIERS = [
  { threshold: 85, color: '#2dd4bf', legendKey: 'ranking.legendGood' },
  { threshold: 60, color: '#fbbf24', legendKey: 'ranking.legendOk' },
  { threshold: 0, color: '#f87171', legendKey: 'ranking.legendBad' },
]

function colorForScore(score) {
  if (score >= 85) return TIERS[0].color
  if (score >= 60) return TIERS[1].color
  return TIERS[2].color
}

export default function RankingChart({ data }) {
  const { t } = useTranslation()
  const chartData = data.map((row) => ({
    name: row.full_name,
    score: row.overall_score !== null && row.overall_score !== undefined ? Math.round(row.overall_score * 100) : 0,
  }))

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {TIERS.map((tier) => (
          <span key={tier.legendKey} className="inline-flex items-center gap-1.5 text-xs text-white/50">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
            {t(tier.legendKey)}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(chartData.length * 28, 200)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke="rgba(255,255,255,0.25)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            stroke="rgba(255,255,255,0.25)"
            tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, t('ranking.colScore')]}
            contentStyle={{
              background: '#211d33',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: 'white',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar
            dataKey="score"
            radius={[0, 8, 8, 0]}
            isAnimationActive={false}
            label={{
              position: 'right',
              formatter: (value) => `${value}%`,
              fill: 'rgba(255,255,255,0.75)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={colorForScore(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
