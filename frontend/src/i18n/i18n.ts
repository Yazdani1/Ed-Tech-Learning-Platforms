import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { bn, en } from './resources';

export const LANGUAGES = ['en', 'bn'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';
/** Same storage key the old client's language detector used, so a saved choice carries over. */
export const LANGUAGE_STORAGE_KEY = 'i18nextLng';

export const isLanguage = (value: string | null | undefined): value is Language =>
  LANGUAGES.some((language) => language === value);

// The server and the first browser render both use English (no hydration mismatch); LanguageSync then
// switches to the visitor's saved or browser language.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, bn: { translation: bn } },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...LANGUAGES],
    interpolation: { escapeValue: false },
    initAsync: false,
  });
}

export default i18n;
