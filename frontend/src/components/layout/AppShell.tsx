'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { usePathname } from 'next/navigation';
import { useState, type FC, type ReactNode } from 'react';

import { SidebarContent } from './SidebarContent';
import { TopBar } from './TopBar';

import type { NavItem } from './nav-items';

const DRAWER_OPEN_WIDTH = 240;
const DRAWER_CLOSED_WIDTH = 64;
/** Pages that start with the sidebar collapsed, to give the editor/player more room (as before). */
const COLLAPSED_PAGES = /\/learn$|\/courses\/create$|\/edit$/;

interface AppShellProps {
  navItems: readonly NavItem[];
  children: ReactNode;
}

/**
 * Signed-in area frame (admin, student, teacher). Desktop: a permanent sidebar that can collapse to icons.
 * Phones/tablets: a top bar whose menu button opens the same sidebar as a drawer.
 */
export const AppShell: FC<AppShellProps> = ({ navItems, children }) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [preferOpen, setPreferOpen] = useState(true);
  // A collapsed-by-default page the user expanded; other pages follow `preferOpen`
  const [expandedOn, setExpandedOn] = useState<string | null>(null);
  const startsCollapsed = COLLAPSED_PAGES.test(pathname);
  const open = startsCollapsed ? expandedOn === pathname : preferOpen;
  const width = open ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH;

  const toggleCollapsed = (): void => {
    if (startsCollapsed) setExpandedOn(open ? null : pathname);
    else setPreferOpen(!open);
  };
  const closeMobile = (): void => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'grey.50' }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width,
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
            boxSizing: 'border-box',
          },
        }}
      >
        <SidebarContent navItems={navItems} collapsed={!open} onToggleCollapsed={toggleCollapsed} />
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_OPEN_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent navItems={navItems} collapsed={false} onNavigate={closeMobile} />
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          onOpenMenu={() => {
            setMobileOpen(true);
          }}
        />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
