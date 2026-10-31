'use client';

import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CurriculumBuilder } from './curriculum/CurriculumBuilder';
import { BasicInfoTab } from './details/BasicInfoTab';
import { LearningContentTab } from './details/LearningContentTab';
import { MediaTab } from './details/MediaTab';
import { SAVED_COURSE_TABS, type EditorTab } from './editor-tabs';
import { LiveClassTab } from './live-class/LiveClassTab';
import { QuizBankTab } from './quiz-bank/QuizBankTab';

import type { CourseDetailsEditor } from './useCourseDetailsForm';
import type { FC } from 'react';
import type { Course } from '@/schemas/browse.schema';

interface CourseEditorPanelProps {
  tab: EditorTab;
  course: Course | undefined;
  details: CourseDetailsEditor;
}

/** The content of the selected editor tab. */
export const CourseEditorPanel: FC<CourseEditorPanelProps> = ({ tab, course, details }) => {
  const { t } = useTranslation();
  if (!course && SAVED_COURSE_TABS.includes(tab)) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
        {t('catalog.editor.saveFirst')}
      </Typography>
    );
  }
  switch (tab) {
    case 'basic':
      return <BasicInfoTab form={details.form} />;
    case 'media':
      return (
        <MediaTab
          cover={details.cover}
          savedCover={course?.coverImage}
          onPick={details.pickCover}
          autoUploads={course !== undefined}
        />
      );
    case 'content':
      return <LearningContentTab control={details.form.control} />;
    case 'curriculum':
      return course ? <CurriculumBuilder course={course} /> : null;
    case 'liveClass':
      return course ? <LiveClassTab courseId={course._id} /> : null;
    case 'quizBank':
      return course ? <QuizBankTab courseId={course._id} /> : null;
  }
};
