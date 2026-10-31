'use client';

import CloseIcon from '@mui/icons-material/Close';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { IconAction } from '../common/IconAction';

import type { FC } from 'react';

interface ListFieldItemProps {
  /** Name of the list (for the accessible names) */
  list: string;
  position: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}

/** One editable item of a list field, with its remove button. */
export const ListFieldItem: FC<ListFieldItemProps> = ({
  list,
  position,
  value,
  onChange,
  onRemove,
}) => {
  const { t } = useTranslation();
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        slotProps={{
          htmlInput: { 'aria-label': t('catalog.content.item', { list, n: position }) },
        }}
      />
      <IconAction
        label={t('catalog.content.removeItem', { n: position })}
        icon={<CloseIcon fontSize="small" />}
        onClick={onRemove}
      />
    </Stack>
  );
};
