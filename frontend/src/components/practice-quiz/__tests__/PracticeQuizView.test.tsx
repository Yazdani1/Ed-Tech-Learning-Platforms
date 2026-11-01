import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { PracticeQuizView } from '../PracticeQuizView';

import { COURSE_A, COURSE_B, makeCourse, publicHandlers, TREES } from './fixtures';
import type { QuizAttempt, QuizBank } from '@/schemas/quiz.schema';

const renderPage = (search = '') => {
  setLocation('/practice-quiz', search);
  return renderWithProviders(
    <ConfirmProvider>
      <PracticeQuizView />
    </ConfirmProvider>,
  );
};

const questionCard = (number: number, total: number) =>
  screen.findByRole('article', { name: `Q ${number} of ${total}` });

const openCourses = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Courses' }));
  return screen.findByRole('region', { name: 'Courses with free quizzes' });
};

describe('PracticeQuizView (guest)', () => {
  it('opens the first course and bank and checks an answer with the public endpoint', async () => {
    const checked = vi.fn();
    server.use(
      ...publicHandlers().handlers,
      http.post('*/api/quiz-bank/public/b1/questions/q1/check', async ({ request }) => {
        checked(await request.json());
        return ok({
          isCorrect: true,
          correctOptionIndices: [0],
          explanations: ['The SI unit of force', null, null, null],
        });
      }),
    );
    renderPage();

    const card = await questionCard(1, 2);
    expect(screen.getByRole('heading', { name: 'Motion' })).toBeInTheDocument();
    expect(screen.getByText(/Sign in to save your progress/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Unlock Course' })).toHaveAttribute(
      'href',
      `/courses/${COURSE_A}`,
    );
    expect(screen.getByText('2 locked')).toBeInTheDocument();
    expect(within(card).queryByText('The SI unit of force')).not.toBeInTheDocument();

    const check = within(card).getByRole('button', { name: 'Check Answer' });
    expect(check).toBeDisabled();
    await userEvent.click(within(card).getByRole('checkbox', { name: /Newton/ }));
    await userEvent.click(check);

    expect(await within(card).findByText('✓ Correct!')).toBeInTheDocument();
    expect(within(card).getByText('The SI unit of force')).toBeInTheDocument();
    expect(checked).toHaveBeenCalledWith({ selectedOptionIndices: [0] });
    expect(within(card).getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('shows a wrong answer with the correct option revealed and lists it under Wrong', async () => {
    server.use(
      ...publicHandlers().handlers,
      http.post('*/api/quiz-bank/public/b1/questions/q1/check', () =>
        ok({ isCorrect: false, correctOptionIndices: [0], explanations: [null, null, null, null] }),
      ),
    );
    renderPage();
    const card = await questionCard(1, 2);
    await userEvent.click(within(card).getByRole('checkbox', { name: /Joule/ }));
    await userEvent.click(within(card).getByRole('button', { name: 'Check Answer' }));
    expect(await within(card).findByText(/Incorrect/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Quiz banks' }));
    const bank = await screen.findByRole('article', { name: 'Motion' });
    await userEvent.click(within(bank).getByRole('button', { name: /^Wrong/ }));
    expect(await screen.findByText('Incorrect Questions')).toBeInTheDocument();
    expect(await questionCard(1, 1)).toBeInTheDocument();
  });

  it('opens the bank of a deep link from the course page', async () => {
    server.use(...publicHandlers().handlers);
    renderPage(`?courseId=${COURSE_A}&bankId=b2`);
    expect(await screen.findByRole('heading', { name: 'Energy' })).toBeInTheDocument();
    expect(await questionCard(1, 1)).toBeInTheDocument();
  });

  it('falls back to the first free bank when the linked bank is not free preview', async () => {
    server.use(...publicHandlers().handlers);
    renderPage(`?courseId=${COURSE_A}&bankId=locked`);
    expect(await screen.findByText(/not part of the free preview/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Motion' })).toBeInTheDocument();
  });

  it('lists the courses in a drawer and puts the chosen course in the URL', async () => {
    server.use(...publicHandlers().handlers);
    renderPage();
    await questionCard(1, 2);
    const list = await openCourses();
    expect(within(list).getByText('2 courses • No active filters')).toBeInTheDocument();
    await userEvent.click(within(list).getByRole('button', { name: /Chemistry/ }));
    expect(router.replace).toHaveBeenCalledWith(`/practice-quiz?courseId=${COURSE_B}`, {
      scroll: false,
    });
  });

  it('sends the pricing filter to the course list', async () => {
    const { handlers, queries } = publicHandlers();
    server.use(
      ...handlers,
      http.get('*/api/categories', () => ok([{ _id: 'cat1', name: 'Science' }])),
      http.get('*/api/course-types', () => ok([])),
    );
    renderPage();
    await questionCard(1, 2);
    const list = await openCourses();
    await userEvent.click(within(list).getByRole('button', { name: 'Filter' }));
    await userEvent.click(within(list).getByRole('combobox', { name: 'Pricing' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Free Only' }));
    expect(await within(list).findByText(/1 active filter/)).toBeInTheDocument();
    expect(queries).toContain('?pricing=Free');
  });

  it('shows the empty state when no course has free quizzes', async () => {
    server.use(...publicHandlers([]).handlers);
    renderPage();
    expect(
      await screen.findByText('Select a course and quiz to start practising'),
    ).toBeInTheDocument();
    await openCourses();
    expect(await screen.findByText('No free preview quizzes available yet.')).toBeInTheDocument();
  });

  it('shows the error of the course list', async () => {
    server.use(http.get('*/api/quiz-bank/public/courses', () => fail(500, 'Server error')));
    renderPage();
    const list = await openCourses();
    expect(await within(list).findByText('Server error')).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

/** Signed in: answers go into the attempt; the bank list reveals answered questions. */
const memberServer = (initial: QuizAttempt | null = null) => {
  let attempt = initial;
  const submitted = vi.fn();
  const banks = (): QuizBank[] =>
    (TREES[COURSE_A]?.sections[0]?.banks ?? []).map((bank) => ({
      ...bank,
      questions: bank.questions.map((question) =>
        attempt?.answers.some((answer) => answer.questionId === question._id)
          ? {
              ...question,
              correctOptionIndices: [0],
              options: question.options.map((option, index) => ({
                ...option,
                explanation: index === 0 ? 'Saved explanation' : null,
              })),
            }
          : question,
      ),
    }));
  server.use(
    signedInAs(makeUser('Student')),
    ...publicHandlers([makeCourse(COURSE_A, 'Physics')]).handlers,
    http.get(`*/api/quiz-bank/course/${COURSE_A}`, () => ok(banks())),
    http.get(`*/api/quiz-bank/course/${COURSE_A}/my-attempts`, () => ok(attempt ? [attempt] : [])),
    http.post('*/api/quiz-bank/b1/attempt/answer', async ({ request }) => {
      const body = (await request.json()) as {
        questionId: string;
        selectedOptionIndices: number[];
      };
      submitted(body);
      const isCorrect = body.selectedOptionIndices.join() === '0';
      attempt = {
        _id: 'att1',
        quizBank: 'b1',
        answers: [...(attempt?.answers ?? []), { ...body, isCorrect }],
      };
      return ok(attempt);
    }),
    http.delete('*/api/quiz-bank/b1/attempt', () => {
      attempt = null;
      return ok(null);
    }),
  );
  return { submitted };
};

describe('PracticeQuizView (signed in)', () => {
  it('saves the answer in the attempt and shows the revealed explanation', async () => {
    const { submitted } = memberServer();
    renderPage();
    const card = await questionCard(1, 2);
    expect(screen.queryByText(/Sign in to save your progress/)).not.toBeInTheDocument();
    await userEvent.click(within(card).getByRole('checkbox', { name: /Newton/ }));
    await userEvent.click(within(card).getByRole('button', { name: 'Check Answer' }));
    expect(await within(card).findByText('✓ Correct!')).toBeInTheDocument();
    expect(await within(card).findByText('Saved explanation')).toBeInTheDocument();
    expect(submitted).toHaveBeenCalledWith({ questionId: 'q1', selectedOptionIndices: [0] });
  });

  it('shows the saved answer and resets the bank after confirming', async () => {
    memberServer({
      _id: 'att1',
      quizBank: 'b1',
      answers: [{ questionId: 'q1', selectedOptionIndices: [1], isCorrect: false }],
    });
    renderPage();
    const card = await questionCard(1, 2);
    expect(await within(card).findByText(/Incorrect/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset progress for Motion' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }));
    expect(await screen.findByText('Practice reset')).toBeInTheDocument();
    const fresh = await questionCard(1, 2);
    expect(within(fresh).getByRole('button', { name: 'Check Answer' })).toBeInTheDocument();
  });

  it('shows the error when the question was already answered elsewhere', async () => {
    memberServer();
    server.use(
      http.post('*/api/quiz-bank/b1/attempt/answer', () =>
        fail(409, 'Question already answered; reset the attempt to try again'),
      ),
    );
    renderPage();
    const card = await questionCard(1, 2);
    await userEvent.click(within(card).getByRole('checkbox', { name: /Newton/ }));
    await userEvent.click(within(card).getByRole('button', { name: 'Check Answer' }));
    expect(await screen.findByText(/Question already answered/)).toBeInTheDocument();
  });
});

describe('PracticeQuizView (signed in, failed reads)', () => {
  it('shows the error of the bank list when the attempts loaded', async () => {
    memberServer();
    server.use(http.get(`*/api/quiz-bank/course/${COURSE_A}`, () => fail(500, 'Banks failed')));
    renderPage();
    expect(await screen.findByText(/Banks failed/)).toBeInTheDocument();
  });
});
