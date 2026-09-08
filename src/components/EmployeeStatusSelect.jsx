import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'

const STATUS_OPTIONS = [
  { value: 'active', labelKey: 'employeeDetail.statusOptionActive', className: 'text-teal-300 border-teal-400/30' },
  { value: 'paused', labelKey: 'employeeDetail.statusOptionPaused', className: 'text-amber-300 border-amber-400/30' },
  { value: 'archived', labelKey: 'employeeDetail.statusOptionArchived', className: 'text-red-300 border-red-400/30' },
]

export default function EmployeeStatusSelect({ employeeId, status, onSaved }) {
  const { t } = useTranslation()
  const api = useApi()
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState('idle')

  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]

  async function handleChange(e) {
    const next = e.target.value
    setSaving(true)
    setSaveState('idle')
    try {
      await api.put(`/api/employees/${employeeId}/status`, { status: next })
      onSaved(next)
      setSaveState('saved')
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
    } catch {
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-white/40 text-xs font-medium">{t('employeeDetail.employeeStatusLabel')}</label>
      <select
        value={status ?? 'active'}
        onChange={handleChange}
        disabled={saving}
        className={`rounded-lg bg-white/5 border px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50 ${current.className}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-light text-white">
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
      {saving && <Loader2 className="w-4 h-4 text-white/40 animate-spin" />}
      {!saving && saveState === 'saved' && <Check className="w-4 h-4 text-teal-400" />}
      {!saving && saveState === 'error' && <span className="text-red-400 text-xs">{t('employeeDetail.statusUpdateError')}</span>}
    </div>
  )
}
