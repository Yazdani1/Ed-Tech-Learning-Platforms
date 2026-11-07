'use client';

import Box from '@mui/material/Box';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { PROMO_PAGE } from '@/components/promos/promo-format';

import { DiscountCountdown } from './DiscountCountdown';

import type { ActivePromo } from '@/schemas/promo.schema';
import type { FC } from 'react';

interface DiscountImageBannerProps {
  promo: ActivePromo;
  imageUrl: string;
  onEnded: () => void;
}

const BANNER_HEIGHT = { xs: 72, sm: 96, md: 120 } as const;

/** The promo banner with the admin's own picture: the whole picture links to the promo page, the countdown sits on it. */
export const DiscountImageBanner: FC<DiscountImageBannerProps> = ({ promo, imageUrl, onEnded }) => {
  const { t } = useTranslation();
  return (
    <Box
      component="aside"
      aria-label={t('promos.banner.label')}
      sx={{ position: 'relative', height: BANNER_HEIGHT, bgcolor: 'grey.900' }}
    >
      <Link href={PROMO_PAGE} aria-label={t('promos.banner.openPromo', { title: promo.title })}>
        <Image
          src={imageUrl}
          alt={promo.title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </Link>
      <Box
        sx={{
          position: 'absolute',
          right: { xs: 8, sm: 24 },
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          '& [role="timer"]': { minWidth: { xs: 0, sm: 172 }, py: { xs: 0.25, sm: 0.75 } },
        }}
      >
        <DiscountCountdown endsAt={promo.endsAt} onEnded={onEnded} />
      </Box>
    </Box>
  );
};
