import { motion } from 'framer-motion'
import { CalendarPlus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'

// Deliberately the opposite of the hidden corrections tool: a normal,
// visible entry point, regular admin auth only (no step-up gate) — this is
// routine HR data entry for days Time Pay has no record of at all.
export default function ManualAttendanceEntryForm({ employeeId, onSaved }) {
  const { t } = useTranslation()
  const api = useApi()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorKey, setErrorKey] = useState('')
  const [conflict, setConflict] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!date || !checkIn || !checkOut) {
      setErrorKey('manualEntry.formErrorRequired')
      return
    }
    setSaving(true)
    setErrorKey('')
    setConflict(false)
    try {
      await api.post(`/api/employees/${employeeId}/manual-entry`, {
        date,
        check_in: checkIn,
        check_out: checkOut,
        note: note.trim() || null,
      })
      setOpen(false)
      setDate('')
      setCheckIn('')
      setCheckOut('')
      setNote('')
      onSaved?.()
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(true)
      } else {
        setErrorKey('manualEntry.formErrorGeneric')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">{t('manualEntry.title')}</h3>
        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 text-xs font-medium hover:bg-sky-600/30 transition-colors"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          {t('manualEntry.addAction')}
        </motion.button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2.5">
            <label className="flex flex-col gap-1 text-xs text-white/40">
              {t('manualEntry.dateLabel')}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-white/40">
              {t('employeeDetail.colCheckIn')}
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-white/40">
              {t('employeeDetail.colCheckOut')}
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs text-white/40">
            {t('manualEntry.noteLabel')}
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('manualEntry.notePlaceholder')}
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </label>
          {conflict && <p className="text-amber-300 text-xs">{t('manualEntry.conflictError')}</p>}
          {errorKey && <p className="text-red-400 text-xs">{t(errorKey)}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('manualEntry.saveAction')}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3.5 py-2 rounded-lg text-white/50 hover:text-white text-sm">
              {t('common.close')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
