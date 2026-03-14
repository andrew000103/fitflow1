import { useLanguage } from './useLanguage.js'

function LanguageToggle({ className = '', compact = false }) {
  const { currentLanguage, setLanguage, text } = useLanguage('common')

  return (
    <div className={compact ? `language-toggle compact ${className}`.trim() : `language-toggle ${className}`.trim()}>
      <button
        type="button"
        className={currentLanguage === 'ko' ? 'language-toggle-button active' : 'language-toggle-button'}
        onClick={() => setLanguage('ko')}
        aria-label={text.languageToggleLabel}
      >
        {text.languageKo}
      </button>
      <button
        type="button"
        className={currentLanguage === 'en' ? 'language-toggle-button active' : 'language-toggle-button'}
        onClick={() => setLanguage('en')}
        aria-label={text.languageToggleLabel}
      >
        {text.languageEn}
      </button>
    </div>
  )
}

export default LanguageToggle
