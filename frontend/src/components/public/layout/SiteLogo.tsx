'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useSiteLogo } from '@/api/public.api';

import { isCloudinaryUrl } from '@/utils/urls';

/** Uploaded logo box: at most this wide on phones / larger screens (same as the old navbar). */
const LOGO_SX = {
  position: 'relative',
  height: { xs: 36, sm: 42 },
  width: { xs: 132, sm: 176 },
} as const;
const LOGO_SIZES = '176px';

/** The site logo (uploaded by admins on the Homepage Showcase page), or the app name as a fallback. */
export const SiteLogo = () => {
  const { t } = useTranslation();
  const { data: logo } = useSiteLogo();
  const imageUrl = logo?.imageUrl;

  return (
    <Box
      component={Link}
      href="/"
      aria-label={t('public.nav.home')}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 44,
        textDecoration: 'none',
        color: 'primary.main',
        flexShrink: 0,
      }}
    >
      {isCloudinaryUrl(imageUrl) ? (
        <Box sx={LOGO_SX}>
          <Image
            src={imageUrl}
            alt={t('public.nav.logoAlt')}
            fill
            sizes={LOGO_SIZES}
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
            priority
          />
        </Box>
      ) : (
        <>
          <SchoolIcon sx={{ fontSize: 28 }} aria-hidden />
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 800, display: { xs: 'none', sm: 'block' }, letterSpacing: -0.5 }}
          >
            {t('common.appName')}
          </Typography>
        </>
      )}
    </Box>
  );
};
