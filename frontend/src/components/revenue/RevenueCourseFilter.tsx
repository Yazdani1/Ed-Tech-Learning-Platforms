'use client';

import FilterListIcon from '@mui/icons-material/FilterList';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState } from 'react';

import { RevenueCoursePicker } from './RevenueCoursePicker';

import type { FC } from 'react';

interface RevenueCourseFilterProps {
  courseIds: readonly string[];
  /** "All courses", the course's title or "3 courses" */
  label: string;
  onApply: (ids: string[]) => void;
}

const LABEL_SX = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

/** The "All courses" button and the course list it opens on the left. */
export const RevenueCourseFilter: FC<RevenueCourseFilterProps> = ({
  courseIds,
  label,
  onApply,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={courseIds.length > 0 ? 'contained' : 'outlined'}
        startIcon={<FilterListIcon />}
        onClick={() => {
          setOpen(true);
        }}
        sx={{ minHeight: 44, maxWidth: { xs: '100%', sm: 360 } }}
      >
        <Box component="span" sx={LABEL_SX}>
          {label}
        </Box>
      </Button>
      <RevenueCoursePicker
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        selectedIds={courseIds}
        onApply={(ids) => {
          onApply(ids);
          setOpen(false);
        }}
      />
    </>
  );
};
