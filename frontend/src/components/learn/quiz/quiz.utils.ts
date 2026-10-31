import type {
  QuizAnswer,
  QuizAttempt,
  QuizBank,
  QuizQuestion,
  QuizSection,
} from '@/schemas/quiz.schema';
// Pure quiz helpers: the student's answers per question and the numbers shown in the sidebar and panels.

export const SUBSECTIONS = ['all', 'incorrect', 'correct'] as const;
export type Subsection = (typeof SUBSECTIONS)[number];

export type AnswerMap = Map<string, QuizAnswer>;

const PERCENT = 100;

/** Every answer of every attempt, by question id. */
export const toAnswerMap = (attempts: QuizAttempt[]): AnswerMap =>
  new Map(
    attempts.flatMap((attempt) => attempt.answers.map((answer) => [answer.questionId, answer])),
  );

const isWrong = (answer: QuizAnswer | undefined): boolean =>
  answer !== undefined && !answer.isCorrect;

export const subsectionQuestions = (
  bank: QuizBank,
  answers: AnswerMap,
  subsection: Subsection,
): QuizQuestion[] => {
  if (subsection === 'all') return bank.questions;
  if (subsection === 'incorrect') return bank.questions.filter((q) => isWrong(answers.get(q._id)));
  return bank.questions.filter((q) => answers.get(q._id)?.isCorrect === true);
};

export interface QuizStats {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  remaining: number;
  /** Correct answers as a share of all questions, 0-100 */
  accuracy: number;
}

export const statsOf = (questions: QuizQuestion[], answers: AnswerMap): QuizStats => {
  const correct = questions.filter((q) => answers.get(q._id)?.isCorrect === true).length;
  const incorrect = questions.filter((q) => isWrong(answers.get(q._id))).length;
  const total = questions.length;
  return {
    total,
    answered: correct + incorrect,
    correct,
    incorrect,
    remaining: total - correct - incorrect,
    accuracy: total > 0 ? Math.round((correct / total) * PERCENT) : 0,
  };
};

/** Course totals: only banks that belong to one of the listed quiz sections (as before). */
export const courseQuestions = (sections: QuizSection[], banks: QuizBank[]): QuizQuestion[] => {
  const ids = new Set(sections.map((section) => section._id));
  return banks
    .filter((bank) => bank.quizSection && ids.has(bank.quizSection))
    .flatMap((bank) => bank.questions);
};
