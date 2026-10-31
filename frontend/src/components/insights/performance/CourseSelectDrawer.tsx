'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { useState } from 'react';

import { QueryState } from '@/components/common/QueryState';

import { CourseSelectHeader } from './CourseSelectHeader';
import { CourseSelectList } from './CourseSelectList';

import type { PerformanceCourse } from '@/schemas/insights.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

const DRAWER_WIDTH = 400;
const TITLE_ID = 'course-select-title';

interface CourseSelectDrawerProps {
  open: boolean;
  onClose: () => void;
  courses: UseQueryResult<PerformanceCourse[], ApiError>;
  /** The selected course id, or "all" */
  selectedId: string;
  onSelect: (courseId: string) => void;
}

/** Side panel (full width on phones) to pick one course or all courses, with a title search. */
export const CourseSelectDrawer: FC<CourseSelectDrawerProps> = ({
  open,
  onClose,
  courses,
  selectedId,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const filtered = (courses.data ?? []).filter((course) =>
    course.title.toLowerCase().includes(needle),
  );
  const choose = (courseId: string): void => {
    onSelect(courseId);
    setSearch('');
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: DRAWER_WIDTH } }, 'aria-labelledby': TITLE_ID },
      }}
    >
      <CourseSelectHeader
        titleId={TITLE_ID}
        search={search}
        onSearchChange={setSearch}
        onClose={onClose}
      />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 3 }}>
        <QueryState
          isLoading={courses.isPending}
          error={courses.error}
          onRetry={() => void courses.refetch()}
        >
          <CourseSelectList
            courses={filtered}
            isSearching={needle !== ''}
            selectedId={selectedId}
            onChoose={choose}
          />
        </QueryState>
      </Box>
    </Drawer>
  );
};
