function toneClasses(score) {
  if (score === null || score === undefined) {
    return 'bg-white/10 text-white/50 border-white/10'
  }
  if (score >= 0.85) return 'bg-teal-500/15 text-teal-300 border-teal-400/30'
  if (score >= 0.6) return 'bg-amber-500/15 text-amber-300 border-amber-400/30'
  return 'bg-red-500/15 text-red-300 border-red-400/30'
}

const SIZE_CLASSES = {
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3.5 py-1.5 text-base',
}

export default function ScoreBadge({ score, label, size = 'md', trailing }) {
  const pctLabel = score === null || score === undefined ? '—' : `${Math.round(score * 100)}%`

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1">
        <span
          className={`inline-flex items-center rounded-full font-semibold border ${SIZE_CLASSES[size]} ${toneClasses(score)}`}
        >
          {pctLabel}
        </span>
        {trailing}
      </span>
      {label && <span className="text-[10px] text-white/40 font-medium whitespace-nowrap">{label}</span>}
    </span>
  )
}
