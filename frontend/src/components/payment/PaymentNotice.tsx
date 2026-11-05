'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PaymentNoticeProps {
  course: Course;
  /** Nothing to pay: the course is free, or the student is already enrolled */
  kind: 'free' | 'enrolled';
}

/** Shown instead of the payment details when there is nothing to pay, with the way on. */
export const PaymentNotice: FC<PaymentNoticeProps> = ({ course, kind }) => {
  const { t } = useTranslation();
  const enrolled = kind === 'enrolled';
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Alert
        severity={enrolled ? 'success' : 'info'}
        action={
          <Button
            component={Link}
            href={enrolled ? `/student/courses/${course._id}/learn` : `/courses/${course._id}`}
            color="inherit"
            size="small"
            sx={{ minHeight: 44 }}
          >
            {enrolled ? t('browse.enroll.goToCourse') : t('payment.viewCourse')}
          </Button>
        }
      >
        {enrolled
          ? t('payment.alreadyEnrolled', { title: course.title })
          : t('payment.freeCourse', { title: course.title })}
      </Alert>
    </Container>
  );
};
