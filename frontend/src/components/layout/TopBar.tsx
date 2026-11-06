'use client';

import Menu from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { TopBarAlerts } from '@/components/notifications/TopBarAlerts';

import { TopBarUser } from './TopBarUser';

import type { FC } from 'react';

interface TopBarProps {
  onOpenMenu: () => void;
}

/**
 * Navbar of the signed-in areas. Every size: the signed-in user at the top right (avatar, name, role or student
 * number). Phones and tablets also get the app name, the menu button and the chat/notification badges.
 */
export const TopBar: FC<TopBarProps> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 0.5 }}>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', minWidth: 0 }}>
          <IconButton
            edge="start"
            onClick={onOpenMenu}
            aria-label={t('shell.openMenu')}
            sx={{ mr: 1, width: 44, height: 44 }}
          >
            <Menu />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'primary.main', display: { xs: 'none', sm: 'block' } }}
            noWrap
          >
            {t('common.appName')}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <TopBarAlerts />
          </Box>
          <TopBarUser />
        </Box>
      </Toolbar>
    </AppBar>
  );
};
