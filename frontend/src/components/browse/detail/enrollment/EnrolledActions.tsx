'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { IconTextList, type IconTextItem } from '../IconTextList';

import type { FC } from 'react';

interface EnrolledActionsProps {
  courseId: string;
  enrolledAt: string | null | undefined;
  highlights: readonly IconTextItem[];
}

/** An enrolled student: "Go to this course" (the course player) and the enrolment date (an enrolment is never removed). */
export const EnrolledActions: FC<EnrolledActionsProps> = ({ courseId, enrolledAt, highlights }) => {
  const { t, i18n } = useTranslation();
  return (
    <>
      <Button
        component={Link}
        href={`/student/courses/${courseId}/learn`}
        fullWidth
        variant="contained"
        size="large"
        color="success"
        startIcon={<SchoolIcon />}
        sx={{ fontWeight: 700, borderRadius: 2 }}
      >
        {t('browse.enroll.goToCourse')}
      </Button>
      {enrolledAt && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('browse.enroll.enrolledOn', { date: formatDateTime(enrolledAt, i18n.language) })}
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>
        <IconTextList items={highlights} />
      </Box>
    </>
  );
};
