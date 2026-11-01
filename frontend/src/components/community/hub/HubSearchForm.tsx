'use client';

import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SearchField } from '@/components/common/SearchField';

import type { FC, SyntheticEvent } from 'react';

const SEARCH_GRADIENT = 'linear-gradient(135deg, #f57c00 0%, #ffb300 52%, #ec407a 100%)';
const formSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
  gap: { xs: 0.75, sm: 0 },
  p: { xs: 0.75, sm: 0 },
  borderRadius: { xs: 4, sm: 999 },
  maxWidth: 860,
  width: '100%',
  overflow: 'hidden',
  boxShadow: '0 18px 38px rgba(0, 0, 0, 0.2)',
} as const;
const fieldSx = {
  '& .MuiOutlinedInput-root': { minHeight: 56, '& fieldset': { borderColor: 'transparent' } },
};
const buttonSx = {
  px: 4.5,
  minHeight: 56,
  borderRadius: { xs: 999, sm: 0 },
  fontWeight: 900,
  boxShadow: 'none',
  background: SEARCH_GRADIENT,
};

interface HubSearchFormProps {
  /** The search in the URL (the box starts with it) */
  search: string;
  onSearch: (search: string) => void;
}

/** The hero's round search box: submit searches, clearing the text (or ✕) shows everything again. */
export const HubSearchForm: FC<HubSearchFormProps> = ({ search, onSearch }) => {
  const { t } = useTranslation();
  const [text, setText] = useState(search);

  const submit = (event: SyntheticEvent): void => {
    event.preventDefault();
    if (text.trim()) onSearch(text.trim());
  };
  const clear = (): void => {
    setText('');
    if (search) onSearch('');
  };

  return (
    <Paper component="form" role="search" onSubmit={submit} elevation={0} sx={formSx}>
      <SearchField
        type="text"
        size="medium"
        value={text}
        label={t('community.search.label')}
        placeholder={t('community.search.placeholder')}
        onChange={(value) => {
          if (value === '') clear();
          else setText(value);
        }}
        endAdornment={
          text ? (
            <InputAdornment position="end">
              <IconButton
                aria-label={t('community.search.clear')}
                onClick={clear}
                sx={{ width: 44, height: 44 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
        sx={fieldSx}
      />
      <Button type="submit" variant="contained" sx={buttonSx}>
        {t('community.search.button')}
      </Button>
    </Paper>
  );
};
