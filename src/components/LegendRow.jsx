export default function LegendRow({ color, value, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="font-bold text-lg tabular-nums min-w-[1.6em]" style={{ color }}>
        {value}
      </span>
      <span className="text-white/45 text-sm">{label}</span>
    </div>
  )
}
