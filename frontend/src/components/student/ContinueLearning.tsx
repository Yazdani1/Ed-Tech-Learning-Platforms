'use client';

import ArrowForward from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { learnPath } from './enrolledCourse.utils';

import type { EnrolledCourse } from '@/schemas/catalog.schema';
import type { ApiError } from '@/services/http.service';
import type { FC } from 'react';

const RECENT_COUNT = 4;
const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  flexWrap: 'wrap',
  mb: 1,
} as const;

interface ContinueLearningProps {
  courses: EnrolledCourse[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
}

/** The newest enrolments, each opening the course player, plus a link to every course. */
export const ContinueLearning: FC<ContinueLearningProps> = ({
  courses,
  isLoading,
  error,
  onRetry,
}) => {
  const { t } = useTranslation();
  const recent = (courses ?? []).slice(0, RECENT_COUNT);
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Box sx={HEADER_SX}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t('student.continueTitle')}
        </Typography>
        <Button component={Link} href="/student/courses" endIcon={<ArrowForward />}>
          {t('student.viewAllCourses')}
        </Button>
      </Box>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isEmpty={recent.length === 0}
        emptyText={t('student.noEnrollments')}
        emptyAction={
          <Button component={Link} href="/courses" variant="contained">
            {t('student.browseCourses')}
          </Button>
        }
        skeletonRows={3}
      >
        <List disablePadding>
          {recent.map((course) => (
            <ListItemButton
              key={course._id}
              component={Link}
              href={learnPath(course._id)}
              sx={{ borderRadius: 1, minHeight: 56 }}
            >
              <ListItemText
                primary={course.title}
                secondary={t(`student.enrollmentType.${course.enrollmentType}`)}
                slotProps={{ primary: { sx: { fontWeight: 700 } } }}
              />
              <ArrowForward fontSize="small" color="action" aria-hidden />
            </ListItemButton>
          ))}
        </List>
      </QueryState>
    </Paper>
  );
};
