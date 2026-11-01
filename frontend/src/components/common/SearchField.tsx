'use client';

import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC, ReactNode } from 'react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name; shown above the box only with `showLabel` */
  label: string;
  showLabel?: boolean;
  placeholder?: string;
  helperText?: string;
  /** Shows a spinner at the end while results load */
  loading?: boolean;
  /** Anything else at the end of the box (e.g. a clear button) */
  endAdornment?: ReactNode;
  autoFocus?: boolean;
  size?: 'small' | 'medium';
  /** 'search' (default) gives the box the searchbox role; 'text' for a plain text box */
  type?: 'search' | 'text';
  sx?: SxProps<Theme>;
}

const SPINNER_SIZE = 18;

/** The app's search box: a text field with a search icon (lists, chat, Community Hub, dialogs). */
export const SearchField: FC<SearchFieldProps> = ({
  value,
  onChange,
  label,
  showLabel = false,
  placeholder,
  helperText,
  loading = false,
  endAdornment,
  autoFocus,
  size = 'small',
  type = 'search',
  sx,
}) => (
  <TextField
    fullWidth
    autoFocus={autoFocus}
    size={size}
    type={type}
    label={showLabel ? label : undefined}
    placeholder={placeholder}
    helperText={helperText}
    value={value}
    onChange={(event) => {
      onChange(event.target.value);
    }}
    sx={sx}
    slotProps={{
      htmlInput: showLabel ? undefined : { 'aria-label': label },
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
        endAdornment: loading ? <CircularProgress size={SPINNER_SIZE} aria-hidden /> : endAdornment,
      },
    }}
  />
);
