import axios from 'axios'
import { motion } from 'framer-motion'
import { Loader2, Lock, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password })
      login(res.data.access_token)
      navigate('/')
    } catch (err) {
      if (!err.response) {
        setError("Can't reach the server")
      } else if (err.response.status === 401) {
        setError('Invalid username or password')
      } else {
        setError('Something went wrong')
      }
      setShakeKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden px-4">
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-violet-600/25 blur-3xl pointer-events-none"
        style={{ top: '-10%', left: '-10%' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none"
        style={{ bottom: '-10%', right: '-10%' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      <motion.form
        key={shakeKey}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          x: shakeKey > 0 ? [0, -10, 10, -8, 8, 0] : 0,
        }}
        transition={{ duration: shakeKey > 0 ? 0.4 : 0.3 }}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-gradient-to-b from-surface-light to-surface p-8 shadow-2xl shadow-black/40 border border-white/5"
      >
        <h1 className="text-2xl font-semibold text-white mb-1">Welcome back</h1>
        <p className="text-white/50 text-sm mb-6">Sign in to Timepay Analytics</p>

        <label htmlFor="username" className="block text-sm text-white/70 mb-1">
          Username
        </label>
        <div className="relative mb-4">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            placeholder="yourname"
            autoComplete="username"
            required
          />
        </div>

        <label htmlFor="password" className="block text-sm text-white/70 mb-1">
          Password
        </label>
        <div className="relative mb-2">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mb-2"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.03, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-full mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 py-2.5 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-violet-600/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
        </motion.button>
      </motion.form>
    </div>
  )
}
