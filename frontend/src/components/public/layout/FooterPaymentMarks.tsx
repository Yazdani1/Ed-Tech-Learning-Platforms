'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

/** Word marks of the Bangladeshi payment methods (names and brand colours; no third-party images). */
const MARKS = [
  { name: 'bKash', color: '#d6175f' },
  { name: 'Nagad', color: '#ea580c' },
  { name: 'Rocket', color: '#7e22ce' },
  { name: 'Upay', color: '#0f4c97' },
  { name: 'VISA', color: '#1a1f71', italic: true },
  { name: 'Mastercard', color: '#eb001b' },
  { name: 'AMEX', color: '#2e77bc' },
  { name: 'DBBL Nexus', color: '#0b6e4f' },
] as const;
const MARK_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 72,
  height: 34,
  px: 1.25,
  borderRadius: '6px',
  bgcolor: 'common.white',
  fontSize: '0.8rem',
  fontWeight: 800,
  letterSpacing: 0.2,
  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
} as const;

/** "We accept" with the payment method cards, above the copyright line. */
export const FooterPaymentMarks = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 3,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700, mr: 0.5 }}>
        {t('public.footer.payWith')}
      </Typography>
      <Box
        component="ul"
        aria-label={t('public.footer.paymentMethods')}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1,
          listStyle: 'none',
          p: 0,
          m: 0,
        }}
      >
        {MARKS.map((mark) => (
          <Box
            component="li"
            key={mark.name}
            sx={{
              ...MARK_SX,
              color: mark.color,
              fontStyle: 'italic' in mark ? 'italic' : 'normal',
            }}
          >
            {mark.name}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
