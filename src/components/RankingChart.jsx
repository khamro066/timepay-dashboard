import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function colorForScore(score) {
  if (score >= 85) return '#2dd4bf' // teal-400
  if (score >= 60) return '#fbbf24' // amber-400
  return '#f87171' // red-400
}

export default function RankingChart({ data }) {
  const chartData = data.map((row) => ({
    name: row.full_name,
    score: row.overall_score !== null && row.overall_score !== undefined ? Math.round(row.overall_score * 100) : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(chartData.length * 28, 200)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
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
          formatter={(value) => [`${value}%`, 'Score']}
          contentStyle={{
            background: '#211d33',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: 'white',
          }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="score" radius={[0, 8, 8, 0]} isAnimationActive animationDuration={700}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={colorForScore(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
