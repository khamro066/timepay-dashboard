import { AnimatePresence, motion } from 'framer-motion'
import { CalendarPlus, Loader2, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../api/useApi'

export default function EmployeeLeaveManager({ employeeId, onChanged }) {
  const { t } = useTranslation()
  const api = useApi()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/api/employees/${employeeId}/leave`)
      setLeaves(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!dateFrom || !dateTo || !reason.trim()) return
    setSaving(true)
    setError('')
    try {
      await api.post(`/api/employees/${employeeId}/leave`, {
        date_from: dateFrom,
        date_to: dateTo,
        reason: reason.trim(),
      })
      setDateFrom('')
      setDateTo('')
      setReason('')
      setFormOpen(false)
      await load()
      onChanged?.()
    } catch {
      setError('employeeDetail.leaveSaveError')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(leaveId) {
    try {
      await api.delete(`/api/employees/${employeeId}/leave/${leaveId}`)
      setLeaves((prev) => prev.filter((l) => l.id !== leaveId))
      onChanged?.()
    } catch {
      // Leave the list as-is; the user can retry the delete.
    }
  }

  return (
    <div className="glass-card rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">{t('employeeDetail.leaveTitle')}</h3>
        <motion.button
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          whileTap={{ scale: 0.96 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 text-xs font-medium hover:bg-violet-600/30 transition-colors"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          {t('employeeDetail.leaveAdd')}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-2 pb-3 mb-3 border-b border-white/5">
              <label className="flex flex-col gap-1 text-xs text-white/40">
                {t('filters.dateFrom')}
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  required
                  className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-white/40">
                {t('filters.dateTo')}
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  required
                  className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-white/40 flex-1 min-w-[160px]">
                {t('employeeDetail.leaveReason')}
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('employeeDetail.leaveReasonPlaceholder')}
                  required
                  className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('employeeDetail.leaveSave')}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label={t('common.close')}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-red-400 text-xs -mt-2 mb-2">{t(error)}</p>}
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-white/30 text-xs">…</p>
      ) : leaves.length === 0 ? (
        <p className="text-white/30 text-xs">{t('employeeDetail.leaveEmpty')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {leaves.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <div className="min-w-0">
                <p className="text-white/80 text-xs font-medium">
                  {leave.date_from === leave.date_to ? leave.date_from : `${leave.date_from} — ${leave.date_to}`}
                </p>
                <p className="text-white/40 text-xs truncate">{leave.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(leave.id)}
                aria-label={t('employeeDetail.leaveDelete')}
                className="shrink-0 text-white/30 hover:text-red-400 transition-colors p-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
