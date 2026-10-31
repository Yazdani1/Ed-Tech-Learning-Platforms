import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { QuizTab } from '../quiz/QuizTab';

import { COURSE_ID, makeBank } from './fixtures';
import type { QuizAttempt, QuizBank } from '@/schemas/quiz.schema';

const SECTIONS = `*/api/quiz-sections/course/${COURSE_ID}`;
const BANKS = `*/api/quiz-bank/course/${COURSE_ID}`;
const ATTEMPTS = `*/api/quiz-bank/course/${COURSE_ID}/my-attempts`;

const section = { _id: 'qs1', title: 'Chapter 1', order: 0, isFreePreview: false };

const renderQuiz = () =>
  renderWithProviders(
    <ConfirmProvider>
      <QuizTab courseId={COURSE_ID} />
    </ConfirmProvider>,
  );

/** A tiny in-memory server: answers are revealed in the bank list only after they were answered. */
const quizServer = (): { submitted: ReturnType<typeof vi.fn> } => {
  const submitted = vi.fn();
  let attempt: QuizAttempt | null = null;
  const banks = (): QuizBank[] => {
    const bank = makeBank();
    const answered = new Set(attempt?.answers.map((answer) => answer.questionId));
    return [
      {
        ...bank,
        questions: bank.questions.map((question) =>
          answered.has(question._id)
            ? {
                ...question,
                correctOptionIndices: [0],
                options: question.options.map((option, index) => ({
                  ...option,
                  explanation: index === 0 ? 'SI unit of force' : null,
                })),
              }
            : question,
        ),
      },
    ];
  };
  server.use(
    http.get(SECTIONS, () => ok([section])),
    http.get(BANKS, () => ok(banks())),
    http.get(ATTEMPTS, () => ok(attempt ? [attempt] : [])),
    http.post('*/api/quiz-bank/b1/attempt/answer', async ({ request }) => {
      const body = (await request.json()) as {
        questionId: string;
        selectedOptionIndices: number[];
      };
      submitted(body);
      attempt = {
        _id: 'att1',
        quizBank: 'b1',
        answers: [
          ...(attempt?.answers ?? []),
          { ...body, isCorrect: body.selectedOptionIndices.join() === '0' },
        ],
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

describe('QuizTab', () => {
  it('answers a question: the result and explanation appear only after checking', async () => {
    server.use(signedInAs(makeUser('Student')));
    const { submitted } = quizServer();
    renderQuiz();
    const user = userEvent.setup();

    const bankCard = await screen.findByRole('article', { name: 'Motion basics' });
    await user.click(within(bankCard).getByRole('button', { name: /^All/ }));

    const card = await screen.findByRole('article', { name: 'Q 1 of 2' });
    expect(within(card).queryByText('SI unit of force')).not.toBeInTheDocument();
    const check = within(card).getByRole('button', { name: 'Check Answer' });
    expect(check).toBeDisabled();

    await user.click(within(card).getByRole('checkbox', { name: /Joule/ }));
    await user.click(check);

    expect(await within(card).findByText(/Incorrect/)).toBeInTheDocument();
    expect(submitted).toHaveBeenCalledWith({ questionId: 'qq1', selectedOptionIndices: [1] });
    expect(await within(card).findByText('SI unit of force')).toBeInTheDocument();
    // Answered: options are locked and the button moves on
    expect(within(card).getByRole('checkbox', { name: /Newton/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(card).getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getAllByRole('group', { name: 'Course quiz progress' })[0]).toHaveTextContent(
      'Incorrect: 1',
    );
  });

  it('resets the attempt after confirming', async () => {
    server.use(signedInAs(makeUser('Student')));
    quizServer();
    renderQuiz();
    const user = userEvent.setup();

    const bankCard = await screen.findByRole('article', { name: 'Motion basics' });
    await user.click(within(bankCard).getByRole('button', { name: /^All/ }));
    const card = await screen.findByRole('article', { name: 'Q 1 of 2' });
    await user.click(within(card).getByRole('checkbox', { name: /Newton/ }));
    await user.click(within(card).getByRole('button', { name: 'Check Answer' }));
    expect(await within(card).findByText('✓ Correct!')).toBeInTheDocument();

    const [reset] = screen.getAllByRole('button', { name: 'Reset progress for Motion basics' });
    if (!reset) throw new Error('The reset button is missing');
    await user.click(reset);
    const dialog = await screen.findByRole('dialog', { name: 'Reset Practice' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset' }));

    expect(await screen.findByText('Practice reset')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Check Answer' })).toBeInTheDocument();
  });

  it('shows the server message when an answer is refused (already answered)', async () => {
    server.use(signedInAs(makeUser('Student')));
    quizServer();
    server.use(
      http.post('*/api/quiz-bank/b1/attempt/answer', () =>
        fail(409, 'Question already answered; reset the attempt to try again'),
      ),
    );
    renderQuiz();
    const user = userEvent.setup();

    const bankCard = await screen.findByRole('article', { name: 'Motion basics' });
    await user.click(within(bankCard).getByRole('button', { name: /^All/ }));
    const card = await screen.findByRole('article', { name: 'Q 1 of 2' });
    await user.click(within(card).getByRole('checkbox', { name: /Newton/ }));
    await user.click(within(card).getByRole('button', { name: 'Check Answer' }));

    expect(
      await screen.findByText('Question already answered; reset the attempt to try again'),
    ).toBeInTheDocument();
  });

  it('shows the empty state when the course has no quiz sections', async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.get(SECTIONS, () => ok([])),
      http.get(BANKS, () => ok([])),
      http.get(ATTEMPTS, () => ok([])),
    );
    renderQuiz();

    expect(await screen.findByText('No quiz sections in this course yet.')).toBeInTheDocument();
  });
});
