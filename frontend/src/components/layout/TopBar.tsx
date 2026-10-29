'use client';

import Menu from '@mui/icons-material/Menu';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface TopBarProps {
  onOpenMenu: () => void;
}

/** Phones and tablets: app name and the button that opens the menu drawer. */
export const TopBar: FC<TopBarProps> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ display: { md: 'none' }, borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onOpenMenu}
          aria-label={t('shell.openMenu')}
          sx={{ mr: 1, width: 44, height: 44 }}
        >
          <Menu />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }} noWrap>
          {t('common.appName')}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
