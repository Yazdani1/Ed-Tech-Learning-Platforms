'use client';

import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClassIcon from '@mui/icons-material/Class';
import DevicesIcon from '@mui/icons-material/Devices';
import EventIcon from '@mui/icons-material/Event';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import type { IconTextItem } from '../IconTextList';
import type { Course } from '@/schemas/browse.schema';

const ICON_SX = { fontSize: 16 } as const;

/**
 * Highlight lines of the enrolment card: lectures, lifetime access, devices, certificate, and (with
 * `withSchedule`) the course type and start / end dates.
 */
export const useCourseHighlights = (
  course: Course,
  lectureCount: number,
  withSchedule: boolean,
): IconTextItem[] => {
  const { t, i18n } = useTranslation();
  const items: IconTextItem[] = [
    {
      icon: <OndemandVideoIcon sx={ICON_SX} />,
      text: t('browse.enroll.videoLectures', { count: lectureCount }),
    },
    { icon: <AllInclusiveIcon sx={ICON_SX} />, text: t('browse.enroll.lifetime') },
    { icon: <DevicesIcon sx={ICON_SX} />, text: t('browse.enroll.anyDevice') },
    { icon: <WorkspacePremiumIcon sx={ICON_SX} />, text: t('browse.enroll.certificate') },
  ];
  if (!withSchedule) return items;
  if (course.courseType) {
    items.push({
      icon: <ClassIcon sx={ICON_SX} />,
      text: t('browse.enroll.typeLabel', { name: course.courseType.name }),
    });
  }
  if (course.startDate) {
    items.push({
      icon: <CalendarTodayIcon sx={ICON_SX} />,
      text: t('browse.enroll.starts', { date: formatDate(course.startDate, i18n.language) }),
    });
  }
  if (course.endDate) {
    items.push({
      icon: <EventIcon sx={ICON_SX} />,
      text: t('browse.enroll.ends', { date: formatDate(course.endDate, i18n.language) }),
    });
  }
  return items;
};
