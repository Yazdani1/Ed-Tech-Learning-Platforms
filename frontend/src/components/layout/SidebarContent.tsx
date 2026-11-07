'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';

import { isNavItemActive, NAV_SECTIONS, type NavItem } from './nav-items';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarLogoutButton } from './SidebarLogoutButton';

import type { FC } from 'react';

interface SidebarContentProps {
  navItems: readonly NavItem[];
  collapsed: boolean;
  /** Desktop only: the collapse/expand button */
  onToggleCollapsed?: () => void;
  /** Phone drawer: close it after choosing a page */
  onNavigate?: () => void;
}

/** Brand, the role-filtered menu (grouped items under headings) and the red sign-out row: shared by the desktop sidebar and the phone drawer. */
export const SidebarContent: FC<SidebarContentProps> = ({
  navItems,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { hasRole } = useAuth();
  const visible = navItems.filter((item) => !item.roles || hasRole(item.roles));
  const renderItem = (item: NavItem) => (
    <SidebarNavItem
      key={item.href}
      item={item}
      active={isNavItemActive(item, pathname)}
      collapsed={collapsed}
      onNavigate={onNavigate}
    />
  );
  const heading = (section: string) =>
    collapsed ? undefined : (
      <Typography
        variant="overline"
        sx={{ px: 2, display: 'block', color: 'text.disabled', fontWeight: 700, lineHeight: 2.5 }}
      >
        {t(`nav.group.${section}`)}
      </Typography>
    );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SidebarHeader collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
      <Divider />
      <Box component="nav" aria-label={t('nav.mainMenu')} sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ pt: 1 }}>{visible.filter((item) => !item.section).map(renderItem)}</List>
        {NAV_SECTIONS.map((section) => {
          const items = visible.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <Box key={section}>
              {collapsed && <Divider sx={{ mx: 1.5, my: 0.5 }} />}
              <List dense disablePadding subheader={heading(section)} sx={{ pb: 0.5 }}>
                {items.map(renderItem)}
              </List>
            </Box>
          );
        })}
      </Box>
      <Divider />
      <SidebarLogoutButton collapsed={collapsed} />
    </Box>
  );
};
