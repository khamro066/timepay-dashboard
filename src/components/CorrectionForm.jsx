import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function CorrectionForm({ onSubmit, onCancel }) {
  const { t } = useTranslation()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorKey, setErrorKey] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!checkIn && !checkOut) {
      setErrorKey('corrections.formErrorNeedOne')
      return
    }
    if (!reason.trim()) {
      setErrorKey('corrections.formErrorReason')
      return
    }
    setSaving(true)
    setErrorKey('')
    try {
      await onSubmit({
        corrected_check_in: checkIn || null,
        corrected_check_out: checkOut || null,
        reason: reason.trim(),
      })
    } catch {
      setErrorKey('corrections.formErrorGeneric')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2.5">
      <div className="flex gap-2.5 flex-wrap">
        <label className="flex flex-col gap-1 text-xs text-white/40">
          {t('employeeDetail.colCheckIn')}
          <input
            type="time"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/40">
          {t('employeeDetail.colCheckOut')}
          <input
            type="time"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-white/40">
        {t('corrections.reasonLabel')}
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('corrections.reasonPlaceholder')}
          className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </label>
      {errorKey && <p className="text-red-400 text-xs">{t(errorKey)}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('corrections.saveAction')}
        </button>
        <button type="button" onClick={onCancel} className="px-3.5 py-2 rounded-lg text-white/50 hover:text-white text-sm">
          {t('common.close')}
        </button>
      </div>
    </form>
  )
}
