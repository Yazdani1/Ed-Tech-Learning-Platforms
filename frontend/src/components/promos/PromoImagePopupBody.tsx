'use client';

import Box from '@mui/material/Box';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { DiscountCountdown } from '@/components/public/layout/DiscountCountdown';

import { PromoCodeBox } from './PromoCodeBox';
import { PROMO_PAGE } from './promo-format';

import type { ActivePromo } from '@/schemas/promo.schema';
import type { FC } from 'react';

interface PromoImagePopupBodyProps {
  promo: ActivePromo;
  imageUrl: string;
  onNavigate: () => void;
}

const NO_OP = (): void => undefined;

/** The pop-up with the admin's own picture (links to the promo page) and the countdown and code under it. */
export const PromoImagePopupBody: FC<PromoImagePopupBodyProps> = ({
  promo,
  imageUrl,
  onNavigate,
}) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Box
        component={Link}
        href={PROMO_PAGE}
        onClick={onNavigate}
        aria-label={t('promos.banner.openPromo', { title: promo.title })}
        sx={{ position: 'relative', display: 'block', width: '100%', aspectRatio: '3 / 4' }}
      >
        <Image
          src={imageUrl}
          alt={promo.title}
          fill
          sizes="(max-width: 600px) 100vw, 444px"
          style={{ objectFit: 'cover' }}
        />
      </Box>
      <Box sx={{ p: 2, display: 'grid', justifyItems: 'center', gap: 1, bgcolor: 'grey.900' }}>
        <DiscountCountdown endsAt={promo.endsAt} onEnded={NO_OP} />
        <PromoCodeBox code={promo.code} />
      </Box>
    </Box>
  );
};
