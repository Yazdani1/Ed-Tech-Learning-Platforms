'use client';

import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import { useSiteSettings } from '@/api/site-settings.api';
import { SOCIAL_FIELDS, type SocialField } from '@/schemas/site-settings.schema';
import { isSafeHttpUrl } from '@/utils/urls';

import type { ReactNode } from 'react';

const ICONS: Record<SocialField, ReactNode> = {
  facebook: <FacebookIcon />,
  youtube: <YouTubeIcon />,
  linkedin: <LinkedInIcon />,
  instagram: <InstagramIcon />,
};
const BUTTON_SX = {
  width: 44,
  height: 44,
  color: 'common.white',
  bgcolor: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.25)',
  transition: 'transform 0.2s ease, background-color 0.2s ease',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', transform: 'translateY(-2px)' },
  '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
} as const;

/** Round social icons from the Company Contact page (new tab); nothing while no link is saved. */
export const FooterSocialLinks = () => {
  const { t } = useTranslation();
  const contact = useSiteSettings().data?.contact;
  const links = SOCIAL_FIELDS.flatMap((field) => {
    const url = contact?.[field];
    return isSafeHttpUrl(url) ? [{ field, url }] : [];
  });
  if (links.length === 0) return null;
  return (
    <Box
      component="ul"
      aria-label={t('public.footer.social')}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, listStyle: 'none', p: 0, m: 0, mt: 2.5 }}
    >
      {links.map(({ field, url }) => (
        <li key={field}>
          <IconButton
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(`public.footer.${field}`)}
            sx={BUTTON_SX}
          >
            {ICONS[field]}
          </IconButton>
        </li>
      ))}
    </Box>
  );
};
