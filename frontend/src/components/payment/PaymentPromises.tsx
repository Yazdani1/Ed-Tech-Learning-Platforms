'use client';

import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const BADGE_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  flex: 1,
  minWidth: 130,
  px: 1.25,
  py: 1,
  borderRadius: '8px',
  bgcolor: '#f1f3f6',
  fontSize: '0.85rem',
} as const;

/** Under the pay button: the terms line and two small promises. */
export const PaymentPromises = () => {
  const { t } = useTranslation();
  return (
    <>
      <Typography variant="body2" sx={{ color: '#334155', textAlign: 'center', my: 1.5 }}>
        {t('payment.terms')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={BADGE_SX}>
          <VerifiedOutlinedIcon sx={{ fontSize: 18, color: '#047857' }} aria-hidden />
          {t('payment.guaranteeShort')}
        </Box>
        <Box sx={BADGE_SX}>
          <BoltIcon sx={{ fontSize: 18, color: '#1d4ed8' }} aria-hidden />
          {t('payment.instantAccess')}
        </Box>
      </Box>
    </>
  );
};
