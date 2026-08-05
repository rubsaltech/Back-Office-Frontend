import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import english from './language/english'
import spanish from './language/spanish'

export const LANG_STORAGE_KEY = 'rubsal.lang'

function savedLanguage() {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    return null
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: english },
    es: { translation: spanish },
  },
  lng: savedLanguage() || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
