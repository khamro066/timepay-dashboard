import axios from 'axios'
import { motion } from 'framer-motion'
import { Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '../api/client'
import { useAuth } from '../context/AuthContext'

// Deliberately bypasses useApi(): that shared instance logs the whole
// session out on any 401, but a wrong step-up password is *also* a 401
// here (same convention as /api/auth/login) and must not nuke the user's
// regular, still-valid session — just show an inline error and let them
// retry.
export default function StepUpGate({ onElevated }) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorKey, setErrorKey] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrorKey('')
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/elevate`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onElevated()
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorKey('corrections.stepUpErrorInvalid')
      } else {
        setErrorKey('corrections.stepUpErrorGeneric')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-surface-light to-surface p-8 shadow-2xl shadow-black/40 border border-white/5"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-white/10 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-violet-300" />
        </div>
        <h1 className="text-white font-semibold text-lg mb-1">{t('corrections.stepUpTitle')}</h1>
        <p className="text-white/40 text-sm mb-6">{t('corrections.stepUpSubtitle')}</p>

        <label htmlFor="stepup-password" className="block text-sm text-white/70 mb-1">
          {t('login.password')}
        </label>
        <input
          id="stepup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          required
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
        />
        {errorKey && <p className="text-red-400 text-sm mt-2">{t(errorKey)}</p>}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="w-full mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-2.5 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-violet-600/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('corrections.stepUpSubmit')}
        </motion.button>
      </motion.form>
    </div>
  )
}
