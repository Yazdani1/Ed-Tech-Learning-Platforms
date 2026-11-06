'use client';

import CloseIcon from '@mui/icons-material/Close';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DiscountCountdown } from '@/components/public/layout/DiscountCountdown';
import { MONO_FONT } from '@/theme/fonts';
import { formatBdt, localizeDigits } from '@/utils/price';

import type { CourseOffer } from '@/schemas/coupon.schema';
import type { FC } from 'react';

interface AppliedCouponBoxProps {
  offer: CourseOffer;
  onRemove: () => void;
  /** The time ran out */
  onExpire: () => void;
}

const BOX_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  p: 1.25,
  pl: 1.5,
  borderRadius: '12px',
  border: '1px dashed #10b981',
  bgcolor: '#ecfdf5',
} as const;

/** The applied code, its saving and the time left until it ends; the cross removes it (list price). */
export const AppliedCouponBox: FC<AppliedCouponBoxProps> = ({ offer, onRemove, onExpire }) => {
  const { t, i18n } = useTranslation();
  const saving = localizeDigits(formatBdt(offer.discountAmount), i18n.language);
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={BOX_SX}>
        <LocalOfferOutlinedIcon sx={{ color: '#047857' }} aria-hidden />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: '#065f46', fontFamily: MONO_FONT }}
          >
            {offer.code}
          </Typography>
          <Typography variant="caption" sx={{ color: '#065f46', display: 'block' }}>
            {t('coupons.field.applied', { code: offer.code, amount: saving })}
          </Typography>
        </Box>
        <IconButton
          aria-label={t('coupons.field.remove')}
          onClick={onRemove}
          sx={{ width: 44, height: 44 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ mt: 1 }}>
        {offer.endsAt ? (
          <DiscountCountdown endsAt={offer.endsAt} onEnded={onExpire} tone="light" />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {t('coupons.field.noEnd')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
