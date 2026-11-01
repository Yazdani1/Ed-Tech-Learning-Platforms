'use client';

import { useEffect, useRef, useState } from 'react';

import { SearchField } from '@/components/common/SearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import type { FC } from 'react';

interface PeopleSearchFieldProps {
  /** The search in the address bar */
  value: string;
  /** Called once typing pauses */
  onSearch: (value: string) => void;
  label: string;
  placeholder?: string;
}

/** Search box that updates the list once typing pauses (not on every key press). */
export const PeopleSearchField: FC<PeopleSearchFieldProps> = ({
  value,
  onSearch,
  label,
  placeholder,
}) => {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text);
  const lastSent = useRef(value);

  // "Clear filters" (or back/forward) changes the URL: show it in the box
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const next = debounced.trim();
    if (next === lastSent.current) return;
    lastSent.current = next;
    onSearch(next);
  }, [debounced, onSearch]);

  return (
    <SearchField
      showLabel
      label={label}
      placeholder={placeholder}
      value={text}
      onChange={setText}
    />
  );
};
