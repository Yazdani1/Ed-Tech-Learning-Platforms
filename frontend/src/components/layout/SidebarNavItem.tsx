'use client';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { NavItem } from './nav-items';
import type { FC } from 'react';

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  /** Collapsed sidebar: icon only, with the text as a tooltip */
  collapsed: boolean;
  onNavigate?: () => void;
}

export const SidebarNavItem: FC<SidebarNavItemProps> = ({
  item,
  active,
  collapsed,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const label = t(item.labelKey);
  const Icon = item.icon;
  return (
    <Tooltip title={collapsed ? label : ''} placement="right">
      <ListItemButton
        component={Link}
        href={item.href}
        selected={active}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
        sx={{
          mx: 1,
          mb: 0.5,
          minHeight: 44,
          borderRadius: 2,
          justifyContent: collapsed ? 'center' : 'initial',
          px: collapsed ? 1.5 : 2,
        }}
      >
        <ListItemIcon
          sx={{ minWidth: 0, mr: collapsed ? 0 : 2, color: active ? 'primary.main' : 'inherit' }}
        >
          <Icon />
        </ListItemIcon>
        {!collapsed && <ListItemText primary={label} />}
      </ListItemButton>
    </Tooltip>
  );
};
