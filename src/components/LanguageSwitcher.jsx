import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

const LANGS = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="inline-flex bg-white/5 rounded-xl p-1">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLanguage(lang.code)}
          className="relative px-3 py-1.5 text-xs font-semibold"
        >
          {language === lang.code && (
            <motion.div
              layoutId="language-switcher-indicator"
              className="absolute inset-0 rounded-lg bg-violet-600"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className={`relative z-10 ${language === lang.code ? 'text-white' : 'text-white/50'}`}>
            {lang.label}
          </span>
        </button>
      ))}
    </div>
  )
}
