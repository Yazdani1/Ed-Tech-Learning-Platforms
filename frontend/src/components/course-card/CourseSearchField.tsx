'use client';

import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC } from 'react';

interface CourseSearchFieldProps {
  /** The search text in the URL */
  value: string;
  /** Called shortly after typing stops (updates the URL) */
  onSearch: (value: string) => void;
  /** Called on every key (e.g. to filter an already loaded list at once) */
  onTextChange?: (value: string) => void;
  placeholder: string;
  /** Accessible name of the box */
  label: string;
  /** Layout of the wrapper (margins, max width) */
  sx?: SxProps<Theme>;
}

/** Waits this long after the last key before searching (as the old pages did). */
export const SEARCH_DEBOUNCE_MS = 350;

/** Course search box: types freely, searches (updates the URL) shortly after typing stops. */
export const CourseSearchField: FC<CourseSearchFieldProps> = ({
  value,
  onSearch,
  onTextChange,
  placeholder,
  label,
  sx,
}) => {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);

  // The URL changed from outside (clear filters, back button): show its value
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }

  useEffect(() => {
    if (text.trim() === value.trim()) return undefined;
    const timer = setTimeout(() => {
      setSynced(text.trim());
      onSearch(text);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [text, value, onSearch]);

  return (
    <Box sx={sx}>
      <TextField
        size="small"
        fullWidth
        type="search"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onTextChange?.(event.target.value);
        }}
        placeholder={placeholder}
        slotProps={{
          htmlInput: { 'aria-label': label },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
      />
    </Box>
  );
};
