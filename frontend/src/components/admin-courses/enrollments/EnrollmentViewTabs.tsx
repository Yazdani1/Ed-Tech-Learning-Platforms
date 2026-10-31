'use client';

import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

export type EnrollmentView = 'students' | 'revenue';

interface EnrollmentViewTabsProps {
  view: EnrollmentView;
  onChange: (view: EnrollmentView) => void;
}

/** Students / Revenue switch of the enrolments page (the old page's side menu). */
export const EnrollmentViewTabs: FC<EnrollmentViewTabsProps> = ({ view, onChange }) => {
  const { t } = useTranslation();
  return (
    <Tabs
      value={view}
      onChange={(_event, value: EnrollmentView) => {
        onChange(value);
      }}
      aria-label={t('adminCourses.enrollments.views')}
      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab
        value="students"
        icon={<PeopleAltOutlinedIcon fontSize="small" />}
        iconPosition="start"
        label={t('adminCourses.enrollments.students')}
        sx={{ minHeight: 48 }}
      />
      <Tab
        value="revenue"
        icon={<MonetizationOnOutlinedIcon fontSize="small" />}
        iconPosition="start"
        label={t('adminCourses.enrollments.revenue')}
        sx={{ minHeight: 48 }}
      />
    </Tabs>
  );
};
