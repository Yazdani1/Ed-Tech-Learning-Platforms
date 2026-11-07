'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';
import { formatDuration } from '@/utils/duration';
import { formatBdt } from '@/utils/price';
import { isSafeHttpUrl } from '@/utils/urls';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { StudentRow } from '@/schemas/students.schema';
import type { TFunction } from 'i18next';

const AVATAR_SIZE = 36;
const NO_VALUE = '–';

/** Avatar and name of a student row. */
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
    </Box>
  </Box>
);

const timeSpentColumn = (t: TFunction): DataColumn<StudentRow> => ({
  key: 'timeSpent',
  header: t('people.students.timeSpent'),
  align: 'right',
  render: (row) => formatDuration(t, row.timeSpentSeconds),
});

const statusColumn = (t: TFunction): DataColumn<StudentRow> => ({
  key: 'status',
  header: t('people.students.status'),
  hideOnMobile: true,
  render: (row) => (
    <Chip
      size="small"
      variant="outlined"
      color={row.isBlocked ? 'error' : 'success'}
      label={t(row.isBlocked ? 'people.accountStatus.blocked' : 'people.accountStatus.active')}
    />
  ),
});

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
        key: 'email',
        header: t('people.students.email'),
        render: (row) => (
          <Box component="span" sx={{ overflowWrap: 'anywhere' }}>
            {row.email}
          </Box>
        ),
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
      timeSpentColumn(t),
      statusColumn(t),
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
