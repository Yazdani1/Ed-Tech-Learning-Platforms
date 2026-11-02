'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseThumb } from '@/components/course-picker/CourseThumb';
import { formatDate } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import type { StudentEnrollment } from '@/schemas/students.schema';
import type { FC } from 'react';

const COVER_WIDTH = 96;

interface StudentCourseListProps {
  enrollments: readonly StudentEnrollment[];
}

/** Every course the student is enrolled in: cover, title, how (paid / free / subscription), amount, date. */
export const StudentCourseList: FC<StudentCourseListProps> = ({ enrollments }) => {
  const { t, i18n } = useTranslation();
  if (enrollments.length === 0) {
    return <Typography color="text.secondary">{t('people.students.noCourses')}</Typography>;
  }
  return (
    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1 }}>
      {enrollments.map((enrollment) => (
        <Box
          component="li"
          key={enrollment._id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.25,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <CourseThumb coverImage={enrollment.course?.coverImage} width={COVER_WIDTH} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
              {enrollment.course?.title ?? t('people.students.deletedCourse')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('people.students.enrolledOn', {
                date: formatDate(enrollment.createdAt, i18n.language),
              })}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>{formatBdt(enrollment.amountPaid)}</Typography>
            <Chip
              size="small"
              variant="outlined"
              label={t(`insights.enrollmentType.${enrollment.enrollmentType}`)}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};
