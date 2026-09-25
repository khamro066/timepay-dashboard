import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import CorrectionForm from '../components/CorrectionForm'
import CorrectionHistoryTag from '../components/CorrectionHistoryTag'
import StepUpGate from '../components/StepUpGate'

function getDefaultRange() {
  const end = new Date()
  const endStr = end.toISOString().slice(0, 10)
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { date_from: start.toISOString().slice(0, 10), date_to: endStr }
}

function CorrectionsPanel({ employeeId, onExpired }) {
  const { t } = useTranslation()
  const api = useApi()
  const [summary, setSummary] = useState(null)
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorKey, setErrorKey] = useState('')
  const [openFormDate, setOpenFormDate] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorKey('')
      try {
        const { date_from, date_to } = getDefaultRange()
        const [summaryRes, correctionsRes] = await Promise.all([
          api.get(`/api/employees/${employeeId}/summary`, { params: { date_from, date_to } }),
          api.get(`/api/employees/${employeeId}/corrections`),
        ])
        if (cancelled) return
        setSummary(summaryRes.data)
        setCorrections(correctionsRes.data)
      } catch (err) {
        if (cancelled) return
        if (err.response?.status === 403) {
          onExpired()
        } else {
          setErrorKey('corrections.loadError')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, refreshKey])

  const correctionsByDate = useMemo(() => {
    const map = {}
    for (const c of corrections) {
      if (!map[c.date]) map[c.date] = []
      map[c.date].push(c)
    }
    // The API returns newest-first (for the flat history list at the top of
    // a day); the per-day popover reads better oldest-first, like a timeline
    // of what changed and when.
    for (const list of Object.values(map)) {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }
    return map
  }, [corrections])

  const days = summary?.days ? [...summary.days].reverse() : []

  async function handleSubmitCorrection(date, payload) {
    try {
      await api.post(`/api/employees/${employeeId}/corrections`, { date, ...payload })
      setOpenFormDate(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      if (err.response?.status === 403) onExpired()
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white font-semibold text-lg mb-1">{t('corrections.panelTitle')}</h1>
        <p className="text-white/40 text-sm mb-6">{summary?.full_name ?? '—'}</p>

        {errorKey && <p className="text-red-400 text-sm mb-4">{t(errorKey)}</p>}

        <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
          <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-surface-light to-surface overflow-visible">
            {days.map((day) => (
              <div key={day.date} className="border-b border-white/5 last:border-0 p-3.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm font-medium">{day.date}</span>
                    {day.corrected && <CorrectionHistoryTag corrections={correctionsByDate[day.date] || []} />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenFormDate((d) => (d === day.date ? null : day.date))}
                    className="text-xs text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    {t('corrections.editAction')}
                  </button>
                </div>
                <div className="flex gap-6 text-sm mt-1.5">
                  <span className="text-white/50 text-xs">
                    {t('employeeDetail.colCheckIn')}: {day.first_check_in ?? '—'}
                  </span>
                  <span className="text-white/50 text-xs">
                    {t('employeeDetail.colCheckOut')}: {day.last_check_out ?? '—'}
                  </span>
                </div>

                {openFormDate === day.date && (
                  <CorrectionForm
                    onCancel={() => setOpenFormDate(null)}
                    onSubmit={(payload) => handleSubmitCorrection(day.date, payload)}
                  />
                )}
              </div>
            ))}
            {days.length === 0 && !loading && (
              <p className="text-white/40 text-sm text-center py-8">{t('employeeDetail.noData')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CorrectionsAdmin() {
  const { employeeId } = useParams()
  const [elevated, setElevated] = useState(false)

  if (!elevated) {
    return <StepUpGate onElevated={() => setElevated(true)} />
  }
  return <CorrectionsPanel employeeId={employeeId} onExpired={() => setElevated(false)} />
}
