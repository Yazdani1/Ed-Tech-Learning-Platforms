'use client';

import Menu from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from './LanguageSwitcher';
import { NavAuthActions } from './NavAuthActions';
import { NavDrawer } from './NavDrawer';
import { NavSearch } from './NavSearch';
import { PublicNavLinks } from './PublicNavLinks';
import { SiteLogo } from './SiteLogo';

const TOOLBAR_HEIGHT = 68;

/** Top bar of every public page (container width): logo, search, links, language switch, dashboard or sign-in. */
export const PublicNavbar = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: { xs: 1, sm: 2 }, minHeight: TOOLBAR_HEIGHT }}>
          <SiteLogo />
          <Suspense fallback={<Box sx={{ flex: 1 }} />}>
            <NavSearch />
          </Suspense>
          <PublicNavLinks />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <LanguageSwitcher />
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
      </Container>
      <NavDrawer
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
        }}
      />
    </AppBar>
  );
};
