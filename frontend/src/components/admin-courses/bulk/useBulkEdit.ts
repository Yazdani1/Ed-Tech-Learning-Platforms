'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useBulkUpdateCourses } from '@/api/admin-courses.api';
import { toastError } from '@/utils/toast-error';

import {
  buildUpdateRequest,
  emptyFields,
  type BulkFieldsState,
  type SetBulkField,
} from './bulk-form';

export interface BulkEditState {
  fields: BulkFieldsState;
  setField: SetBulkField;
  submitting: boolean;
  /** Checks the form, sends it, toasts the result; resolves true on success */
  submit: (courseIds: string[]) => Promise<boolean>;
}

/** Form state of the bulk dialog and its submit (PATCH /api/courses/bulk). */
export const useBulkEdit = (): BulkEditState => {
  const { t } = useTranslation();
  const [fields, setFields] = useState<BulkFieldsState>(emptyFields);
  const bulkUpdate = useBulkUpdateCourses();

  const fail = (key: string): false => {
    toast.error(t(`adminCourses.bulk.errors.${key}`));
    return false;
  };

  const submit = async (courseIds: string[]): Promise<boolean> => {
    const count = courseIds.length;
    if (count === 0) return fail('selectCourse');
    const built = buildUpdateRequest(courseIds, fields);
    if (!built.ok) return fail(built.error);
    return bulkUpdate
      .mutateAsync(built.body)
      .then(() => {
        toast.success(t('adminCourses.bulk.updated', { count }));
        return true;
      })
      .catch(toastError);
  };

  return {
    fields,
    setField: (key, value) => {
      setFields((current) => ({ ...current, [key]: value }));
    },
    submitting: bulkUpdate.isPending,
    submit,
  };
};
