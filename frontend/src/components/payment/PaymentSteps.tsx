'use client';

import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { localizeDigits } from '@/utils/price';

import { stepCircleSx } from './payment-methods';

import type { FC } from 'react';

interface PaymentStepsProps {
  courseId: string;
}

const BLUE = '#1d4ed8';
const BAR_COLORS = ['#111827', BLUE, '#e2e8f0'] as const;
const BAR_SX = { flex: 1, height: 6, borderRadius: 99 } as const;
const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 1.5,
} as const;
const LIST_SX = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  columnGap: 3,
  rowGap: 1,
  listStyle: 'none',
  p: 0,
  m: 0,
} as const;
const STEP_SX = { display: 'flex', alignItems: 'center', gap: 1 } as const;
const SECURE_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  px: 1.5,
  py: 0.5,
  borderRadius: 99,
  bgcolor: 'background.paper',
  color: '#047857',
  fontSize: '0.85rem',
  fontWeight: 600,
} as const;

/** Top of the payment page: three progress bars, the step names (the first links back) and "Secured payment". */
export const PaymentSteps: FC<PaymentStepsProps> = ({ courseId }) => {
  const { t, i18n } = useTranslation();
  return (
    <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }} aria-hidden>
        {BAR_COLORS.map((bgcolor) => (
          <Box key={bgcolor} sx={{ ...BAR_SX, bgcolor }} />
        ))}
      </Box>
      <Box sx={ROW_SX}>
        <Box component="ol" sx={LIST_SX}>
          <Box component="li">
            <Box
              component={Link}
              href={`/courses/${courseId}`}
              sx={{ ...STEP_SX, color: '#475569', minHeight: 44, textDecoration: 'none' }}
            >
              <Box sx={stepCircleSx('#e2e8f0', '#334155')} aria-hidden>
                <CheckIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography variant="body2">{t('payment.stepCourse')}</Typography>
            </Box>
          </Box>
          <Box component="li" aria-current="step" sx={STEP_SX}>
            <Box sx={stepCircleSx(BLUE, 'common.white')} aria-hidden>
              {localizeDigits('2', i18n.language)}
            </Box>
            <Typography variant="body2" sx={{ color: BLUE, fontWeight: 700 }}>
              {t('payment.stepDetails')}
            </Typography>
          </Box>
          <Box component="li" sx={STEP_SX}>
            <Box sx={stepCircleSx('#e2e8f0', '#475569')} aria-hidden>
              {localizeDigits('3', i18n.language)}
            </Box>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              {t('payment.stepSuccess')}
            </Typography>
          </Box>
        </Box>
        <Box sx={SECURE_SX}>
          <LockOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
          {t('payment.secured')}
        </Box>
      </Box>
    </Box>
  );
};
