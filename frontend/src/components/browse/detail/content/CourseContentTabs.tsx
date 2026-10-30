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

import type {
  CourseLecture,
  CourseSection,
  LiveClassWeek,
  PublicQuizSection,
} from '@/schemas/browse.schema';
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

/** "Course content":recorded lectures, live-class weeks and free quizzes, switched by buttons. */
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
  if (!available.recorded && !available.live) return null;
  const unit = tabs.view === 'recorded' ? 'Sections' : 'Weeks';

  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Box sx={HEADER_SX}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {t('browse.content.title')}
        </Typography>
        {tabs.view !== 'quizzes' && (
          <Button size="small" onClick={tabs.toggleAll} sx={{ fontWeight: 600, minHeight: 44 }}>
            {t(`browse.content.${tabs.allOpen ? 'collapse' : 'expand'}${unit}`)}
          </Button>
        )}
      </Box>
      {tabs.showSwitch && <ContentViewButtons view={tabs.view} onChange={tabs.setView} />}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {summary}
      </Typography>
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
