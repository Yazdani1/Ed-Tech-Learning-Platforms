'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ResponsiveDataView, type DataColumn } from '@/components/common/ResponsiveDataView';
import { formatDateTime } from '@/utils/dateTime';

import type { RecentEnrollment } from '@/schemas/insights.schema';
import type { TFunction } from 'i18next';
import type { FC } from 'react';

const NO_VALUE = '–';

const buildColumns = (t: TFunction): DataColumn<RecentEnrollment>[] => [
  {
    key: 'student',
    header: t('insights.dashboard.student'),
    render: (row) => row.student?.name ?? NO_VALUE,
  },
  {
    key: 'course',
    header: t('insights.dashboard.course'),
    render: (row) => row.course?.title ?? NO_VALUE,
  },
  {
    key: 'type',
    header: t('insights.dashboard.type'),
    render: (row) => (
      <Chip size="small" label={t(`insights.enrollmentType.${row.enrollmentType}`)} />
    ),
  },
  {
    key: 'date',
    header: t('insights.dashboard.date'),
    render: (row) => formatDateTime(row.createdAt),
  },
];

interface RecentEnrollmentsCardProps {
  enrollments: RecentEnrollment[];
}

/** The six newest enrolments (table on desktop, cards on phones). */
export const RecentEnrollmentsCard: FC<RecentEnrollmentsCardProps> = ({ enrollments }) => {
  const { t } = useTranslation();
  const columns = useMemo(() => buildColumns(t), [t]);
  return (
    <Paper component="section" variant="outlined" sx={{ minWidth: 0 }}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800, p: 2.5 }}>
        {t('insights.dashboard.recentEnrollments')}
      </Typography>
      <Box sx={{ px: { xs: 1.5, md: 0 }, pb: { xs: 1.5, md: 0 } }}>
        <ResponsiveDataView
          rows={enrollments}
          columns={columns}
          getRowId={(row) => row._id}
          label={t('insights.dashboard.recentEnrollments')}
          isLoading={false}
          error={null}
          emptyText={t('insights.dashboard.noEnrollments')}
        />
      </Box>
    </Paper>
  );
};
