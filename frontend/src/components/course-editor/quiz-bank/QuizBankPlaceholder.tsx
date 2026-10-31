'use client';

import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const BOX_SX = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'text.secondary',
  gap: 1,
  p: 4,
  textAlign: 'center',
} as const;

/** Shown on the right while no quiz bank is open. */
export const QuizBankPlaceholder = () => {
  const { t } = useTranslation();
  return (
    <Box sx={BOX_SX}>
      <QuizOutlinedIcon sx={{ fontSize: 64, opacity: 0.3 }} aria-hidden />
      <Typography variant="h6">{t('catalog.quiz.selectBank')}</Typography>
      <Typography variant="body2">{t('catalog.quiz.selectBankHint')}</Typography>
    </Box>
  );
};
