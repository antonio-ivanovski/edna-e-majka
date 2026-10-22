import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { mk } from './i18n/mk'

void i18n.use(initReactI18next).init({
  resources: { mk: { translation: mk } },
  lng: 'mk',
  fallbackLng: 'mk',
  interpolation: { escapeValue: false },
})

export { i18n }
export default i18n
