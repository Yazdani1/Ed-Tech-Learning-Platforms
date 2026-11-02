'use client';

import Box from '@mui/material/Box';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useStudentCourses, useStudents } from '@/api/students.api';
import { PageHeader } from '@/components/common/PageHeader';
import { CoursePickerDrawer } from '@/components/course-picker/CoursePickerDrawer';
import { courseSelectionLabel } from '@/components/course-picker/course-picker.utils';
import { useModal } from '@/hooks/useModal';

import { StudentDetailsDrawer } from './StudentDetailsDrawer';
import { StudentsList } from './StudentsList';
import { StudentsToolbar } from './StudentsToolbar';
import { useStudentParams } from './useStudentParams';

import type { StudentRow } from '@/schemas/students.schema';

/** The student list: search, course filter (multi-select picker), paging and the details panel. */
export const StudentsManager = () => {
  const { t } = useTranslation();
  const { params, setParams, courseIds, filters } = useStudentParams();
  const students = useStudents(filters);
  const courses = useStudentCourses();
  const details = useModal<StudentRow>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const onSearch = useCallback(
    (search: string) => {
      setParams({ search });
    },
    [setParams],
  );

  return (
    <Box>
      <PageHeader title={t('people.students.title')} subtitle={t('people.students.subtitle')} />
      <StudentsToolbar
        search={params.search}
        onSearch={onSearch}
        courseLabel={courseSelectionLabel(t, courseIds, courses.data)}
        selectedCount={courseIds.length}
        onChooseCourses={() => {
          setPickerOpen(true);
        }}
      />
      <StudentsList
        query={students}
        hasFilters={courseIds.length > 0 || params.search !== ''}
        onOpen={details.openModal}
        onPageChange={(page) => {
          setParams({ page });
        }}
      />
      <CoursePickerDrawer
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
        }}
        title={t('coursePicker.title')}
        courses={{
          ...courses,
          data: courses.data?.map((course) => ({ ...course, count: course.enrolledStudents })),
        }}
        selectedIds={courseIds}
        countLabel={(count) => t('coursePicker.students', { count })}
        onApply={(ids) => {
          setParams({ courses: ids.join(',') });
          setPickerOpen(false);
        }}
      />
      <StudentDetailsDrawer
        open={details.open}
        student={details.data}
        onClose={details.closeModal}
      />
    </Box>
  );
};
