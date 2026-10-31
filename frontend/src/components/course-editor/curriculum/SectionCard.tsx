'use client';

import { Draggable } from '@hello-pangea/dnd';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from './SectionHeader';
import { SectionLectures } from './SectionLectures';

import type { FC } from 'react';
import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';

interface SectionCardProps {
  section: CourseSection;
  index: number;
  onRename: (section: CourseSection) => void;
  onDelete: (section: CourseSection) => void;
  /** Opens the lecture form: no lecture = add one to this section */
  onLectureForm: (section: CourseSection, lecture?: CourseLecture) => void;
  onDeleteLecture: (section: CourseSection, lecture: CourseLecture) => void;
}

/** A section: header, its lectures (sortable inside the section) and "Add Lecture". */
export const SectionCard: FC<SectionCardProps> = ({ section, index, ...handlers }) => {
  const { t } = useTranslation();
  const { onRename, onDelete, onLectureForm, onDeleteLecture } = handlers;

  return (
    <Draggable draggableId={section._id} index={index}>
      {(provided, snapshot) => (
        <Card
          component="li"
          ref={provided.innerRef}
          {...provided.draggableProps}
          variant="outlined"
          aria-label={section.title}
          sx={{
            mb: 2,
            borderRadius: 2,
            borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
          }}
        >
          <SectionHeader
            title={section.title}
            handleProps={provided.dragHandleProps}
            onRename={() => {
              onRename(section);
            }}
            onDelete={() => {
              onDelete(section);
            }}
          />
          <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
            <SectionLectures
              section={section}
              onEdit={(item) => {
                onLectureForm(section, item);
              }}
              onDelete={(item) => {
                onDeleteLecture(section, item);
              }}
            />
            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                onLectureForm(section);
              }}
              sx={{ minHeight: 44 }}
            >
              {t('catalog.curriculum.addLecture')}
            </Button>
          </Box>
        </Card>
      )}
    </Draggable>
  );
};
