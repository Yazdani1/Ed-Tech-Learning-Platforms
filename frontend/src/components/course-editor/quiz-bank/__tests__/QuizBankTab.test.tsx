import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { BANK, COURSE_ID, SECTION } from '../../__tests__/fixtures';
import { QuizBankTab } from '../QuizBankTab';

const SECTIONS_URL = `*/api/quiz-sections/course/${COURSE_ID}`;
const BANKS_URL = `*/api/quiz-bank/course/${COURSE_ID}`;

const renderTab = (sections = [SECTION], banks = [BANK]) => {
  server.use(
    http.get(SECTIONS_URL, () => ok(sections)),
    http.get(BANKS_URL, () => ok(banks)),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <QuizBankTab courseId={COURSE_ID} />
    </ConfirmProvider>,
  );
};

describe('QuizBankTab', () => {
  it('lists sections with their banks and opens a bank with its correct answers', async () => {
    renderTab();
    const user = userEvent.setup();

    const section = await screen.findByRole('listitem', { name: 'Chapter 1' });
    expect(within(section).getByText('Warm up')).toBeInTheDocument();
    expect(screen.getByText('Select a quiz bank to manage it')).toBeInTheDocument();

    await user.click(within(section).getByRole('button', { name: /^Basics quiz/ }));
    const panel = screen.getByRole('region', { name: 'Basics quiz' });
    expect(within(panel).getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(within(panel).getByRole('listitem', { name: 'Option B (correct)' })).toHaveTextContent(
      'Two plus two',
    );
    expect(within(panel).getByText('Questions (1)')).toBeInTheDocument();
  });

  it('shows the empty state and the error state', async () => {
    const { unmount } = renderTab([], []);
    expect(await screen.findByText('No sections yet. Click + to add one.')).toBeInTheDocument();
    unmount();

    server.use(
      http.get(SECTIONS_URL, () => fail(500, 'Server exploded')),
      http.get(BANKS_URL, () => ok([])),
    );
    renderWithProviders(
      <ConfirmProvider>
        <QuizBankTab courseId={COURSE_ID} />
      </ConfirmProvider>,
    );
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('creates a section', async () => {
    let body: unknown;
    server.use(
      http.post('*/api/quiz-sections', async ({ request }) => {
        body = await request.json();
        return ok({ ...SECTION, _id: '64b7f0c2a1b2c3d4e5f6b099', title: 'Chapter 2' });
      }),
    );
    renderTab();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add section' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add section' });
    await user.type(within(dialog).getByLabelText(/Section title/), 'Chapter 2');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Section created')).toBeInTheDocument();
    expect(body).toEqual({ course: COURSE_ID, title: 'Chapter 2' });
  });

  it('turns free preview on for a bank', async () => {
    let body: unknown;
    server.use(
      http.put(`*/api/quiz-bank/${BANK._id}`, async ({ request }) => {
        body = await request.json();
        return ok({ ...BANK, isFreePreview: true });
      }),
    );
    renderTab();
    await userEvent
      .setup()
      .click(await screen.findByRole('switch', { name: 'Free preview for Basics quiz' }));

    expect(await screen.findByText('Free Preview turned on')).toBeInTheDocument();
    expect(body).toEqual({ isFreePreview: true });
  });

  it('needs a correct answer before adding a question, then sends it', async () => {
    let body: unknown;
    server.use(
      http.post(`*/api/quiz-bank/${BANK._id}/questions`, async ({ request }) => {
        body = await request.json();
        return ok(BANK);
      }),
    );
    renderTab();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /^Basics quiz/ }));
    await user.click(screen.getByRole('button', { name: 'Add Question' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Question' });
    await user.type(within(dialog).getByLabelText(/Question text/), 'Capital of Bangladesh?');
    const options: [string, string][] = [
      ['A', 'Dhaka'],
      ['B', 'Khulna'],
      ['C', 'Sylhet'],
      ['D', 'Rajshahi'],
    ];
    for (const [letter, text] of options) {
      await user.type(within(dialog).getByLabelText(new RegExp(`Option ${letter} text`)), text);
    }
    await user.click(within(dialog).getByRole('button', { name: 'Add Question' }));
    expect(
      await within(dialog).findByText('Select at least one correct answer'),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByLabelText('Option A is correct'));
    await user.type(within(dialog).getByLabelText(/Explanation for option A/), 'The capital');
    await user.click(within(dialog).getByRole('button', { name: 'Add Question' }));

    expect(await screen.findByText('Question added')).toBeInTheDocument();
    expect(body).toEqual({
      question: 'Capital of Bangladesh?',
      options: [
        { text: 'Dhaka', explanation: 'The capital' },
        { text: 'Khulna' },
        { text: 'Sylhet' },
        { text: 'Rajshahi' },
      ],
      correctOptionIndices: [0],
    });
  });

  it('deletes a bank after confirming', async () => {
    let deleted = false;
    server.use(
      http.get(SECTIONS_URL, () => ok([SECTION])),
      http.get(BANKS_URL, () => ok(deleted ? [] : [BANK])),
      http.delete(`*/api/quiz-bank/${BANK._id}`, () => {
        deleted = true;
        return ok(null);
      }),
    );
    renderWithProviders(
      <ConfirmProvider>
        <QuizBankTab courseId={COURSE_ID} />
      </ConfirmProvider>,
    );
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole('button', { name: 'Actions for quiz bank Basics quiz' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Quiz Bank' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Quiz bank deleted')).toBeInTheDocument();
    expect(screen.queryByText('Warm up')).not.toBeInTheDocument();
  });
});
