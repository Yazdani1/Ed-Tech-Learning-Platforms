'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useBulkDiscount, useBulkUpdateCourses } from '@/api/admin-courses.api';

import { toastError } from '@/utils/toast-error';

import {
  buildDiscountRequest,
  buildUpdateRequest,
  emptyAnnouncement,
  emptyDiscount,
  emptyFields,
  type BulkAnnouncementState,
  type BulkDiscountState,
  type BulkFieldsState,
  type BulkTab,
  type SetBulkField,
} from './bulk-form';

export interface BulkEditState {
  tab: BulkTab;
  setTab: (tab: BulkTab) => void;
  fields: BulkFieldsState;
  setField: SetBulkField;
  discount: BulkDiscountState;
  setDiscount: (key: keyof BulkDiscountState, value: string) => void;
  announcement: BulkAnnouncementState;
  setAnnouncement: (key: keyof BulkAnnouncementState, value: string) => void;
  submitting: boolean;
  /** Checks the active tab, sends it, toasts the result; resolves true on success */
  submit: (courseIds: string[]) => Promise<boolean>;
}

/** Form state of the bulk dialog and its submit (PATCH /api/courses/bulk or /bulk/discount). */
export const useBulkEdit = (): BulkEditState => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<BulkTab>('fields');
  const [fields, setFields] = useState<BulkFieldsState>(emptyFields);
  const [discount, setDiscountState] = useState<BulkDiscountState>(emptyDiscount);
  const [announcement, setAnnouncementState] = useState<BulkAnnouncementState>(emptyAnnouncement);
  const bulkUpdate = useBulkUpdateCourses();
  const bulkDiscount = useBulkDiscount();

  const fail = (key: string): false => {
    toast.error(t(`adminCourses.bulk.errors.${key}`));
    return false;
  };

  const submit = async (courseIds: string[]): Promise<boolean> => {
    const count = courseIds.length;
    if (count === 0) return fail('selectCourse');
    if (tab === 'discount') {
      const built = buildDiscountRequest(courseIds, discount);
      if (!built.ok) return fail(built.error);
      return bulkDiscount
        .mutateAsync(built.body)
        .then(() => {
          toast.success(t('adminCourses.bulk.discounted', { count }));
          return true;
        })
        .catch(toastError);
    }
    const built = buildUpdateRequest(courseIds, fields, announcement, tab);
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
    tab,
    setTab,
    fields,
    setField: (key, value) => {
      setFields((current) => ({ ...current, [key]: value }));
    },
    discount,
    setDiscount: (key, value) => {
      setDiscountState((current) => ({ ...current, [key]: value }));
    },
    announcement,
    setAnnouncement: (key, value) => {
      setAnnouncementState((current) => ({ ...current, [key]: value }));
    },
    submitting: bulkUpdate.isPending || bulkDiscount.isPending,
    submit,
  };
};
