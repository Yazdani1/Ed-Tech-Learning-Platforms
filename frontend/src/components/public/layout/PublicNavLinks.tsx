'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { PUBLIC_NAV_LINKS } from '../common/public-links';

/** The public links inline in the navbar (wide screens; phones and tablets use NavDrawer). */
export const PublicNavLinks = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  return (
    <Box
      component="nav"
      aria-label={t('public.nav.label')}
      sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.5, flexShrink: 0 }}
    >
      {PUBLIC_NAV_LINKS.map((link) => (
        <Button
          key={link.href}
          component={Link}
          href={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
          sx={{
            color: pathname === link.href ? 'primary.main' : 'text.primary',
            fontWeight: 500,
            minHeight: 44,
          }}
        >
          {t(link.labelKey)}
        </Button>
      ))}
    </Box>
  );
};
