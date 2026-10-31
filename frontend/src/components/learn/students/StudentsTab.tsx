'use client';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { studentsExportUrl, useCourseStudents } from '@/api/enrollment.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useCourseStudentColumns } from '@/components/enrollments/useCourseStudentColumns';

import { useLearnPermissions } from '../useLearnPermissions';

import type { FC } from 'react';

interface StudentsTabProps {
  courseId: string;
  courseTitle: string;
}

const PAGE_SIZE = 15;

/** Who is enrolled (staff and the course's teachers; emails and the CSV export are for staff admins). */
export const StudentsTab: FC<StudentsTabProps> = ({ courseId, courseTitle }) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  const students = useCourseStudents(courseId, permissions.canSeeStudents);
  const columns = useCourseStudentColumns(permissions.isStaffAdmin);
  const [page, setPage] = useState(1);
  const rows = students.data ?? [];

  return (
    <Box
      component="section"
      aria-label={t('learn.nav.students')}
      sx={{ p: { xs: 2, md: 4 }, maxWidth: 980 }}
    >
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, mb: 3 }}
      >
        <Box>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
            {t('learn.students.title', { count: rows.length })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('learn.students.subtitle')}
          </Typography>
        </Box>
        {permissions.canExportStudents && rows.length > 0 && (
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            component="a"
            href={studentsExportUrl(courseId)}
            download={`${courseTitle}-students.csv`}
            sx={{ minHeight: 44, alignSelf: 'flex-start' }}
          >
            {t('learn.students.export')}
          </Button>
        )}
      </Box>
      <ResponsiveDataView
        isLoading={students.isPending}
        error={students.error}
        onRetry={() => void students.refetch()}
        emptyText={t('learn.students.empty')}
        rows={rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
        columns={columns}
        getRowId={(row) => row._id}
        label={t('learn.students.label')}
        pagination={{ page, limit: PAGE_SIZE, total: rows.length, onPageChange: setPage }}
      />
    </Box>
  );
};
