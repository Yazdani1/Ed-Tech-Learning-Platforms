'use client';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME } from '@/utils/roles';

import { PUBLIC_NAV_LINKS } from '../common/public-links';

import type { FC } from 'react';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 280;

/** Phones and tablets: every public link plus the dashboard or sign-in buttons. */
export const NavDrawer: FC<NavDrawerProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: DRAWER_WIDTH, maxWidth: '85vw', p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            onClick={onClose}
            aria-label={t('public.nav.closeMenu')}
            sx={{ width: 44, height: 44 }}
          >
            <Close />
          </IconButton>
        </Box>
        <Box component="nav" aria-label={t('public.nav.label')}>
          <List>
            {PUBLIC_NAV_LINKS.map((link) => (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                onClick={onClose}
                selected={pathname === link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                sx={{ minHeight: 48, borderRadius: 1 }}
              >
                <ListItemText primary={t(link.labelKey)} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={1} sx={{ p: 1 }}>
          {user ? (
            <Button
              component={Link}
              href={ROLE_HOME[user.role]}
              variant="outlined"
              onClick={onClose}
            >
              {t('public.nav.dashboard')}
            </Button>
          ) : (
            <>
              <Button component={Link} href="/auth/login" variant="outlined" onClick={onClose}>
                {t('public.nav.signIn')}
              </Button>
              <Button component={Link} href="/auth/register" variant="contained" onClick={onClose}>
                {t('public.nav.signUp')}
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};
