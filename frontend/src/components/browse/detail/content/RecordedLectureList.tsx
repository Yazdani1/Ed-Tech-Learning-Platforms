'use client';

import Box from '@mui/material/Box';

import { SectionAccordion } from './SectionAccordion';

import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface RecordedLectureListProps {
  sections: readonly CourseSection[];
  expanded: readonly string[];
  onToggle: (sectionId: string, open: boolean) => void;
  onPreview: (lecture: CourseLecture) => void;
}

/** The recorded course outline: one accordion per section with its lectures. */
export const RecordedLectureList: FC<RecordedLectureListProps> = ({
  sections,
  expanded,
  onToggle,
  onPreview,
}) => (
  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
    {sections.map((section, index) => (
      <SectionAccordion
        key={section._id}
        section={section}
        expanded={expanded.includes(section._id)}
        last={index === sections.length - 1}
        onToggle={(open) => {
          onToggle(section._id, open);
        }}
        onPreview={onPreview}
      />
    ))}
  </Box>
);
