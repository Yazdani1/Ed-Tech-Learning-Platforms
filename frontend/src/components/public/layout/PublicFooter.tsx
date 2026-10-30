'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { FOOTER_LINKS } from '../common/public-links';

/** Dark footer of every public page: app name, main links and the copyright line. */
export const PublicFooter = () => {
  const { t } = useTranslation();
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.900', color: 'grey.400', py: 5 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ color: 'primary.light', fontSize: 28 }} aria-hidden />
            <Typography variant="h6" component="p" sx={{ color: 'common.white', fontWeight: 800 }}>
              {t('common.appName')}
            </Typography>
          </Box>
          <Box
            component="nav"
            aria-label={t('public.footer.label')}
            sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3 }}
          >
            {FOOTER_LINKS.map((link) => (
              <MuiLink
                key={link.href}
                component={Link}
                href={link.href}
                variant="body2"
                underline="hover"
                sx={{ color: 'inherit', py: 1.5, '&:hover': { color: 'common.white' } }}
              >
                {t(link.labelKey)}
              </MuiLink>
            ))}
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'grey.800', mb: 3 }} />
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          {t('public.footer.copyright', { year: DateTime.now().year })}
        </Typography>
      </Container>
    </Box>
  );
};
