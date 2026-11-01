'use client';

import { useState } from 'react';

import { usePracticeCourses } from '@/api/practice-quiz.api';

import { NO_FILTERS } from './practice-quiz.utils';
import { usePracticeActions, type PracticeActions } from './usePracticeActions';
import { usePracticeAnswers, type PracticeAnswers } from './usePracticeAnswers';
import { usePracticeSelection, type PracticeSelection } from './usePracticeSelection';

import type { PracticeCourseFilters } from '@/schemas/practice-quiz.schema';

export interface PracticePage {
  filters: PracticeCourseFilters;
  changeFilters: (changes: Partial<PracticeCourseFilters>) => void;
  courses: ReturnType<typeof usePracticeCourses>;
  selection: PracticeSelection;
  practice: PracticeAnswers;
  actions: PracticeActions;
  resetBank: (bankId: string) => void;
}

/** Everything the practice page shows and does, in one place (the view only lays it out). */
export const usePracticePage = (): PracticePage => {
  const [filters, setFilters] = useState<PracticeCourseFilters>(NO_FILTERS);
  const courses = usePracticeCourses(filters);
  const selection = usePracticeSelection(courses.data);
  const practice = usePracticeAnswers(selection.courseId);
  const actions = usePracticeActions(practice);

  return {
    filters,
    changeFilters: (changes) => {
      setFilters((current) => ({ ...current, ...changes }));
    },
    courses,
    selection,
    practice,
    actions,
    resetBank: (bankId) => {
      const bank = selection.tree.data?.sections
        .flatMap((section) => section.banks)
        .find((item) => item._id === bankId);
      if (!bank) return;
      actions.reset(bank, () => {
        if (selection.bank?._id === bankId) selection.setPage(0);
      });
    },
  };
};
