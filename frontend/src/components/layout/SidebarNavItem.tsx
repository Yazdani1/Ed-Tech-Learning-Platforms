'use client';

import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { NavUnreadBadge } from '@/components/notifications/NavUnreadBadge';
import { useNavUnreadCount } from '@/components/notifications/useNavUnreadCount';

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
  const unread = useNavUnreadCount(item.badge);
  // Screen readers and the collapsed tooltip get the unread count too (the badge is only visual)
  const fullLabel = unread > 0 ? t('messaging.nav.withUnread', { label, count: unread }) : label;
  const Icon = item.icon;
  return (
    <Tooltip title={collapsed ? fullLabel : ''} placement="right">
      <ListItemButton
        component={Link}
        href={item.href}
        selected={active}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed || unread > 0 ? fullLabel : undefined}
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
          {item.badge ? (
            <NavUnreadBadge kind={item.badge}>
              <Icon />
            </NavUnreadBadge>
          ) : (
            <Icon />
          )}
        </ListItemIcon>
        {!collapsed && <ListItemText primary={label} />}
      </ListItemButton>
    </Tooltip>
  );
};
