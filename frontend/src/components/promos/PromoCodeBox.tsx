'use client';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { MONO_FONT } from '@/theme/fonts';

import type { FC } from 'react';

interface PromoCodeBoxProps {
  code: string;
}

const BOX_SX = {
  mt: 2.5,
  mx: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  pl: 2,
  pr: 0.5,
  py: 0.5,
  borderRadius: '14px',
  border: '2px dashed rgba(255,255,255,0.7)',
  bgcolor: 'rgba(0,0,0,0.18)',
} as const;

/** The promo code in a dashed box with a copy button (on the promo pop-up's colour). */
export const PromoCodeBox: FC<PromoCodeBoxProps> = ({ code }) => {
  const { t } = useTranslation();
  const copy = (): void => {
    void navigator.clipboard
      .writeText(code)
      .then(() => toast.success(t('promos.popup.copied')))
      .catch(() => toast.error(t('promos.popup.copyFailed')));
  };
  return (
    <Box sx={BOX_SX}>
      <Typography
        sx={{ fontFamily: MONO_FONT, fontWeight: 800, fontSize: '1.3rem', letterSpacing: 1 }}
      >
        {code}
      </Typography>
      <IconButton
        aria-label={t('promos.popup.copy', { code })}
        onClick={copy}
        sx={{ color: 'common.white', width: 44, height: 44 }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
