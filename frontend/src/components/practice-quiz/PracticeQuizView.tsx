'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PracticeBankPane } from './layout/PracticeBankPane';
import { PracticeCoursePane } from './layout/PracticeCoursePane';
import { PracticeMobileBar, type PracticeDrawer } from './layout/PracticeMobileBar';
import { PracticeSidePane } from './layout/PracticeSidePane';
import { PracticeCourseBar } from './panel/PracticeCourseBar';
import { PracticePanel } from './panel/PracticePanel';
import { usePracticePage } from './usePracticePage';

const COURSE_PANE_WIDTH = 320;
const BANK_PANE_WIDTH = 300;

/**
 * /practice-quiz: courses with free-preview quizzes (left), the practice area (middle) and the course's quiz
 * banks (right). Phones and tablets open the two lists as drawers.
 */
export const PracticeQuizView = () => {
  const { t } = useTranslation();
  const wide = useMediaQuery(useTheme().breakpoints.up('lg'));
  const [drawer, setDrawer] = useState<PracticeDrawer>(null);
  const page = usePracticePage();
  const { selection } = page;
  const tree = selection.tree.data;
  const closeDrawer = () => {
    setDrawer(null);
  };
  const courses = <PracticeCoursePane page={page} onChosen={closeDrawer} />;
  const banks = <PracticeBankPane page={page} onChosen={closeDrawer} />;

  return (
    <Box sx={{ display: 'flex', flex: 1, minWidth: 0, minHeight: '70vh' }}>
      {wide && (
        <PracticeSidePane
          side="left"
          width={COURSE_PANE_WIDTH}
          expandLabel={t('quiz.practice.sidebar.expandCourses')}
          collapseLabel={t('quiz.practice.sidebar.collapseCourses')}
        >
          {courses}
        </PracticeSidePane>
      )}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!wide && (
          <PracticeMobileBar
            open={drawer}
            onOpenChange={setDrawer}
            courses={courses}
            banks={banks}
          />
        )}
        {tree && <PracticeCourseBar tree={tree} />}
        <PracticePanel
          courseId={selection.courseId}
          tree={tree}
          bank={selection.bank}
          bankMissing={selection.bankMissing}
          subsection={selection.subsection}
          page={selection.page}
          onPageChange={selection.setPage}
          practice={page.practice}
          onCheck={page.actions.check}
          onReset={page.resetBank}
        />
      </Box>
      {wide && (
        <PracticeSidePane
          side="right"
          width={BANK_PANE_WIDTH}
          expandLabel={t('quiz.practice.sidebar.expandBanks')}
          collapseLabel={t('quiz.practice.sidebar.collapseBanks')}
        >
          {banks}
        </PracticeSidePane>
      )}
    </Box>
  );
};
