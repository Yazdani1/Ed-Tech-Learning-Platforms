'use client';

import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { SectionCard } from './SectionCard';
import { SECTION_DROP_TYPE } from './useCurriculumActions';

import type { FC } from 'react';
import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';

interface SectionListProps {
  sections: CourseSection[];
  onDragEnd: (result: DropResult) => void;
  onRename: (section: CourseSection) => void;
  onDelete: (section: CourseSection) => void;
  onLectureForm: (section: CourseSection, lecture?: CourseLecture) => void;
  onDeleteLecture: (section: CourseSection, lecture: CourseLecture) => void;
}

const SECTIONS_DROP_ID = 'sections';

/** The sortable list of sections (each with its sortable lectures). */
export const SectionList: FC<SectionListProps> = ({ sections, onDragEnd, ...handlers }) => {
  const { t } = useTranslation();
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={SECTIONS_DROP_ID} type={SECTION_DROP_TYPE}>
        {(provided) => (
          <Box
            component="ul"
            ref={provided.innerRef}
            {...provided.droppableProps}
            aria-label={t('catalog.curriculum.title')}
            sx={{ listStyle: 'none', m: 0, p: 0 }}
          >
            {sections.map((section, index) => (
              <SectionCard key={section._id} section={section} index={index} {...handlers} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};
