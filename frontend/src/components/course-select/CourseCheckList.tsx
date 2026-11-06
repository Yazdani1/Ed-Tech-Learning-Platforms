'use client';

import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseCheckRow } from './CourseCheckRow';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { ApiError } from '@/services/http.service';
import type { FC, ReactNode } from 'react';

interface CourseCheckListProps {
  rows: readonly AdminCourse[];
  isPending: boolean;
  error: ApiError | null;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

const LIST_HEIGHT = 360;
const SKELETON_ROWS = 4;

/** The scrolling list of courses (loading rows, error, "no course", or a row per course). */
export const CourseCheckList: FC<CourseCheckListProps> = ({
  rows,
  isPending,
  error,
  selected,
  onToggle,
}) => {
  const { t } = useTranslation();
  let content: ReactNode;
  if (isPending) {
    content = Array.from({ length: SKELETON_ROWS }, (_, index) => (
      <Skeleton key={index} variant="rectangular" height={56} sx={{ m: 1, borderRadius: 1 }} />
    ));
  } else if (error) {
    content = (
      <Typography color="error" sx={{ p: 2 }}>
        {error.message}
      </Typography>
    );
  } else if (rows.length === 0) {
    content = (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        {t('promos.courses.empty')}
      </Typography>
    );
  } else {
    content = (
      <List dense disablePadding aria-label={t('promos.courses.label')}>
        {rows.map((course) => (
          <CourseCheckRow
            key={course._id}
            course={course}
            checked={selected.has(course._id)}
            onToggle={onToggle}
          />
        ))}
      </List>
    );
  }
  return (
    <Paper variant="outlined" sx={{ maxHeight: LIST_HEIGHT, overflowY: 'auto' }}>
      {content}
    </Paper>
  );
};
