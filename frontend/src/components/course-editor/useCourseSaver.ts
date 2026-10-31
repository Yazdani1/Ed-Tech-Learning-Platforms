'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCreateCourse, useUpdateCourse } from '@/api/course-editor.api';
import { toastError } from '@/utils/toast-error';

import { buildContentFormData, buildDetailsFormData } from './course-form-data';

import type { CoverImage } from './useCoverImage';
import type { CourseDetailsForm } from '@/schemas/course-editor.schema';
import type { CourseStatus } from '@/schemas/browse.schema';

export interface SaveOptions {
  /** Also publish (or unpublish) after saving */
  status?: CourseStatus;
  /** Auto-save: no success toast */
  quiet?: boolean;
}

export interface CourseSaver {
  save: (values: CourseDetailsForm, options?: SaveOptions) => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
}

/** Toast text of a successful save. */
const successKey = (status: CourseStatus | undefined, isNew: boolean): string => {
  if (status === 'Published') return 'catalog.editor.publishedToast';
  return isNew ? 'catalog.editor.createdToast' : 'catalog.editor.savedToast';
};

/** Creates the course (then opens its edit page) or saves the existing one, with the picked cover. */
export const useCourseSaver = (courseId: string | undefined, cover: CoverImage): CourseSaver => {
  const { t } = useTranslation();
  const router = useRouter();
  const create = useCreateCourse();
  const update = useUpdateCourse(courseId ?? '');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const fallbackTitle = t('catalog.editor.untitled');

  const saveNew = (values: CourseDetailsForm, status?: CourseStatus): Promise<void> => {
    const file = cover.take();
    return create
      .mutateAsync({
        details: buildDetailsFormData(values, { cover: file, fallbackTitle, withContent: false }),
        extras: buildContentFormData(values),
        intro: {
          section: t('catalog.curriculum.introSection'),
          lecture: t('catalog.curriculum.introLecture'),
        },
        status,
      })
      .then(({ course, complete }) => {
        // From here on the course exists: a retry must edit it, so the edit page opens either way
        if (complete) toast.success(t(successKey(status, true)));
        else toast.error(t('catalog.editor.createdIncomplete'));
        router.replace(`/admin/courses/${course._id}/edit`);
      })
      .catch((error: unknown) => {
        if (file) cover.restore(file);
        toastError(error);
      });
  };

  const saveExisting = (values: CourseDetailsForm, options: SaveOptions): Promise<void> => {
    const file = cover.take();
    return update
      .mutateAsync({
        details: buildDetailsFormData(values, { cover: file, fallbackTitle, withContent: true }),
        status: options.status,
      })
      .then(() => {
        cover.uploaded();
        setLastSaved(new Date());
        if (!options.quiet) toast.success(t(successKey(options.status, false)));
      })
      .catch((error: unknown) => {
        if (file) cover.restore(file);
        toastError(error);
      });
  };

  const save = (values: CourseDetailsForm, options: SaveOptions = {}): Promise<void> => {
    const needsTaxonomy = !courseId || options.status === 'Published';
    if (needsTaxonomy && (!values.category || !values.courseType)) {
      toast.error(t('catalog.editor.needTaxonomy'));
      return Promise.resolve();
    }
    return courseId ? saveExisting(values, options) : saveNew(values, options.status);
  };

  return { save, isSaving: create.isPending || update.isPending, lastSaved };
};
