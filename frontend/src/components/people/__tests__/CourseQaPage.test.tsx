import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { courseQuestionGroupSchema } from '@/schemas/people.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CourseQaPage } from '../course-qa/CourseQaPage';

import { objectId } from './people-fixtures';

const STUDENT = { _id: objectId('0801'), name: 'Asha Rahman', role: 'Student' };
const QUESTION = {
  _id: objectId('0901'),
  title: 'How do I factor?',
  description: '<p>Please <strong>explain</strong> factoring</p>',
  postedBy: STUDENT,
  isResolved: false,
  answerCount: 0,
  staffAnswerCount: 0,
  hasStaffAnswer: false,
  createdAt: '2026-10-20T10:00:00.000Z',
};
const ANSWERED = { ...QUESTION, _id: objectId('0902'), title: 'Homework?', hasStaffAnswer: true };
const GROUP = courseQuestionGroupSchema.parse({
  course: { _id: objectId('1001'), title: 'Algebra 101', subtitle: 'Basics' },
  questions: [QUESTION, ANSWERED],
});

const renderPage = () => {
  server.use(signedInAs(makeUser('Moderator')));
  return renderWithProviders(<CourseQaPage />);
};

const user = () => userEvent.setup();

describe('CourseQaPage', () => {
  it('groups the unresolved questions by course with filters', async () => {
    server.use(http.get('*/api/qa/admin/course-questions', () => ok([GROUP])));
    renderPage();

    const course = await screen.findByRole('region', { name: 'Algebra 101' });
    expect(within(course).getByText('How do I factor?')).toBeInTheDocument();
    expect(within(course).getAllByText('Please explain factoring')).toHaveLength(2);
    expect(within(course).getAllByText('Needs staff answer')).toHaveLength(1);
    expect(screen.getByText('1 course')).toBeInTheDocument();

    await user().click(within(course).getByRole('button', { name: 'Not answered yet (1)' }));
    expect(within(course).queryByText('Homework?')).not.toBeInTheDocument();
    await user().click(within(course).getByRole('button', { name: 'Already resolved (0)' }));
    expect(within(course).getByText('No questions in this filter.')).toBeInTheDocument();
  });

  it('shows the empty and error states', async () => {
    server.use(http.get('*/api/qa/admin/course-questions', () => ok([])));
    const { unmount } = renderPage();
    expect(await screen.findByText('No course questions yet')).toBeInTheDocument();
    unmount();

    server.use(http.get('*/api/qa/admin/course-questions', () => fail(500, 'Q&A failed')));
    renderPage();
    expect(await screen.findByText('Q&A failed')).toBeInTheDocument();
  });

  it('links every question to its thread in the course player (answered and resolved there)', async () => {
    server.use(http.get('*/api/qa/admin/course-questions', () => ok([GROUP])));
    renderPage();

    expect(
      await screen.findByRole('link', { name: 'Open question: How do I factor?' }),
    ).toHaveAttribute(
      'href',
      `/admin/courses/${GROUP.course._id}/learn?tab=qa&questionId=${QUESTION._id}`,
    );
    expect(screen.getAllByText('Asha Rahman')).toHaveLength(2);
  });
});
