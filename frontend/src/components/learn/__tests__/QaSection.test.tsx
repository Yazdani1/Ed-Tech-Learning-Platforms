import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { QaSection } from '../qa/QaSection';

import { COURSE_ID, makeQuestion, posterOf } from './fixtures';

const QUESTIONS = `*/api/qa/questions/course/${COURSE_ID}`;
const PATH = `/student/courses/${COURSE_ID}/learn`;

const renderQa = () =>
  renderWithProviders(
    <ConfirmProvider>
      <QaSection courseId={COURSE_ID} />
    </ConfirmProvider>,
  );

const open = makeQuestion();
const solved = makeQuestion({
  _id: 'q2',
  title: 'Solved one',
  isResolved: true,
  hasStaffAnswer: true,
  answerCount: 1,
  staffAnswerCount: 1,
  postedBy: { ...posterOf('Student'), _id: 'other-student' },
});

describe('QaSection', () => {
  it('filters questions: open ones first, then all and solved', async () => {
    setLocation(PATH);
    server.use(
      signedInAs(makeUser('Student')),
      http.get(QUESTIONS, () => ok([open, solved])),
    );
    renderQa();
    const user = userEvent.setup();

    expect(await screen.findByRole('article', { name: 'What is inertia?' })).toBeInTheDocument();
    expect(screen.getByText('Needs staff answer')).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Solved one' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Already resolved (1)' }));
    expect(screen.getByRole('article', { name: 'Solved one' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'What is inertia?' })).not.toBeInTheDocument();
  });

  it("lets a student resolve their own question but not someone else's", async () => {
    const resolved = vi.fn();
    setLocation(PATH);
    server.use(
      signedInAs(makeUser('Student')),
      http.get(QUESTIONS, () => ok([open, solved])),
      http.patch('*/api/qa/questions/q1/resolve', async ({ request }) => {
        resolved(await request.json());
        return ok({ ...open, isResolved: true });
      }),
    );
    renderQa();
    const user = userEvent.setup();

    const mine = await screen.findByRole('article', { name: 'What is inertia?' });
    await user.click(await within(mine).findByRole('button', { name: 'Mark solved' }));
    expect(await screen.findByText('Question marked as solved')).toBeInTheDocument();
    expect(resolved).toHaveBeenCalledWith({ isResolved: true });

    await user.click(screen.getByRole('button', { name: /All questions/ }));
    const other = screen.getByRole('article', { name: 'Solved one' });
    expect(
      within(other).queryByRole('button', { name: 'Mark not solved' }),
    ).not.toBeInTheDocument();
  });

  it('upvotes a question and shows the new count', async () => {
    const student = makeUser('Student');
    setLocation(PATH);
    server.use(
      signedInAs(student),
      http.get(QUESTIONS, () => ok([open])),
      http.patch('*/api/qa/questions/q1/upvote', () => ok({ upvotes: [student._id] })),
    );
    renderQa();

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Upvote (0)' }));
    expect(await screen.findByRole('button', { name: 'Remove upvote (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('opens a question with its answers via the URL', async () => {
    setLocation(PATH);
    server.use(
      signedInAs(makeUser('Student')),
      http.get(QUESTIONS, () => ok([open])),
    );
    const { unmount } = renderQa();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'What is inertia?' }));
    expect(router.replace).toHaveBeenCalledWith(`${PATH}?tab=qa&questionId=q1`, { scroll: false });
    unmount();

    setLocation(PATH, '?tab=qa&questionId=q1');
    server.use(
      http.get('*/api/qa/questions/q1', () =>
        ok({
          question: { ...open, answerCount: 1 },
          answers: [
            {
              _id: 'ans1',
              body: '<p>Resistance to change</p>',
              postedBy: posterOf('Teacher'),
              upvotes: [],
              createdAt: '2026-10-03T10:00:00.000Z',
            },
          ],
        }),
      ),
    );
    renderQa();

    expect(
      await screen.findByRole('heading', { name: 'What is inertia?', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1 Answer' })).toBeInTheDocument();
    expect(await screen.findByText('Resistance to change')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Questions' }));
    expect(router.replace).toHaveBeenLastCalledWith(`${PATH}?tab=qa`, { scroll: false });
  });

  it('shows the empty state with the ask button', async () => {
    setLocation(PATH);
    server.use(
      signedInAs(makeUser('Student')),
      http.get(QUESTIONS, () => ok([])),
    );
    renderQa();

    expect(await screen.findByText(/No questions yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask a Question' })).toBeInTheDocument();
  });
});
