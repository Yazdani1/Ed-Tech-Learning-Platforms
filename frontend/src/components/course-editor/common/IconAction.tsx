'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import type { FC, ReactNode } from 'react';

interface IconActionProps {
  /** Tooltip and accessible name */
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color?: 'default' | 'primary' | 'error';
}

const SIZE = 44;

/** A 44 px icon button with a tooltip (edit, delete, rename...). */
export const IconAction: FC<IconActionProps> = ({ label, icon, onClick, color = 'default' }) => (
  <Tooltip title={label}>
    <IconButton
      aria-label={label}
      color={color}
      onClick={onClick}
      sx={{ width: SIZE, height: SIZE }}
    >
      {icon}
    </IconButton>
  </Tooltip>
);
