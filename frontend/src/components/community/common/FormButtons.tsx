'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

interface FormButtonsProps {
  submitLabel: string;
  onCancel: () => void;
  busy: boolean;
  startIcon?: ReactNode;
}

/** Submit + Cancel under the community forms (side by side, stacked on phones). */
export const FormButtons: FC<FormButtonsProps> = ({ submitLabel, onCancel, busy, startIcon }) => {
  const { t } = useTranslation();
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <Button
        type="submit"
        variant="contained"
        startIcon={startIcon}
        disabled={busy}
        sx={{ minHeight: 44 }}
      >
        {submitLabel}
      </Button>
      <Button onClick={onCancel} disabled={busy} sx={{ minHeight: 44 }}>
        {t('common.cancel')}
      </Button>
    </Stack>
  );
};
