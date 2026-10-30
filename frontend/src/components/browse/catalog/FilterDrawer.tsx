'use client';

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Courses matching the current filters (shown on the close button) */
  total: number;
  children: ReactNode;
}

const DRAWER_WIDTH = 320;

/** Phones and tablets: the filter panel slides in from the left; filters apply at once. */
export const FilterDrawer: FC<FilterDrawerProps> = ({ open, onClose, total, children }) => {
  const { t } = useTranslation();
  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="left"
      sx={{ display: { md: 'none' } }}
      slotProps={{
        paper: {
          sx: { width: DRAWER_WIDTH, maxWidth: '88vw', display: 'flex', flexDirection: 'column' },
          'aria-label': t('browse.filters.title'),
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
        <IconButton
          onClick={onClose}
          aria-label={t('browse.filters.close')}
          sx={{ width: 44, height: 44 }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>{children}</Box>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button fullWidth variant="contained" onClick={onClose} sx={{ minHeight: 44 }}>
          {t('browse.catalog.showResults')} ({total})
        </Button>
      </Box>
    </Drawer>
  );
};
