'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

import { QueryState } from '@/components/common/QueryState';

import { CoursePickerFooter } from './CoursePickerFooter';
import { CoursePickerHeader } from './CoursePickerHeader';
import { CoursePickerList } from './CoursePickerList';
import { useCoursePickerDraft } from './useCoursePickerDraft';

import type { PickerCourse } from './course-picker.types';
import type { ApiError } from '@/services/http.service';
import type { FC } from 'react';

const DRAWER_WIDTH = { xs: '100%', sm: 560, md: 640 } as const;
const TITLE_ID = 'course-picker-title';

interface CourseQuery {
  data: PickerCourse[] | undefined;
  isPending: boolean;
  error: ApiError | null;
  refetch: () => unknown;
}

interface CoursePickerDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  courses: CourseQuery;
  /** The applied selection; empty = all courses */
  selectedIds: readonly string[];
  /** The count chip of a course ("12 paid students") */
  countLabel: (count: number) => string;
  onApply: (courseIds: string[]) => void;
}

/**
 * Left side panel (full width on phones) to pick several courses: title search, "All courses", one row per
 * course (checkbox, cover, title, student count). Ticks are kept until "Apply"; closing discards them.
 */
export const CoursePickerDrawer: FC<CoursePickerDrawerProps> = ({
  open,
  onClose,
  title,
  courses,
  selectedIds,
  countLabel,
  onApply,
}) => {
  const { search, setSearch, draft, setDraft, toggle } = useCoursePickerDraft(open, selectedIds);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-labelledby': TITLE_ID,
          sx: { width: DRAWER_WIDTH, display: 'flex', flexDirection: 'column' },
        },
      }}
    >
      <CoursePickerHeader
        titleId={TITLE_ID}
        title={title}
        search={search}
        onSearchChange={setSearch}
        onClose={onClose}
      />
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, pb: 2 }}>
        <QueryState
          isLoading={courses.isPending}
          error={courses.error}
          onRetry={() => void courses.refetch()}
        >
          <CoursePickerList
            courses={courses.data ?? []}
            search={search}
            selectedIds={draft}
            countLabel={countLabel}
            onToggle={toggle}
            onSelectAll={() => {
              setDraft([]);
            }}
          />
        </QueryState>
      </Box>
      <CoursePickerFooter
        selectedCount={draft.length}
        onClear={() => {
          setDraft([]);
        }}
        onApply={() => {
          onApply(draft);
        }}
      />
    </Drawer>
  );
};
