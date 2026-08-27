function toneClasses(score) {
  if (score === null || score === undefined) {
    return 'bg-white/10 text-white/50 border-white/10'
  }
  if (score >= 0.85) return 'bg-teal-500/15 text-teal-300 border-teal-400/30'
  if (score >= 0.6) return 'bg-amber-500/15 text-amber-300 border-amber-400/30'
  return 'bg-red-500/15 text-red-300 border-red-400/30'
}

export default function ScoreBadge({ score }) {
  const label = score === null || score === undefined ? '—' : `${Math.round(score * 100)}%`

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${toneClasses(score)}`}
    >
      {label}
    </span>
  )
}
