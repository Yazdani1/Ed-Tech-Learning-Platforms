'use client';

import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface SidebarHeaderProps {
  collapsed: boolean;
  /** Desktop only: the collapse/expand button */
  onToggleCollapsed?: () => void;
}

/** App name and the collapse/expand button at the top of the sidebar. */
export const SidebarHeader: FC<SidebarHeaderProps> = ({ collapsed, onToggleCollapsed }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 1 : 2,
        minHeight: 64,
      }}
    >
      {!collapsed && (
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }} noWrap>
          {t('common.appName')}
        </Typography>
      )}
      {onToggleCollapsed && (
        <IconButton
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      )}
    </Box>
  );
};
