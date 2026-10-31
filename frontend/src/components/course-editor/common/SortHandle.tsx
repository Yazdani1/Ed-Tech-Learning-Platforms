'use client';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box';

import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { FC } from 'react';

interface SortHandleProps {
  handleProps: DraggableProvidedDragHandleProps | null;
  label: string;
}

const HANDLE_SIZE = 44;

/** The grip a section or lecture is dragged by (keyboard: space to lift, arrows to move, space to drop). */
export const SortHandle: FC<SortHandleProps> = ({ handleProps, label }) => (
  <Box
    {...handleProps}
    aria-label={label}
    sx={{
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'text.disabled',
      cursor: 'grab',
      borderRadius: 1,
      '&:focus-visible': { outline: 2, outlineColor: 'primary.main' },
    }}
  >
    <DragIndicatorIcon fontSize="small" />
  </Box>
);
