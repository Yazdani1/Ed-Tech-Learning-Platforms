'use client';

import { Droppable } from '@hello-pangea/dnd';
import Box from '@mui/material/Box';

import { LectureRow } from './LectureRow';
import { LECTURE_DROP_TYPE } from './useCurriculumActions';

import type { FC } from 'react';
import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';

interface SectionLecturesProps {
  section: CourseSection;
  onEdit: (lecture: CourseLecture) => void;
  onDelete: (lecture: CourseLecture) => void;
}

/** The lectures of one section, sortable inside that section. */
export const SectionLectures: FC<SectionLecturesProps> = ({ section, onEdit, onDelete }) => (
  <Droppable droppableId={section._id} type={LECTURE_DROP_TYPE}>
    {(drop) => (
      <Box
        component="ul"
        ref={drop.innerRef}
        {...drop.droppableProps}
        sx={{ listStyle: 'none', m: 0, p: 0, minHeight: 8 }}
      >
        {section.lectures.map((lecture, index) => (
          <LectureRow
            key={lecture._id}
            lecture={lecture}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {drop.placeholder}
      </Box>
    )}
  </Droppable>
);
