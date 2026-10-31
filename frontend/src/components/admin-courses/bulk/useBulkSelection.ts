'use client';

import { useMemo, useState } from 'react';

import type { AdminCourse } from '@/schemas/admin-courses.schema';

export interface SelectorFilters {
  search: string;
  status: string;
  visibility: string;
  pricing: string;
  category: string;
  courseType: string;
}

export type SelectorFilterKey = keyof SelectorFilters;

const EMPTY: SelectorFilters = {
  search: '',
  status: '',
  visibility: '',
  pricing: '',
  category: '',
  courseType: '',
};

export interface BulkSelection {
  filters: SelectorFilters;
  setFilter: (key: SelectorFilterKey, value: string) => void;
  /** The courses that match the dialog's own filters */
  visible: AdminCourse[];
  selectedIds: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  toggleOne: (id: string) => void;
  toggleAllVisible: () => void;
}

const matches = (course: AdminCourse, filters: SelectorFilters): boolean => {
  const search = filters.search.trim().toLowerCase();
  if (search && !course.title.toLowerCase().includes(search)) return false;
  if (filters.status && course.status !== filters.status) return false;
  if (filters.visibility && course.visibility !== filters.visibility) return false;
  if (filters.pricing && course.pricing !== filters.pricing) return false;
  if (filters.category && course.category?._id !== filters.category) return false;
  if (filters.courseType && course.courseType?._id !== filters.courseType) return false;
  return true;
};

/** Which of the listed courses the bulk change applies to (filtered in the browser, like the old dialog). */
export const useBulkSelection = (courses: AdminCourse[]): BulkSelection => {
  const [filters, setFilters] = useState<SelectorFilters>(EMPTY);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const visible = useMemo(
    () => courses.filter((course) => matches(course, filters)),
    [courses, filters],
  );
  const allVisibleSelected = visible.length > 0 && visible.every((c) => selectedIds.has(c._id));
  const someVisibleSelected = visible.some((c) => selectedIds.has(c._id));

  const toggleOne = (id: string): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = (): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      visible.forEach((course) => {
        if (allVisibleSelected) next.delete(course._id);
        else next.add(course._id);
      });
      return next;
    });
  };

  return {
    filters,
    setFilter: (key, value) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    visible,
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleOne,
    toggleAllVisible,
  };
};
