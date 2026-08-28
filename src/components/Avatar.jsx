import { useState } from 'react'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
}

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-violet-500/20 border border-white/10 text-violet-300 font-semibold ${sizeClass} ${className}`}
    >
      {showImage ? (
        <img src={src} alt="" onError={() => setFailed(true)} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  )
}
