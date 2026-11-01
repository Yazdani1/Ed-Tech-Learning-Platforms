'use client';

import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';

import { SearchField } from '@/components/common/SearchField';
import { SEARCH_DEBOUNCE_MS } from '@/hooks/useDebouncedValue';

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
      <SearchField
        value={text}
        onChange={(next) => {
          setText(next);
          onTextChange?.(next);
        }}
        label={label}
        placeholder={placeholder}
        sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
      />
    </Box>
  );
};
