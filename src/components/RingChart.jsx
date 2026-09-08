import { motion } from 'framer-motion'
import CountUp from './CountUp'

function colorForValue(pct) {
  if (pct >= 85) return '#2dd4bf'
  if (pct >= 60) return '#fbbf24'
  return '#f87171'
}

export default function RingChart({ pct, size = 96, strokeWidth = 9, color, label, trackColor = 'rgba(255,255,255,0.08)' }) {
  const value = Math.max(0, Math.min(100, pct ?? 0))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - value / 100)
  const stroke = color ?? colorForValue(value)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        <b className="text-white font-bold tabular-nums" style={{ fontSize: size * 0.22 }}>
          <CountUp value={value} decimals={0} />%
        </b>
        {label && (
          <span className="text-white/40 font-medium" style={{ fontSize: size * 0.1 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
