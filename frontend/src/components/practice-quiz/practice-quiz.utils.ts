import type { PracticeCourseFilters, PracticeTree } from '@/schemas/practice-quiz.schema';
import type { QuizQuestion } from '@/schemas/quiz.schema';

// Pure helpers of the practice quiz page.

export const NO_FILTERS: PracticeCourseFilters = {
  search: '',
  categories: '',
  courseTypes: '',
  pricing: '',
};

/** Number of filters that are set. */
export const activeFilterCount = (filters: PracticeCourseFilters): number =>
  [filters.search.trim(), filters.categories, filters.courseTypes, filters.pricing].filter(Boolean)
    .length;

/** Every question of every free bank of the course (the course totals). */
export const treeQuestions = (tree: PracticeTree | undefined): QuizQuestion[] =>
  tree?.sections.flatMap((section) => section.banks.flatMap((bank) => bank.questions)) ?? [];

/** Number of free banks in the tree. */
export const treeBankCount = (tree: PracticeTree | undefined): number =>
  tree?.sections.reduce((sum, section) => sum + section.banks.length, 0) ?? 0;
