'use client';

import { useTranslation } from 'react-i18next';

import { TeacherMultiSelect } from '@/components/course-fields/TeacherMultiSelect';

import type { FilterOption } from '@/components/common/FilterSelect';
import type { FC } from 'react';

interface BulkTeachersFieldProps {
  teacherIds: string[];
  teachers: FilterOption[];
  onChange: (ids: string[]) => void;
}

/** Teachers to set on every selected course (replaces their teachers; empty = no change). */
export const BulkTeachersField: FC<BulkTeachersFieldProps> = ({
  teacherIds,
  teachers,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <TeacherMultiSelect
      size="small"
      label={t('adminCourses.bulk.teachers')}
      placeholder={t('adminCourses.bulk.addTeacher')}
      noOptionsText={t('adminCourses.bulk.noMatch')}
      teachers={teachers}
      value={teacherIds}
      onChange={onChange}
    />
  );
};
