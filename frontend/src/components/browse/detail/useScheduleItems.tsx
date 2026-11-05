'use client';

import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { useTranslation } from 'react-i18next';

import { formatDate, formatPlainDate, formatPlainTime } from '@/utils/dateTime';

import { nextLiveClass } from '../course-utils';

import type { Course, LiveClassWeek } from '@/schemas/browse.schema';
import type { ReactNode } from 'react';

export interface ScheduleItem {
  label: string;
  value: string;
  icon: ReactNode;
  /** Gradient of the card's border */
  border: string;
}

const ICON_SIZE = 20;

/** The dates shown beside the enrolment card: start, next live class, end (each only when it exists). */
export const useScheduleItems = (
  course: Course,
  weeks: readonly LiveClassWeek[],
): ScheduleItem[] => {
  const { t, i18n } = useTranslation();
  const liveClass = nextLiveClass(weeks);
  const items: ScheduleItem[] = [];
  if (course.startDate) {
    items.push({
      label: t('browse.detail.startDate'),
      value: formatDate(course.startDate, i18n.language),
      icon: <EventAvailableIcon sx={{ fontSize: ICON_SIZE, color: '#0d9488' }} aria-hidden />,
      border: 'linear-gradient(135deg, #14b8a6, #2563eb)',
    });
  }
  if (liveClass) {
    const day = formatPlainDate(liveClass.day, i18n.language);
    items.push({
      label: t('browse.detail.liveClassTime'),
      value: `${day} • ${formatPlainTime(liveClass.time, i18n.language)}`,
      icon: <VideocamOutlinedIcon sx={{ fontSize: ICON_SIZE, color: '#2563eb' }} aria-hidden />,
      border: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    });
  }
  if (course.endDate) {
    items.push({
      label: t('browse.detail.endDate'),
      value: formatDate(course.endDate, i18n.language),
      icon: <EventBusyIcon sx={{ fontSize: ICON_SIZE, color: '#d97706' }} aria-hidden />,
      border: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    });
  }
  return items;
};
