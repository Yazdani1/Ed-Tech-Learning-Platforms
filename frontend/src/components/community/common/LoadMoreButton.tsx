'use client';

import Button from '@mui/material/Button';

import type { FC } from 'react';

interface LoadMoreButtonProps {
  label: string;
  loadingLabel: string;
  loading: boolean;
  onClick: () => void;
}

/** Round "Load more ..." button under the discussion and answer lists. */
export const LoadMoreButton: FC<LoadMoreButtonProps> = ({
  label,
  loadingLabel,
  loading,
  onClick,
}) => (
  <Button
    variant="outlined"
    disabled={loading}
    onClick={onClick}
    sx={{
      alignSelf: 'center',
      minHeight: 44,
      borderRadius: 999,
      px: 3,
      bgcolor: 'background.paper',
    }}
  >
    {loading ? loadingLabel : label}
  </Button>
);
