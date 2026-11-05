'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { getCoursePriceInfo } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { SxProps, Theme } from '@mui/material/styles';
import type { FC } from 'react';

interface EnrollNowButtonProps {
  course: Course;
  /** Id of the enrolment card, for courses that have choices to make there */
  targetId: string;
  sx: SxProps<Theme>;
}

/** The payment details page of a course. */
export const paymentHref = (courseId: string): string => `/courses/${courseId}/payment`;

/**
 * "Enroll Now" of the banner and the buy bar. A paid course goes to the payment details page; a free course or
 * one that is part of a subscription plan scrolls to the enrolment card, which has the buttons or the choices.
 */
export const EnrollNowButton: FC<EnrollNowButtonProps> = ({ course, targetId, sx }) => {
  const { t } = useTranslation();
  const label = t('browse.buyBar.enroll');
  if (!getCoursePriceInfo(course).isFree && !course.includedInSubscription) {
    return (
      <Button
        component={Link}
        href={paymentHref(course._id)}
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        sx={sx}
      >
        {label}
      </Button>
    );
  }
  const goToCard = (): void => {
    const card = document.getElementById(targetId);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.focus({ preventScroll: true });
  };
  return (
    <Button variant="contained" onClick={goToCard} endIcon={<ArrowForwardIcon />} sx={sx}>
      {label}
    </Button>
  );
};
