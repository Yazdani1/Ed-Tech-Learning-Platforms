import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { COURSE_ID, makeWeek } from '../../__tests__/fixtures';
import { LiveClassTab } from '../LiveClassTab';

const LIST_URL = `*/api/study-curricula/course/${COURSE_ID}`;

const renderTab = () =>
  renderWithProviders(
    <ConfirmProvider>
      <LiveClassTab courseId={COURSE_ID} />
    </ConfirmProvider>,
  );

describe('LiveClassTab', () => {
  it('lists the weeks with their classes, date and time', async () => {
    server.use(http.get(LIST_URL, () => ok([makeWeek()])));
    renderTab();

    const week = await screen.findByRole('listitem', { name: 'Kick-off week' });
    expect(within(week).getByText('Intro class')).toBeInTheDocument();
    expect(within(week).getByText('Monday, Nov 2, 2026')).toBeInTheDocument();
    expect(within(week).getByText('10:00 AM')).toBeInTheDocument();
    expect(within(week).getByText('We start')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Live Class (1)' })).toBeInTheDocument();
  });

  it('shows the empty state and the error state', async () => {
    server.use(http.get(LIST_URL, () => ok([])));
    const { unmount } = renderTab();
    expect(await screen.findByText('No live class available.')).toBeInTheDocument();
    unmount();

    server.use(http.get(LIST_URL, () => fail(500, 'Server exploded')));
    renderTab();
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('adds a week with one class', async () => {
    let body: unknown;
    server.use(
      http.get(LIST_URL, () => ok([])),
      http.post(LIST_URL, async ({ request }) => {
        body = await request.json();
        return ok({ _id: '64b7f0c2a1b2c3d4e5f6a199' });
      }),
    );
    renderTab();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Week' }));
    const dialog = await screen.findByRole('dialog', { name: 'New Live Class' });
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect((await within(dialog).findAllByText('This field is required')).length).toBeGreaterThan(
      0,
    );

    await user.type(within(dialog).getByLabelText(/^Title/), 'Week one');
    await user.type(within(dialog).getByLabelText(/Week Name/), 'Week 1');
    await user.type(within(dialog).getByLabelText('Week description'), 'Live sessions');
    const firstClass = within(dialog).getByRole('group', { name: 'Class 1' });
    await user.type(within(firstClass).getByLabelText(/Class Title/), 'Intro');
    await user.type(within(firstClass).getByLabelText(/Class Date/), '2026-11-02');
    await user.type(within(firstClass).getByLabelText(/Class Time/), '10:00');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Live class added')).toBeInTheDocument();
    expect(body).toEqual({
      title: 'Week one',
      weekName: 'Week 1',
      description: 'Live sessions',
      lectures: [{ title: 'Intro', day: '2026-11-02', time: '10:00', description: '' }],
    });
  });

  it('adds a class to an existing week (the whole week is saved)', async () => {
    let body: { lectures?: unknown[] } = {};
    const week = makeWeek();
    server.use(
      http.get(LIST_URL, () => ok([week])),
      http.put(`*/api/study-curricula/${week._id}`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return ok({ _id: week._id });
      }),
    );
    renderTab();
    const user = userEvent.setup();

    const card = await screen.findByRole('listitem', { name: 'Kick-off week' });
    await user.click(within(card).getByRole('button', { name: 'Add Class' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Live Class' });
    const second = within(dialog).getByRole('group', { name: 'Class 2' });
    await user.type(within(second).getByLabelText(/Class Title/), 'Second class');
    await user.type(within(second).getByLabelText(/Class Date/), '2026-11-09');
    await user.type(within(second).getByLabelText(/Class Time/), '11:30');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Live class updated')).toBeInTheDocument();
    expect(body.lectures).toHaveLength(2);
  });

  it('deletes a week after confirming', async () => {
    let deleted = false;
    const week = makeWeek();
    server.use(
      http.get(LIST_URL, () => ok(deleted ? [] : [week])),
      http.delete(`*/api/study-curricula/${week._id}`, () => {
        deleted = true;
        return ok(null);
      }),
    );
    renderTab();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Actions for Kick-off week' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Live Class' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Live class deleted')).toBeInTheDocument();
    expect(await screen.findByText('No live class available.')).toBeInTheDocument();
  });
});
