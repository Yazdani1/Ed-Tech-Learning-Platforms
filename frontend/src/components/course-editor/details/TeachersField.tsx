'use client';

import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useTeachers } from '@/api/public.api';
import { TeacherMultiSelect } from '@/components/course-fields/TeacherMultiSelect';

import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { FC } from 'react';

interface TeachersFieldProps {
  control: Control<CourseDetailsForm>;
}

/** Pick the course's teachers (chips; each can be removed). */
export const TeachersField: FC<TeachersFieldProps> = ({ control }) => {
  const { t } = useTranslation();
  const teachers = useTeachers();
  const options = (teachers.data ?? []).map((teacher) => ({
    value: teacher._id,
    label: teacher.name,
  }));

  return (
    <Controller
      control={control}
      name="teachers"
      render={({ field }) => (
        <TeacherMultiSelect
          label={t('catalog.basic.teachers')}
          placeholder={t('catalog.basic.addTeacher')}
          noOptionsText={t('catalog.basic.noTeachers')}
          teachers={options}
          value={field.value}
          onChange={field.onChange}
          loading={teachers.isLoading}
          error={teachers.error?.message}
        />
      )}
    />
  );
};
