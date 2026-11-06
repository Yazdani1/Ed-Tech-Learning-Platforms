'use client';

import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CouponsTab } from '@/components/coupons/CouponsTab';

import { CurriculumBuilder } from './curriculum/CurriculumBuilder';
import { BasicInfoTab } from './details/BasicInfoTab';
import { LearningContentTab } from './details/LearningContentTab';
import { MediaTab } from './details/MediaTab';
import { PricingTab } from './details/PricingTab';
import { AudienceTab } from './extras/AudienceTab';
import { BenefitsTab } from './extras/BenefitsTab';
import { FaqTab } from './extras/FaqTab';
import { ProjectsTab } from './extras/ProjectsTab';
import { SuccessStoriesTab } from './extras/SuccessStoriesTab';
import { ToolsTab } from './extras/ToolsTab';
import { SAVED_COURSE_TABS, type EditorTab } from './editor-tabs';
import { LiveClassTab } from './live-class/LiveClassTab';
import { QuizBankTab } from './quiz-bank/QuizBankTab';
import { SettingsTab } from './settings/SettingsTab';

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
      return <BasicInfoTab form={details.form} isNew={course === undefined} />;
    case 'pricing':
      return <PricingTab form={details.form} />;
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
    case 'tools':
      return course ? <ToolsTab course={course} /> : null;
    case 'benefits':
      return course ? <BenefitsTab course={course} /> : null;
    case 'projects':
      return course ? <ProjectsTab course={course} /> : null;
    case 'audience':
      return course ? <AudienceTab course={course} /> : null;
    case 'successStories':
      return course ? <SuccessStoriesTab course={course} /> : null;
    case 'faq':
      return course ? <FaqTab course={course} /> : null;
    case 'curriculum':
      return course ? <CurriculumBuilder course={course} /> : null;
    case 'liveClass':
      return course ? <LiveClassTab courseId={course._id} /> : null;
    case 'quizBank':
      return course ? <QuizBankTab courseId={course._id} /> : null;
    case 'coupons':
      return course ? <CouponsTab course={course} /> : null;
    case 'settings':
      return course ? <SettingsTab course={course} details={details} /> : null;
  }
};
