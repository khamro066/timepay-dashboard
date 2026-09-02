import { Check, Loader2, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const STATUS = { idle: 'idle', saving: 'saving', saved: 'saved', error: 'error' }

export default function NoteCell({ value, onSave }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [status, setStatus] = useState(STATUS.idle)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function commit() {
    setEditing(false)
    if (draft === (value || '')) return

    setStatus(STATUS.saving)
    try {
      await onSave(draft)
      setStatus(STATUS.saved)
      setTimeout(() => setStatus((s) => (s === STATUS.saved ? STATUS.idle : s)), 1500)
    } catch {
      setStatus(STATUS.error)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(value || '')
            setEditing(false)
          }
        }}
        placeholder={t('reports.notePlaceholder')}
        className="w-full min-w-[160px] rounded-lg bg-white/10 border border-violet-500/40 px-2.5 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      className="group flex items-center gap-1.5 w-full min-h-[36px] text-left rounded-lg px-2.5 py-2 hover:bg-white/5 transition-colors"
    >
      <span className={`flex-1 text-sm truncate ${value ? 'text-white/80' : 'text-white/30 italic'}`}>
        {value || t('reports.notePlaceholder')}
      </span>
      {status === STATUS.saving && <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin shrink-0" />}
      {status === STATUS.saved && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
      {status === STATUS.idle && (
        <Pencil className="w-3.5 h-3.5 text-white/0 group-hover:text-white/40 transition-colors shrink-0" />
      )}
    </button>
  )
}
