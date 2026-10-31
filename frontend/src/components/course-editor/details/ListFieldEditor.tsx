'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ListFieldItem } from './ListFieldItem';

import type { FC, KeyboardEvent } from 'react';

interface ListFieldEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

/** A list of short texts (what students learn, get, need): add with Enter or +, edit in place, remove. */
export const ListFieldEditor: FC<ListFieldEditorProps> = ({ label, values, onChange }) => {
  const { t } = useTranslation();
  const headingId = useId();
  const [draft, setDraft] = useState('');

  const add = (): void => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    add();
  };

  return (
    <Box role="group" aria-labelledby={headingId}>
      <Typography id={headingId} variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('catalog.content.addItemPlaceholder')}
          slotProps={{ htmlInput: { 'aria-label': t('catalog.content.newItem', { list: label }) } }}
        />
        <IconButton
          color="primary"
          onClick={add}
          aria-label={t('catalog.content.addItem', { list: label })}
          sx={{ width: 44, height: 44, border: 1, borderColor: 'divider' }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Stack spacing={1}>
        {values.map((value, index) => (
          // Items have no id and may repeat: the position is their identity while editing
          <ListFieldItem
            key={index}
            list={label}
            position={index + 1}
            value={value}
            onChange={(next) => {
              onChange(values.map((item, i) => (i === index ? next : item)));
            }}
            onRemove={() => {
              onChange(values.filter((_item, i) => i !== index));
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};
