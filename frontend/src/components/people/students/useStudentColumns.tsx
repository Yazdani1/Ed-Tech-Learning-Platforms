'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';
import { isSafeHttpUrl } from '@/utils/urls';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { StudentRow } from '@/schemas/students.schema';

const AVATAR_SIZE = 36;
const NO_VALUE = '–';

/** Avatar, name and email of a student row. */
const renderStudent = (row: StudentRow) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
    <Avatar
      src={row.avatar && isSafeHttpUrl(row.avatar) ? row.avatar : undefined}
      alt=""
      sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, fontSize: 14 }}
    >
      {row.name.charAt(0).toUpperCase()}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
        {row.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
        {row.email}
      </Typography>
    </Box>
  </Box>
);

/** Columns of the students list (the whole row opens the details panel). */
export const useStudentColumns = (): DataColumn<StudentRow>[] => {
  const { t, i18n } = useTranslation();
  return useMemo(
    () => [
      { key: 'student', header: t('people.students.student'), render: renderStudent },
      {
        key: 'number',
        header: t('people.students.studentNumber'),
        render: (row) => row.studentNumber ?? NO_VALUE,
      },
      {
        key: 'phone',
        header: t('people.students.phone'),
        render: (row) => row.phone ?? NO_VALUE,
      },
      {
        key: 'courses',
        header: t('people.students.courses'),
        align: 'right',
        render: (row) => row.enrolledCourses,
      },
      {
        key: 'spent',
        header: t('people.students.totalSpent'),
        align: 'right',
        render: (row) => formatBdt(row.totalSpent),
      },
      {
        key: 'joined',
        header: t('people.students.joined'),
        hideOnMobile: true,
        render: (row) => formatDate(row.createdAt, i18n.language),
      },
    ],
    [t, i18n.language],
  );
};
