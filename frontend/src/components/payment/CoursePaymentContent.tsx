'use client';

import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEnrollmentCheck } from '@/api/browse.api';
import { useAuth } from '@/hooks/useAuth';
import { DISPLAY_FONT } from '@/theme/fonts';
import { getCoursePriceInfo } from '@/utils/price';
import { STUDENT_ROLES } from '@/utils/roles';

import { PaymentAssuranceBand } from './PaymentAssuranceBand';
import { PaymentMentorCard } from './PaymentMentorCard';
import { PaymentMethodCard } from './PaymentMethodCard';
import { DEFAULT_PAYMENT_METHOD, type PaymentMethodId } from './payment-methods';
import { PaymentNotice } from './PaymentNotice';
import { PaymentOrderSummary } from './PaymentOrderSummary';
import { PaymentSteps } from './PaymentSteps';
import { PaymentTrustCards } from './PaymentTrustCards';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CoursePaymentContentProps {
  course: Course;
}

const TITLE_SX = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 700,
  lineHeight: 1.15,
  fontSize: { xs: '2.25rem', md: '3rem' },
} as const;
const OFFICIAL_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 1.5,
  py: 0.75,
  borderRadius: '8px',
  bgcolor: '#eef1f5',
  color: '#475569',
} as const;

/**
 * The payment details page of a paid course: steps, title, payment methods on the left, the order summary on
 * the right (first the methods on phones too), then the trust cards and the assurance band.
 */
export const CoursePaymentContent: FC<CoursePaymentContentProps> = ({ course }) => {
  const { t } = useTranslation();
  const { hasRole, isLoading } = useAuth();
  const isStudent = hasRole(STUDENT_ROLES);
  const check = useEnrollmentCheck(course._id, isStudent);
  const [method, setMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD);

  if (isLoading || (isStudent && check.isPending)) {
    return <Skeleton variant="rounded" height={480} sx={{ m: 3 }} aria-busy="true" />;
  }
  if (getCoursePriceInfo(course).isFree) return <PaymentNotice course={course} kind="free" />;
  if (isStudent && check.data?.isEnrolled) return <PaymentNotice course={course} kind="enrolled" />;

  return (
    <>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: { xs: 4, md: 5 } }}>
        <PaymentSteps courseId={course._id} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography component="h1" sx={TITLE_SX}>
              {t('payment.title')}
            </Typography>
            <Typography sx={{ color: '#475569', mt: 0.5 }}>{t('payment.subtitle')}</Typography>
          </Box>
          <Box sx={OFFICIAL_SX}>
            <VerifiedOutlinedIcon sx={{ fontSize: 18, color: '#1d4ed8' }} aria-hidden />
            <Typography variant="body2">{t('payment.official')}</Typography>
          </Box>
        </Box>
        <Grid container spacing={3} sx={{ alignItems: 'flex-start', mb: 3 }}>
          <Grid size={{ xs: 12, md: 7 }} sx={{ minWidth: 0 }}>
            <PaymentMethodCard method={method} onChange={setMethod} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ minWidth: 0 }}>
            <PaymentOrderSummary course={course} />
            <PaymentMentorCard teachers={course.teachers} />
          </Grid>
        </Grid>
        <PaymentTrustCards />
      </Container>
      <PaymentAssuranceBand />
    </>
  );
};
