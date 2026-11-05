'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT } from '@/theme/fonts';

import { FOOTER_LINKS } from '../common/public-links';
import { useVisibleLinks } from '../common/useVisibleLinks';

import { FOOTER_HEADING_SX, FOOTER_LINE_SX, FooterContact } from './FooterContact';
import { FooterPaymentMarks } from './FooterPaymentMarks';
import { FooterSocialLinks } from './FooterSocialLinks';

const FOOTER_SX = {
  color: 'common.white',
  background: 'linear-gradient(115deg, #1e1b4b 0%, #4c1d95 38%, #86198f 70%, #9f1239 100%)',
  borderTop: '4px solid transparent',
  borderImage: 'linear-gradient(90deg, #22d3ee, #a78bfa, #fbbf24, #fb7185) 1',
  pt: { xs: 5, md: 7 },
  pb: 3,
} as const;
const GRID_SX = {
  display: 'grid',
  gap: { xs: 4, md: 6 },
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: '2fr 1fr 1.5fr' },
  mb: { xs: 4, md: 5 },
} as const;
const COPYRIGHT_SX = {
  pt: 3,
  textAlign: 'center',
  borderTop: '1px solid rgba(255,255,255,0.25)',
} as const;

/** Gradient footer of every public page: name, tagline and social icons, main links, company contact, payment methods, copyright. */
export const PublicFooter = () => {
  const { t } = useTranslation();
  const links = useVisibleLinks(FOOTER_LINKS);
  return (
    <Box component="footer" sx={FOOTER_SX}>
      <Container maxWidth="lg">
        <Box sx={GRID_SX}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <SchoolIcon sx={{ fontSize: 32, color: '#fde68a' }} aria-hidden />
              <Typography
                component="p"
                sx={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: '1.5rem' }}
              >
                {t('common.appName')}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ maxWidth: 380, lineHeight: 1.7 }}>
              {t('public.footer.tagline')}
            </Typography>
            <FooterSocialLinks />
          </Box>
          <Box component="nav" aria-label={t('public.footer.label')}>
            <Typography component="h2" sx={FOOTER_HEADING_SX}>
              {t('public.footer.explore')}
            </Typography>
            {links.map((link) => (
              <MuiLink
                key={link.href}
                component={Link}
                href={link.href}
                variant="body2"
                underline="hover"
                sx={FOOTER_LINE_SX}
              >
                {t(link.labelKey)}
              </MuiLink>
            ))}
          </Box>
          <FooterContact />
        </Box>
        <FooterPaymentMarks />
        <Typography variant="body2" sx={COPYRIGHT_SX}>
          {t('public.footer.copyright', { year: DateTime.now().year })}
        </Typography>
      </Container>
    </Box>
  );
};
