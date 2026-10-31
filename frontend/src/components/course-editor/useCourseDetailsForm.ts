'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCategories, useCourseTypes } from '@/api/catalog.api';
import {
  courseDetailsFormSchema,
  EMPTY_COURSE_DETAILS,
  type CourseDetailsForm,
} from '@/schemas/course-editor.schema';

import { toFormValues } from './course-form-data';
import { useCourseSaver } from './useCourseSaver';
import { useCoverImage, type CoverImage } from './useCoverImage';
import { type CourseStatus, type Course } from '@/schemas/browse.schema';

/** Changes are saved this long after the last edit (as before). */
const AUTOSAVE_DELAY_MS = 1200;

export interface CourseDetailsEditor {
  form: UseFormReturn<CourseDetailsForm>;
  cover: CoverImage;
  pickCover: (file: File) => void;
  isSaving: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  save: (status: CourseStatus) => void;
}

/** A new course starts with the first category and course type selected (as before). */
const useDefaultTaxonomy = (form: UseFormReturn<CourseDetailsForm>, enabled: boolean): void => {
  const categories = useCategories();
  const courseTypes = useCourseTypes();
  const { getValues, setValue } = form;
  const firstCategory = categories.data?.[0]?._id;
  const firstType = courseTypes.data?.[0]?._id;

  useEffect(() => {
    if (!enabled) return;
    if (firstCategory && !getValues('category')) setValue('category', firstCategory);
    if (firstType && !getValues('courseType')) setValue('courseType', firstType);
  }, [enabled, firstCategory, firstType, getValues, setValue]);
};

/** Saves an existing course a moment after each change. */
const useAutosave = (
  form: UseFormReturn<CourseDetailsForm>,
  enabled: boolean,
  save: () => Promise<void>,
) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  const [isAutoSaving, setAutoSaving] = useState(false);
  const { watch } = form;

  useEffect(() => {
    saveRef.current = save;
  });

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const schedule = useCallback(() => {
    if (!enabled) return;
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      setAutoSaving(true);
      void saveRef.current().finally(() => {
        setAutoSaving(false);
      });
    }, AUTOSAVE_DELAY_MS);
  }, [enabled, cancel]);

  useEffect(() => {
    // `name` is set for user edits and setValue, not for reset()
    const subscription = watch((_values, { name }) => {
      if (name) schedule();
    });
    return () => {
      subscription.unsubscribe();
      cancel();
    };
  }, [watch, schedule, cancel]);

  return { isAutoSaving, schedule, cancel };
};

/** The course details form (Basic Info, Media, Learning Content): manual save, publish and auto-save. */
export const useCourseDetailsForm = (course: Course | undefined): CourseDetailsEditor => {
  const { t } = useTranslation();
  const form = useForm<CourseDetailsForm>({
    resolver: zodResolver(courseDetailsFormSchema),
    defaultValues: course ? toFormValues(course) : EMPTY_COURSE_DETAILS,
  });
  const cover = useCoverImage();
  const saver = useCourseSaver(course?._id, cover);
  useDefaultTaxonomy(form, course === undefined);

  const autosave = useAutosave(form, course !== undefined, async () => {
    if (await form.trigger()) await saver.save(form.getValues(), { quiet: true });
  });

  const save = (status: CourseStatus): void => {
    autosave.cancel();
    void form.handleSubmit(
      (values) => saver.save(values, { status }),
      () => {
        toast.error(t('catalog.editor.fixErrors'));
      },
    )();
  };

  const pickCover = (file: File): void => {
    if (cover.pick(file)) autosave.schedule();
  };

  return {
    form,
    cover,
    pickCover,
    isSaving: saver.isSaving && !autosave.isAutoSaving,
    isAutoSaving: autosave.isAutoSaving,
    lastSaved: saver.lastSaved,
    save,
  };
};
