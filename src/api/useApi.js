import axios from 'axios'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from './client'
import { useAuth } from '../context/AuthContext'

export function useApi() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  return useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE_URL })

    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
          navigate('/login')
        }
        return Promise.reject(error)
      },
    )

    return instance
  }, [token, logout, navigate])
}
