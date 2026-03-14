import { useContext } from 'react'
import { LanguageContext } from './LanguageProvider.jsx'
import { appMessages, getMessageScope } from './messages.js'

export function useLanguage(scope = 'common') {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  const text = getMessageScope(scope, context.currentLanguage)

  return {
    ...context,
    text,
    messages: appMessages,
    isKorean: context.currentLanguage === 'ko',
    isEnglish: context.currentLanguage === 'en',
  }
}
