'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useModal } from '@/hooks/useModal';

import { CurriculumModals, type LectureTarget } from './CurriculumModals';
import { SectionList } from './SectionList';
import { useCurriculumActions } from './useCurriculumActions';

import type { FC } from 'react';
import type { Course, CourseSection } from '@/schemas/browse.schema';

interface CurriculumBuilderProps {
  course: Course;
}

/** Sections and lectures of a course: add, rename, delete, and drag to reorder. */
export const CurriculumBuilder: FC<CurriculumBuilderProps> = ({ course }) => {
  const { t } = useTranslation();
  const sections = course.sections.filter((section): section is CourseSection => section !== null);
  const actions = useCurriculumActions(course._id, sections);
  const sectionModal = useModal<CourseSection>();
  const lectureModal = useModal<LectureTarget>();

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {t('catalog.curriculum.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('catalog.curriculum.subtitle')}
      </Typography>
      {sections.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 3 }}>
          {t('catalog.curriculum.empty')}
        </Typography>
      )}
      <SectionList
        sections={sections}
        onDragEnd={actions.onDragEnd}
        onRename={sectionModal.openModal}
        onDelete={actions.deleteSection}
        onLectureForm={(section, lecture) => {
          lectureModal.openModal({ sectionId: section._id, lecture });
        }}
        onDeleteLecture={(section, lecture) => {
          actions.deleteLecture(section._id, lecture);
        }}
      />
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => {
          sectionModal.openModal();
        }}
        sx={{ minHeight: 44 }}
      >
        {t('catalog.curriculum.addSection')}
      </Button>
      <CurriculumModals actions={actions} sectionModal={sectionModal} lectureModal={lectureModal} />
    </Box>
  );
};
