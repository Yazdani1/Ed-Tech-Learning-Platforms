'use client';

import Logout from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useLogout } from '@/api/auth.api';

import type { FC } from 'react';

interface SidebarLogoutButtonProps {
  collapsed: boolean;
}

/** The sign-out row at the bottom of every sidebar, in red (the user's name and role are in the top bar). */
export const SidebarLogoutButton: FC<SidebarLogoutButtonProps> = ({ collapsed }) => {
  const { t } = useTranslation();
  const logoutMutation = useLogout();
  const label = t('nav.logout');

  // RequireRole sees the signed-out user and opens the sign-in panel (it owns that navigation)
  const signOut = (): void => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => toast.success(t('auth.logoutSuccess')),
      onError: () => toast.error(t('auth.logoutFailed')),
    });
  };

  return (
    <Box sx={{ py: 1 }}>
      <Tooltip title={collapsed ? label : ''} placement="right">
        <ListItemButton
          component="button"
          onClick={signOut}
          disabled={logoutMutation.isPending}
          aria-label={label}
          sx={{
            mx: 1,
            width: (theme) => `calc(100% - ${theme.spacing(2)})`,
            minHeight: 44,
            borderRadius: 2,
            justifyContent: collapsed ? 'center' : 'initial',
            px: collapsed ? 1.5 : 2,
            color: 'error.main',
            '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: 'error.main' }}>
            <Logout />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary={label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          )}
        </ListItemButton>
      </Tooltip>
    </Box>
  );
};
