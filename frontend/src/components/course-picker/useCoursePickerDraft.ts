'use client';

import { useState } from 'react';

interface CoursePickerDraft {
  search: string;
  setSearch: (value: string) => void;
  /** Ticked course ids (not applied yet); empty = all courses */
  draft: string[];
  setDraft: (ids: string[]) => void;
  toggle: (courseId: string) => void;
}

/** The picker's search text and ticks; each time the panel opens they restart from the applied selection. */
export const useCoursePickerDraft = (
  open: boolean,
  selectedIds: readonly string[],
): CoursePickerDraft => {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>([...selectedIds]);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft([...selectedIds]);
      setSearch('');
    }
  }
  const toggle = (courseId: string): void => {
    setDraft((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId],
    );
  };
  return { search, setSearch, draft, setDraft, toggle };
};
