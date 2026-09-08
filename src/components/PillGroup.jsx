export default function PillGroup({ options, value, onChange, wrap = false, className = '' }) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'overflow-x-auto no-scrollbar'} ${className}`}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value ?? '__none__'}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              active ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
