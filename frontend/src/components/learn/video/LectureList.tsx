'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { countLectures, courseSections } from '@/components/browse/course-utils';

import { LectureSection } from './LectureSection';

import type { Course, CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LectureListProps {
  course: Course;
  activeLecture: CourseLecture | null;
  onSelect: (lectureId: string) => void;
}

/** "Course Content": sections as accordions, each with its lectures (first section open). */
export const LectureList: FC<LectureListProps> = ({ course, activeLecture, onSelect }) => {
  const { t } = useTranslation();
  const sections = courseSections(course);
  return (
    <Box component="section" aria-label={t('learn.video.content')} sx={{ bgcolor: 'grey.50' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t('learn.video.content')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('learn.video.contentSummary', {
            sections: sections.length,
            lectures: countLectures(course),
          })}
        </Typography>
      </Box>
      {sections.map((section, index) => (
        <LectureSection
          key={section._id}
          section={section}
          defaultExpanded={index === 0}
          activeLectureId={activeLecture?._id}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
};
