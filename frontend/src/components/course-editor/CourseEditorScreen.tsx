'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseEditorHeader } from './CourseEditorHeader';
import { CourseEditorNav } from './CourseEditorNav';
import { CourseEditorPanel } from './CourseEditorPanel';
import { panelId, tabId, type EditorTab } from './editor-tabs';
import { useCourseDetailsForm } from './useCourseDetailsForm';

import type { FC } from 'react';
import type { Course } from '@/schemas/browse.schema';

interface CourseEditorScreenProps {
  /** The saved course; undefined on /admin/courses/create */
  course: Course | undefined;
}

const NAV_WIDTH = 280;

/** Header, editor menu and the selected tab, around one course details form. */
export const CourseEditorScreen: FC<CourseEditorScreenProps> = ({ course }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<EditorTab>('basic');
  const details = useCourseDetailsForm(course);
  const title = details.form.watch('title').trim();
  const heading = course ? title || t('catalog.editor.untitled') : t('catalog.editor.createTitle');

  return (
    <Box>
      <CourseEditorHeader
        course={course}
        title={heading}
        isSaving={details.isSaving}
        onSaveDraft={() => {
          details.save('Draft');
        }}
        onPublish={() => {
          details.save('Published');
        }}
      />
      <Box
        sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}
      >
        <Box sx={{ width: { xs: '100%', md: NAV_WIDTH }, flexShrink: 0, minWidth: 0 }}>
          <CourseEditorNav
            tab={tab}
            onChange={setTab}
            showSaveState={course !== undefined}
            isAutoSaving={details.isAutoSaving}
            lastSaved={details.lastSaved}
          />
        </Box>
        <Paper
          variant="outlined"
          role="tabpanel"
          id={panelId(tab)}
          aria-labelledby={tabId(tab)}
          sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3 }, borderRadius: 1 }}
        >
          <CourseEditorPanel tab={tab} course={course} details={details} />
        </Paper>
      </Box>
    </Box>
  );
};
