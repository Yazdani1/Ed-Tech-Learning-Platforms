'use client';

import TranslateIcon from '@mui/icons-material/Translate';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { LANGUAGE_STORAGE_KEY, type Language } from '@/i18n/i18n';
import { writePreference } from '@/utils/storage';

/** Navbar button that switches between English and Bangla (remembered in this browser; LanguageSync reads it). */
export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const next: Language = i18n.language === 'bn' ? 'en' : 'bn';

  const switchLanguage = (): void => {
    writePreference(LANGUAGE_STORAGE_KEY, next);
    void i18n.changeLanguage(next);
  };

  return (
    <Button
      onClick={switchLanguage}
      startIcon={<TranslateIcon aria-hidden />}
      aria-label={t('public.nav.switchLanguage')}
      title={t('public.nav.switchLanguage')}
      variant="outlined"
      size="small"
      sx={{
        minHeight: 44,
        minWidth: 44,
        flexShrink: 0,
        fontWeight: 700,
        px: { xs: 1, sm: 1.5 },
        '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: { xs: 0, sm: -0.5 } },
      }}
    >
      {/* Phones show the icon only (the name is in aria-label) */}
      <Box component="span" lang={next} sx={{ display: { xs: 'none', sm: 'inline' } }}>
        {t('public.nav.otherLanguage')}
      </Box>
    </Button>
  );
};
