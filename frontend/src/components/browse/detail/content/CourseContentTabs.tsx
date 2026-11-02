'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ContentViewButtons } from './ContentViewButtons';
import { LiveClassList } from './LiveClassList';
import { QuizSectionList } from './QuizSectionList';
import { RecordedLectureList } from './RecordedLectureList';
import { useContentSummary } from './useContentSummary';
import { useContentTabs } from './useContentTabs';

import type { CourseLecture, CourseSection, LiveClassWeek } from '@/schemas/browse.schema';
import type { PublicQuizSection } from '@/schemas/practice-quiz.schema';
import type { FC } from 'react';

interface CourseContentTabsProps {
  courseId: string;
  sections: readonly CourseSection[];
  weeks: readonly LiveClassWeek[];
  quizSections: readonly PublicQuizSection[];
  onPreview: (lecture: CourseLecture) => void;
}

const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 2,
  flexWrap: 'wrap',
  gap: 1,
} as const;

/** "Curriculum": live-class weeks, recorded lectures and free quizzes, one button per list that has content. */
export const CourseContentTabs: FC<CourseContentTabsProps> = ({
  courseId,
  sections,
  weeks,
  quizSections,
  onPreview,
}) => {
  const { t } = useTranslation();
  const available = {
    recorded: sections.length > 0,
    live: weeks.length > 0,
    quizzes: quizSections.length > 0,
  };
  const tabs = useContentTabs(
    available,
    sections.map((s) => s._id),
    weeks.map((w) => w._id),
  );
  const summary = useContentSummary(tabs.view, sections, weeks, quizSections);
  if (tabs.views.length === 0) return null;
  const unit = tabs.view === 'recorded' ? 'Sections' : 'Weeks';

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 2 }}>
        {t('browse.content.title')}
      </Typography>
      <ContentViewButtons views={tabs.views} view={tabs.view} onChange={tabs.setView} />
      <Box sx={HEADER_SX}>
        <Typography variant="body2" color="text.secondary">
          {summary}
        </Typography>
        {tabs.view !== 'quizzes' && (
          <Button size="small" onClick={tabs.toggleAll} sx={{ fontWeight: 600, minHeight: 44 }}>
            {t(`browse.content.${tabs.allOpen ? 'collapse' : 'expand'}${unit}`)}
          </Button>
        )}
      </Box>
      {tabs.view === 'recorded' && (
        <RecordedLectureList
          sections={sections}
          expanded={tabs.openSections}
          onToggle={tabs.toggleSection}
          onPreview={onPreview}
        />
      )}
      {tabs.view === 'live' && (
        <LiveClassList weeks={weeks} expanded={tabs.openWeeks} onToggle={tabs.toggleWeek} />
      )}
      {tabs.view === 'quizzes' && <QuizSectionList courseId={courseId} sections={quizSections} />}
    </Box>
  );
};
