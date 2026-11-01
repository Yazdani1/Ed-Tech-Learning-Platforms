'use client';

import { useState } from 'react';
import { z } from 'zod';

import { usePracticeTree } from '@/api/practice-quiz.api';
import { useUrlListParams } from '@/hooks/useUrlListParams';

import type { Subsection } from '@/components/common/quiz/quiz.utils';
import type { PracticeCourse } from '@/schemas/practice-quiz.schema';
import type { QuizBank } from '@/schemas/quiz.schema';

const urlSchema = z.object({
  courseId: z.string().catch(''),
  bankId: z.string().catch(''),
});

export interface PracticeSelection {
  /** The free-preview tree of the shown course */
  tree: ReturnType<typeof usePracticeTree>;
  /** The course shown: the one in the URL, else the first course of the list */
  courseId: string | null;
  /** The bank shown: the one in the URL when the course has it, else the course's first bank */
  bank: QuizBank | null;
  /** The URL names a bank this course does not offer for free practice */
  bankMissing: boolean;
  subsection: Subsection;
  /** Index of the question shown in the current subsection */
  page: number;
  setPage: (page: number) => void;
  selectCourse: (courseId: string) => void;
  selectBank: (bankId: string, subsection: Subsection) => void;
}

/**
 * Which course, bank, subsection and question are shown. Course and bank live in the URL
 * (`/practice-quiz?courseId=&bankId=`: deep links from the course page); the rest is page state.
 */
export const usePracticeSelection = (courses: PracticeCourse[] | undefined): PracticeSelection => {
  const { params, setParams } = useUrlListParams(urlSchema);
  const [subsection, setSubsection] = useState<Subsection>('all');
  const [paging, setPaging] = useState({ key: '', page: 0 });

  const courseId = params.courseId || (courses?.[0]?._id ?? null);
  const treeQuery = usePracticeTree(courseId);
  const tree = treeQuery.data;
  const banks = tree?.sections.flatMap((section) => section.banks) ?? [];
  const wanted = banks.find((item) => item._id === params.bankId);
  const bank = wanted ?? banks[0] ?? null;
  const bankMissing = tree !== undefined && params.bankId !== '' && wanted === undefined;

  // The question index belongs to one bank + subsection: switching either starts at the first question
  const pagingKey = `${bank?._id ?? ''}:${subsection}`;
  const page = paging.key === pagingKey ? paging.page : 0;

  return {
    tree: treeQuery,
    courseId,
    bank,
    bankMissing,
    subsection,
    page,
    setPage: (next) => {
      setPaging({ key: pagingKey, page: next });
    },
    selectCourse: (id) => {
      setSubsection('all');
      setParams({ courseId: id, bankId: null });
    },
    selectBank: (bankId, next) => {
      setSubsection(next);
      setPaging({ key: `${bankId}:${next}`, page: 0 });
      if (courseId) setParams({ courseId, bankId });
    },
  };
};
