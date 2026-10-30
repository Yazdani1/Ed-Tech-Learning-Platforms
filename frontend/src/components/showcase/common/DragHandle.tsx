'use client';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box';

import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { FC } from 'react';

interface DragHandleProps {
  handleProps: DraggableProvidedDragHandleProps | null;
  label: string;
}

const HANDLE_SIZE = 44;

/** The grip a sortable row is dragged by (also focusable: space to lift, arrows to move). */
export const DragHandle: FC<DragHandleProps> = ({ handleProps, label }) => (
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
      color: 'text.secondary',
      cursor: 'grab',
      borderRadius: 1,
      '&:focus-visible': { outline: 2, outlineColor: 'primary.main' },
    }}
  >
    <DragIndicatorIcon />
  </Box>
);
