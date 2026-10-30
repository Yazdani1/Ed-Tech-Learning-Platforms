'use client';

import Menu from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PUBLIC_NAV_LINKS } from '../common/public-links';

import { NavAuthActions } from './NavAuthActions';
import { NavDrawer } from './NavDrawer';
import { NavSearch } from './NavSearch';
import { SiteLogo } from './SiteLogo';

const TOOLBAR_HEIGHT = 68;

/** Top bar of every public page: logo, course search, public links, dashboard or sign-in buttons. */
export const PublicNavbar = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: TOOLBAR_HEIGHT, px: { xs: 2, sm: 3 } }}>
        <SiteLogo />
        <Suspense fallback={<Box sx={{ flex: 1 }} />}>
          <NavSearch />
        </Suspense>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <NavAuthActions />
          <IconButton
            onClick={() => {
              setMenuOpen(true);
            }}
            aria-label={t('public.nav.openMenu')}
            sx={{ display: { lg: 'none' }, width: 44, height: 44 }}
          >
            <Menu />
          </IconButton>
        </Box>
      </Toolbar>
      <NavDrawer
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
      />
    </AppBar>
  );
};
