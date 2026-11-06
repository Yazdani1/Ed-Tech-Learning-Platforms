'use client';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { PUBLIC_NAV_LINKS } from '../common/public-links';
import { useVisibleLinks } from '../common/useVisibleLinks';

import { NavDrawerAuthButtons } from './NavDrawerAuthButtons';

import type { FC } from 'react';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 280;

/** Phones and tablets: every public link plus the dashboard or sign-in buttons. */
export const NavDrawer: FC<NavDrawerProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const links = useVisibleLinks(PUBLIC_NAV_LINKS);
  const pathname = usePathname();

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
            {links.map((link) => (
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
        <NavDrawerAuthButtons onNavigate={onClose} />
      </Box>
    </Drawer>
  );
};
