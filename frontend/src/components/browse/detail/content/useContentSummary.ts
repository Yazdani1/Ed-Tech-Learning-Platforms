'use client';

import { useTranslation } from 'react-i18next';

import type { ContentView } from './ContentViewButtons';
import type { CourseSection, LiveClassWeek, PublicQuizSection } from '@/schemas/browse.schema';

/** "3 sections - 12 lectures" style line for the shown content list. */
export const useContentSummary = (
  view: ContentView,
  sections: readonly CourseSection[],
  weeks: readonly LiveClassWeek[],
  quizSections: readonly PublicQuizSection[],
): string => {
  const { t } = useTranslation();
  if (view === 'recorded') {
    const lectures = sections.reduce((total, section) => total + section.lectures.length, 0);
    return t('browse.content.recordedSummary', { sections: sections.length, lectures });
  }
  if (view === 'live') {
    const classes = weeks.reduce((total, week) => total + week.lectures.length, 0);
    return t('browse.content.liveSummary', { weeks: weeks.length, classes });
  }
  const banks = quizSections.reduce((total, section) => total + section.banks.length, 0);
  return t('browse.content.quizSummary', { sections: quizSections.length, banks });
};
