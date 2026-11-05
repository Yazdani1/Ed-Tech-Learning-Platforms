'use client';

import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { useSiteSettings } from '@/api/site-settings.api';

import { BuyBarPrice } from './BuyBarPrice';
import { ENROLL_ATTENTION_SX } from './enroll-attention';
import { EnrollNowButton } from './EnrollNowButton';
import { useCanEnroll } from './useCanEnroll';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseBuyBarProps {
  course: Course;
  /** Id of the enrolment card (see EnrollNowButton) */
  targetId: string;
}

/** Space kept free under the page while the bar shows, so it never covers the footer */
const BAR_SPACE_PX = 96;

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
  ...ENROLL_ATTENTION_SX,
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
 * discount, and Enroll Now. Shown to visitors and to students who have not enrolled yet.
 */
export const CourseBuyBar: FC<CourseBuyBarProps> = ({ course, targetId }) => {
  const { t } = useTranslation();
  const canEnroll = useCanEnroll(course._id);
  const phone = useSiteSettings().data?.contact.phone;

  if (!canEnroll) return null;

  return (
    <>
      <GlobalStyles styles={{ body: { paddingBottom: BAR_SPACE_PX } }} />
      <Paper
        component="aside"
        aria-label={t('browse.buyBar.label')}
        elevation={8}
        square
        sx={BAR_SX}
      >
        <Container
          maxWidth="lg"
          sx={{ py: { xs: 1, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: 2 }}
        >
          <BuyBarPrice course={course} phone={phone} />
          <EnrollNowButton course={course} targetId={targetId} sx={BUTTON_SX} />
        </Container>
      </Paper>
    </>
  );
};
