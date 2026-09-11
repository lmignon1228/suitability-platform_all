import { createI18n } from 'vue-i18n'
import zh from '../locales/zh'
import en from '../locales/en'

const STORAGE_KEY = 'suitability-locale'

function getInitialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return 'zh'
}

export const SUPPORTED_LOCALES = ['zh', 'en']
export const LOCALE_NAMES = { zh: '中文', en: 'EN' }

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) locale = 'zh'
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

export default i18n