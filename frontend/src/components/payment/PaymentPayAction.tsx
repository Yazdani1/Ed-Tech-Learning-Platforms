'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { paymentHref } from '@/components/browse/detail/enrollment/EnrollNowButton';
import { useEnrollAction } from '@/components/browse/detail/enrollment/useEnrollAction';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_ROLES } from '@/utils/roles';

import { PaymentPromises } from './PaymentPromises';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PaymentPayActionProps {
  course: Course;
}

const PAY_SX = {
  minHeight: 54,
  fontWeight: 700,
  fontSize: '1.1rem',
  borderRadius: '10px',
  bgcolor: '#f59e0b',
  color: '#111827',
  '&:hover': { bgcolor: '#d97706' },
} as const;

/**
 * The pay button: a student enrols through the existing enrolment (there is no payment gateway yet, see
 * CLAUDE.md, so no money is taken here), a visitor signs in first and comes back here; staff and teachers
 * cannot buy.
 */
export const PaymentPayAction: FC<PaymentPayActionProps> = ({ course }) => {
  const { t } = useTranslation();
  const { user, hasRole, isLoading } = useAuth();
  const { enroll, enrolling } = useEnrollAction(course);
  const isStudent = hasRole(STUDENT_ROLES);

  if (!isLoading && user === null) {
    return (
      <>
        <Button
          component={Link}
          href={`/auth/login?next=${encodeURIComponent(paymentHref(course._id))}`}
          fullWidth
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={PAY_SX}
        >
          {t('payment.signInToPay')}
        </Button>
        <PaymentPromises />
      </>
    );
  }
  return (
    <>
      <Button
        fullWidth
        variant="contained"
        disabled={isLoading || !isStudent || enrolling}
        onClick={() => {
          enroll(false);
        }}
        endIcon={enrolling ? undefined : <ArrowForwardIcon />}
        sx={PAY_SX}
      >
        {enrolling ? (
          <CircularProgress size={22} color="inherit" aria-label={t('common.loading')} />
        ) : (
          t('payment.pay')
        )}
      </Button>
      {user !== null && !isStudent && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          {t('payment.studentsOnly')}
        </Typography>
      )}
      <PaymentPromises />
    </>
  );
};
