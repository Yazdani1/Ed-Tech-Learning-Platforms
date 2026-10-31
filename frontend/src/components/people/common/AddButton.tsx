'use client';

import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';

import type { FC } from 'react';

interface AddButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/** The primary "+ Add ..." button of a page or panel header. */
export const AddButton: FC<AddButtonProps> = ({ label, onClick, disabled = false }) => (
  <Button
    variant="contained"
    startIcon={<AddIcon />}
    onClick={onClick}
    disabled={disabled}
    sx={{ minHeight: 44 }}
  >
    {label}
  </Button>
);
