'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';

import type { FC, ReactNode } from 'react';

interface PracticeSidePaneProps {
  side: 'left' | 'right';
  width: number;
  expandLabel: string;
  collapseLabel: string;
  children: ReactNode;
}

const COLLAPSED_WIDTH = 52;
const TOGGLE_SIZE = 44;
/** Below the sticky top bar */
const STICKY_TOP = 72;

/** A desktop sidebar of the practice page (course list or quiz banks) that folds to a thin strip. */
export const PracticeSidePane: FC<PracticeSidePaneProps> = ({
  side,
  width,
  expandLabel,
  collapseLabel,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const pointsLeft = side === 'left' ? !collapsed : collapsed;
  const label = collapsed ? expandLabel : collapseLabel;
  return (
    <Box
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : width,
        flexShrink: 0,
        [side === 'left' ? 'borderRight' : 'borderLeft']: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: STICKY_TOP,
        alignSelf: 'flex-start',
        maxHeight: `calc(100vh - ${STICKY_TOP}px)`,
        overflowY: 'auto',
        transition: 'width 0.2s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
          p: 0.5,
        }}
      >
        <Tooltip title={label}>
          <IconButton
            aria-label={label}
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed((value) => !value);
            }}
            sx={{
              width: TOGGLE_SIZE,
              height: TOGGLE_SIZE,
              color: 'common.white',
              bgcolor: side === 'left' ? 'warning.main' : 'primary.main',
              '&:hover': { bgcolor: side === 'left' ? 'warning.dark' : 'primary.dark' },
            }}
          >
            {pointsLeft ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {!collapsed && children}
    </Box>
  );
};
