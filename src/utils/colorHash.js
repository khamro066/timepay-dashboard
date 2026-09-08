const PALETTE = [
  { bg: 'bg-violet-500/20', text: 'text-violet-300', hex: '#a78bfa' },
  { bg: 'bg-teal-500/20', text: 'text-teal-300', hex: '#2dd4bf' },
  { bg: 'bg-blue-500/20', text: 'text-blue-300', hex: '#60a5fa' },
  { bg: 'bg-amber-500/20', text: 'text-amber-300', hex: '#fbbf24' },
  { bg: 'bg-rose-500/20', text: 'text-rose-300', hex: '#fb7185' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300', hex: '#34d399' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-300', hex: '#22d3ee' },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', hex: '#e879f9' },
]

// Deterministic: the same key always maps to the same palette entry, so an
// employee's or department's color stays stable across renders and reloads.
export function colorForKey(key) {
  const str = String(key ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
