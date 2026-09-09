import { useState } from 'react'
import { colorForKey } from '../utils/colorHash'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
}

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md
  const color = colorForKey(name)

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-white/10 font-semibold ${color.bg} ${color.text} ${sizeClass} ${className}`}
    >
      {showImage ? (
        <img src={src} alt="" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  )
}
