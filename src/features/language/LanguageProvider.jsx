import { createContext, useEffect, useMemo, useState } from 'react'

const LANGUAGE_STORAGE_KEY = 'fitflow_language'
const DEFAULT_LANGUAGE = 'ko'

export const LanguageContext = createContext(null)

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return savedLanguage === 'en' ? 'en' : DEFAULT_LANGUAGE
}

export default function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage)
  }, [currentLanguage])

  const value = useMemo(() => {
    return {
      currentLanguage,
      setLanguage: (language) => {
        setCurrentLanguage(language === 'en' ? 'en' : 'ko')
      },
    }
  }, [currentLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
