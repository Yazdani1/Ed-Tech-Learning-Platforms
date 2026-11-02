'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { useEnrollmentCheck } from '@/api/browse.api';
import { useSiteSettings } from '@/api/site-settings.api';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_ROLES } from '@/utils/roles';

import { BuyBarPrice } from './BuyBarPrice';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseBuyBarProps {
  course: Course;
  /** Id of the enrolment card the button scrolls to */
  targetId: string;
}

/** Height kept free under the page so the bar never covers the footer */
export const BUY_BAR_SPACE = { xs: 12, sm: 11 } as const;

const BAR_SX = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 'appBar',
  borderTop: 1,
  borderColor: 'divider',
} as const;
const BUTTON_SX = {
  minHeight: 48,
  px: { xs: 2, sm: 4 },
  fontWeight: 800,
  flexShrink: 0,
  bgcolor: '#facc15',
  color: 'grey.900',
  '&:hover': { bgcolor: '#eab308' },
} as const;

/**
 * Bar fixed to the bottom of the course page: "Call Now" with the company phone, the price with the running
 * discount, and the button that takes the visitor to the ways to enrol (the enrolment card).
 * Shown to visitors and to students who have not enrolled yet.
 */
export const CourseBuyBar: FC<CourseBuyBarProps> = ({ course, targetId }) => {
  const { t } = useTranslation();
  const { user, hasRole, isLoading } = useAuth();
  const isStudent = hasRole(STUDENT_ROLES);
  const check = useEnrollmentCheck(course._id, isStudent);
  const phone = useSiteSettings().data?.contact.phone;

  // Only visitors and students who have not enrolled yet can enrol (staff and teachers cannot)
  if (isLoading || (user !== null && !isStudent) || check.data?.isEnrolled) return null;

  const goToEnrolment = (): void => {
    const card = document.getElementById(targetId);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.focus({ preventScroll: true });
  };

  return (
    <Paper component="aside" aria-label={t('browse.buyBar.label')} elevation={8} square sx={BAR_SX}>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 1, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <BuyBarPrice course={course} phone={phone} />
        <Button
          variant="contained"
          onClick={goToEnrolment}
          endIcon={<ChevronRightIcon />}
          sx={BUTTON_SX}
        >
          {t('browse.buyBar.enroll')}
        </Button>
      </Container>
    </Paper>
  );
};
