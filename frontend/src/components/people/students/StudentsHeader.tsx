'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useStudentCourses } from '@/api/students.api';
import { PageHeader } from '@/components/common/PageHeader';
import { courseSelectionLabel } from '@/components/course-picker/course-picker.utils';

import { StudentCoursePicker } from './StudentCoursePicker';
import { StudentsToolbar } from './StudentsToolbar';

import type { StudentParams } from './useStudentParams';
import type { FC } from 'react';

interface StudentsHeaderProps {
  params: StudentParams;
  setParams: (changes: Partial<Record<keyof StudentParams, string | number>>) => void;
  courseIds: string[];
  activeFilters: number;
  /** How many students the filters match */
  total: number | undefined;
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
}

/** Title with the student count, the toolbar (search, filters, export) and the course list it opens. */
export const StudentsHeader: FC<StudentsHeaderProps> = ({
  params,
  setParams,
  courseIds,
  total,
  ...rest
}) => {
  const { t } = useTranslation();
  const courses = useStudentCourses();
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <>
      <PageHeader
        title={t('people.students.title')}
        count={total}
        countLabel={t('people.students.count', { count: total ?? 0 })}
      />
      <StudentsToolbar
        {...rest}
        params={params}
        onChange={setParams}
        courseLabel={courseSelectionLabel(t, courseIds, courses.data)}
        courseCount={courseIds.length}
        onChooseCourses={() => {
          setPickerOpen(true);
        }}
      />
      <StudentCoursePicker
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
        }}
        courses={courses}
        selectedIds={courseIds}
        onApply={(ids) => {
          setParams({ courses: ids.join(',') });
          setPickerOpen(false);
        }}
      />
    </>
  );
};
