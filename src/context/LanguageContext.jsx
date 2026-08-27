import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import i18n from '../i18n'

const LanguageContext = createContext(null)

// Language choice lives only in React state for now (not localStorage),
// same rationale as the JWT: nothing persisted to disk yet.
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(i18n.language)

  const setLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng)
    setLanguageState(lng)
  }, [])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
