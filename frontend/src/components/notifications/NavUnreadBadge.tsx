'use client';

import Badge from '@mui/material/Badge';

import { useNavUnreadCount, type NavBadgeKind } from './useNavUnreadCount';

import type { FC, ReactNode } from 'react';

interface NavUnreadBadgeProps {
  kind: NavBadgeKind;
  /** The menu icon */
  children: ReactNode;
}

/**
 * The red unread count on a sidebar icon (nav item `badge`), hidden at zero. Only visual: the item's
 * accessible name carries the count (SidebarNavItem).
 */
export const NavUnreadBadge: FC<NavUnreadBadgeProps> = ({ kind, children }) => {
  const count = useNavUnreadCount(kind);
  return (
    <Badge badgeContent={count} color="error" invisible={count === 0} aria-hidden>
      {children}
    </Badge>
  );
};
