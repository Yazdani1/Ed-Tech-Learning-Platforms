'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { isLanguage, LANGUAGE_STORAGE_KEY, type Language } from '@/i18n/i18n';
import { readPreference } from '@/utils/storage';

/** The saved language (old client's key), else the browser's language when it is Bangla, else English. */
const preferredLanguage = (): Language => {
  const saved = readPreference(LANGUAGE_STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  return navigator.language.toLowerCase().startsWith('bn') ? 'bn' : 'en';
};

/** After the first render, switches to the visitor's language and keeps <html lang> in step. */
export const LanguageSync = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = preferredLanguage();
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [i18n]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
};
