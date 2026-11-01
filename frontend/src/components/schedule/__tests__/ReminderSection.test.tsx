import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { playAlarm, showSystemNotification } from '../alarm';
import { SchedulePage } from '../SchedulePage';

import { makeSchedule, scheduleApi } from './fixtures';

import type { Schedule } from '@/schemas/schedule.schema';

vi.mock('../alarm', () => ({
  playAlarm: vi.fn(),
  showSystemNotification: vi.fn(),
  requestNotificationPermission: vi.fn(),
}));

const HOUR_MS = 3_600_000;
const iso = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString();
/** A datetime-local value (viewer's zone) offsetMs from now */
const localInput = (offsetMs: number): string =>
  DateTime.fromMillis(Date.now() + offsetMs).toFormat("yyyy-LL-dd'T'HH:mm");

const renderReminders = async (items: Schedule[]) => {
  const api = scheduleApi(items);
  server.use(...api.handlers);
  renderWithProviders(
    <ConfirmProvider>
      <SchedulePage />
    </ConfirmProvider>,
  );
  await userEvent.click(screen.getByRole('tab', { name: 'Reminders' }));
  return api;
};

const upcoming = (overrides: Partial<Schedule> = {}): Schedule =>
  makeSchedule({
    type: 'reminder',
    status: 'pending',
    title: 'Chemistry prep',
    duration: null,
    startDateTime: iso(2 * HOUR_MS),
    ...overrides,
  });

describe('Study schedule: reminders', () => {
  beforeEach(() => {
    vi.mocked(playAlarm).mockClear();
    vi.mocked(showSystemNotification).mockClear();
  });

  it('shows the empty state', async () => {
    await renderReminders([]);
    expect(
      await screen.findByText('No reminders yet. Set one above to schedule a study session!'),
    ).toBeInTheDocument();
  });

  it('shows an upcoming reminder with its countdown and start time', async () => {
    await renderReminders([upcoming()]);
    const card = await screen.findByRole('article', { name: 'Chemistry prep' });
    expect(within(card).getByText('UPCOMING')).toBeInTheDocument();
    expect(within(card).getByRole('timer', { name: 'Starts in' })).toHaveTextContent(
      /0[12]:\d\d:\d\d/,
    );
    expect(within(card).getByText('Starts:')).toBeInTheDocument();
  });

  it('fires a due reminder: saved as active, alarm, alert and study stopwatch', async () => {
    const api = await renderReminders([upcoming({ title: 'Due now', startDateTime: iso(-1000) })]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Study session started: Due now');
    expect(playAlarm).toHaveBeenCalledTimes(1);
    expect(showSystemNotification).toHaveBeenCalledWith('Study reminder', 'Due now');
    expect(api.calls[0]).toMatchObject({ method: 'PUT', body: { status: 'active' } });
    const card = await screen.findByRole('article', { name: 'Due now' });
    expect(await within(card).findByText('ACTIVE')).toBeInTheDocument();
    expect(within(card).getByRole('timer', { name: 'Study time' })).toBeInTheDocument();

    await userEvent.click(within(card).getByRole('button', { name: 'Complete Session' }));
    expect(await screen.findByText('Session completed')).toBeInTheDocument();
    expect(api.calls[1]?.body).toMatchObject({ status: 'completed' });
  });

  it('checks the form: future start and end after start', async () => {
    const api = await renderReminders([]);
    await userEvent.type(await screen.findByLabelText(/^Title/), 'Exam');
    await userEvent.type(screen.getByLabelText(/^Start Date & Time/), localInput(-HOUR_MS));
    await userEvent.click(screen.getByRole('button', { name: 'Set Reminder' }));
    expect(await screen.findByText('Start time must be in the future.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/^Start Date & Time/));
    await userEvent.type(screen.getByLabelText(/^Start Date & Time/), localInput(2 * HOUR_MS));
    await userEvent.type(screen.getByLabelText(/^End Date & Time/), localInput(HOUR_MS));
    await userEvent.click(screen.getByRole('button', { name: 'Set Reminder' }));
    expect(await screen.findByText('End time must be after start time.')).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);
  });

  it('creates a reminder with UTC dates', async () => {
    const api = await renderReminders([]);
    const start = localInput(2 * HOUR_MS);
    await userEvent.type(await screen.findByLabelText(/^Title/), 'Exam');
    await userEvent.type(screen.getByLabelText(/^Start Date & Time/), start);
    await userEvent.click(screen.getByRole('button', { name: 'Set Reminder' }));
    expect(await screen.findByText('Reminder set')).toBeInTheDocument();
    expect(api.calls[0]).toEqual({
      method: 'POST reminder',
      body: {
        title: 'Exam',
        description: '',
        startDateTime: DateTime.fromISO(start).toUTC().toISO(),
      },
    });
    expect(await screen.findByRole('article', { name: 'Exam' })).toBeInTheDocument();
  });

  it('edits a reminder and clears its end', async () => {
    const api = await renderReminders([upcoming({ endDateTime: iso(3 * HOUR_MS) })]);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Actions for Chemistry prep' }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit reminder' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Reminder' });
    const title = within(dialog).getByLabelText(/^Title/);
    await userEvent.clear(title);
    await userEvent.type(title, 'Chemistry final');
    await userEvent.clear(within(dialog).getByLabelText(/^End Date & Time/));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByText('Reminder updated')).toBeInTheDocument();
    expect(api.calls[0]?.body).toMatchObject({
      title: 'Chemistry final',
      endDateTime: null,
      status: 'pending',
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deletes a reminder after confirmation', async () => {
    const api = await renderReminders([upcoming()]);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Actions for Chemistry prep' }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Reminder deleted')).toBeInTheDocument();
    expect(api.calls[0]?.method).toBe('DELETE');
    expect(
      await screen.findByText('No reminders yet. Set one above to schedule a study session!'),
    ).toBeInTheDocument();
  });
});
