import { describe, expect, it } from 'vitest';

import { findActiveLecture } from '../learn.utils';
import { countByFilter, filterQuestions } from '../qa/qa.utils';
import { courseQuestions, statsOf, subsectionQuestions, toAnswerMap } from '../quiz/quiz.utils';

import { makeBank, makeCourse, makeQuestion } from './fixtures';

describe('course player helpers', () => {
  it('picks the chosen lecture, otherwise the first playable one', () => {
    const course = makeCourse();
    expect(findActiveLecture(course, null)?._id).toBe('l1');
    expect(findActiveLecture(course, 'l2')?._id).toBe('l2');
    expect(findActiveLecture(makeCourse({ sections: [] }), null)).toBeNull();
  });

  it('filters and counts questions', () => {
    const questions = [
      makeQuestion(),
      makeQuestion({ _id: 'q2', isResolved: true, hasStaffAnswer: true }),
      makeQuestion({ _id: 'q3', hasStaffAnswer: true }),
    ];
    expect(countByFilter(questions)).toEqual({
      all: 3,
      unresolved: 2,
      needsStaffAnswer: 1,
      resolved: 1,
    });
    expect(filterQuestions(questions, 'resolved').map((q) => q._id)).toEqual(['q2']);
  });

  it('computes quiz progress from the stored answers', () => {
    const bank = makeBank();
    const answers = toAnswerMap([
      {
        _id: 'a',
        quizBank: 'b1',
        answers: [{ questionId: 'qq1', selectedOptionIndices: [1], isCorrect: false }],
      },
    ]);
    expect(statsOf(bank.questions, answers)).toEqual({
      total: 2,
      answered: 1,
      correct: 0,
      incorrect: 1,
      remaining: 1,
      accuracy: 0,
    });
    expect(subsectionQuestions(bank, answers, 'incorrect').map((q) => q._id)).toEqual(['qq1']);
    expect(subsectionQuestions(bank, answers, 'correct')).toEqual([]);
    expect(courseQuestions([], [bank])).toEqual([]);
  });
});
