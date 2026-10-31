'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import { useTranslation } from 'react-i18next';

import { useLiveClasses } from '@/api/browse.api';
import { useQuestions } from '@/api/learn-qa.api';
import { useContentList, useEnrollmentCount } from '@/api/learn.api';
import { countLectures, courseSections, splitDuration } from '@/components/browse/course-utils';

import { totalSeconds } from '../learn.utils';

import type { Course } from '@/schemas/browse.schema';
import type { ReactElement } from 'react';

export interface OverviewStatItem {
  key: string;
  icon: ReactElement;
  value: string;
}

const NO_VALUE = '—';

/** The numbers of the course overview (each content list is shared with its own tab's cache). */
export const useOverviewStats = (course: Course): OverviewStatItem[] => {
  const { t, i18n } = useTranslation();
  const courseId = course._id;
  const enrolled = useEnrollmentCount(courseId);
  const announcements = useContentList('announcements', courseId);
  const materials = useContentList('materials', courseId);
  const liveClasses = useLiveClasses(courseId);
  const questions = useQuestions(courseId);
  const number = (value: number | undefined): string =>
    value === undefined ? NO_VALUE : value.toLocaleString(i18n.language);
  const seconds = totalSeconds(course);

  return [
    { key: 'students', icon: <PeopleOutlinedIcon />, value: number(enrolled.data) },
    { key: 'lectures', icon: <OndemandVideoIcon />, value: number(countLectures(course)) },
    {
      key: 'duration',
      icon: <AccessTimeIcon />,
      value: seconds > 0 ? t('learn.overview.durationValue', splitDuration(seconds)) : NO_VALUE,
    },
    {
      key: 'sections',
      icon: <ViewListOutlinedIcon />,
      value: number(courseSections(course).length),
    },
    {
      key: 'announcements',
      icon: <CampaignOutlinedIcon />,
      value: number(announcements.data?.length),
    },
    { key: 'materials', icon: <MenuBookOutlinedIcon />, value: number(materials.data?.length) },
    { key: 'live', icon: <EventNoteOutlinedIcon />, value: number(liveClasses.data?.length) },
    {
      key: 'questions',
      icon: <QuestionAnswerOutlinedIcon />,
      value: number(questions.data?.length),
    },
    {
      key: 'teachers',
      icon: <PersonOutlinedIcon />,
      value: number(course.teachers.filter(Boolean).length),
    },
  ];
};
