import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { playAlarm } from '../alarm';
import { SchedulePage } from '../SchedulePage';

import { makeSchedule, scheduleApi } from './fixtures';

import type { Schedule } from '@/schemas/schedule.schema';

vi.mock('../alarm', () => ({
  playAlarm: vi.fn(),
  showSystemNotification: vi.fn(),
  requestNotificationPermission: vi.fn(),
}));

const secondsAgo = (seconds: number): string => new Date(Date.now() - seconds * 1000).toISOString();

const renderPage = (items: Schedule[], options: { failList?: boolean } = {}) => {
  const api = scheduleApi(items, options);
  server.use(...api.handlers);
  renderWithProviders(
    <ConfirmProvider>
      <SchedulePage />
    </ConfirmProvider>,
  );
  return api;
};

const timerCard = (title: string): Promise<HTMLElement> =>
  screen.findByRole('article', { name: title });

describe('Study schedule: timers', () => {
  beforeEach(() => {
    vi.mocked(playAlarm).mockClear();
  });

  it('shows the empty state when there are no open timers', async () => {
    renderPage([makeSchedule({ status: 'completed', title: 'Old' })]);
    expect(
      await screen.findByText('No active timers. Create one to get started!'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Study Schedule' })).toBeInTheDocument();
  });

  it('shows the server error with a retry button', async () => {
    renderPage([], { failList: true });
    expect(await screen.findByText('Could not load your schedule')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('lists active and paused timers with the time left computed from the saved timestamps', async () => {
    renderPage([
      makeSchedule({ title: 'Paused maths', status: 'paused', duration: 600, elapsedSeconds: 90 }),
      makeSchedule({ title: 'Cancelled', status: 'cancelled' }),
    ]);
    const card = await timerCard('Paused maths');
    expect(within(card).getByRole('timer', { name: 'Time left' })).toHaveTextContent('00:08:30');
    expect(within(card).getByText('PAUSED')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Cancelled' })).not.toBeInTheDocument();
    expect(screen.getByText('1 timer · 10m 0s total')).toBeInTheDocument();
  });

  it('pause saves the elapsed seconds (at least what had run)', async () => {
    const api = renderPage([
      makeSchedule({
        title: 'Physics',
        status: 'active',
        duration: 1500,
        elapsedSeconds: 100,
        updatedAt: secondsAgo(60),
      }),
    ]);
    const card = await timerCard('Physics');
    expect(within(card).getByText('RUNNING')).toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button', { name: 'Pause' }));
    await waitFor(() => {
      expect(api.calls).toHaveLength(1);
    });
    const body = api.calls[0]?.body as { status: string; elapsedSeconds: number };
    expect(body.status).toBe('paused');
    expect(body.elapsedSeconds).toBeGreaterThanOrEqual(160);
    expect(body.elapsedSeconds).toBeLessThan(200);
    expect(await within(card).findByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('resume, reset and stop send the right status', async () => {
    const api = renderPage([
      makeSchedule({ title: 'Chemistry', status: 'paused', duration: 600, elapsedSeconds: 30 }),
    ]);
    const card = await timerCard('Chemistry');
    await userEvent.click(within(card).getByRole('button', { name: 'Reset' }));
    await waitFor(() => {
      expect(api.calls[0]?.body).toEqual({ status: 'paused', elapsedSeconds: 0 });
    });
    await userEvent.click(await within(card).findByRole('button', { name: 'Start' }));
    await waitFor(() => {
      expect(api.calls[1]?.body).toEqual({ status: 'active' });
    });
    await userEvent.click(await within(card).findByRole('button', { name: 'Stop' }));
    expect(await screen.findByText('Timer stopped')).toBeInTheDocument();
    expect(api.calls[2]?.body).toEqual({ status: 'cancelled' });
    expect(
      await screen.findByText('No active timers. Create one to get started!'),
    ).toBeInTheDocument();
  });

  it('a timer that ran out while the page was closed is saved as completed without the alarm', async () => {
    const api = renderPage([
      makeSchedule({
        title: 'Overdue',
        status: 'active',
        duration: 60,
        elapsedSeconds: 0,
        updatedAt: secondsAgo(300),
      }),
    ]);
    await waitFor(() => {
      expect(api.calls[0]?.body).toMatchObject({ status: 'completed', elapsedSeconds: 60 });
    });
    expect(playAlarm).not.toHaveBeenCalled();
  });

  it('creates a timer with the default 25 minutes, and checks the title', async () => {
    const api = renderPage([]);
    await screen.findByText('No active timers. Create one to get started!');
    await userEvent.click(screen.getByRole('button', { name: 'Start Timer' }));
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);

    await userEvent.type(screen.getByLabelText(/^Title/), 'Biology');
    await userEvent.click(screen.getByRole('button', { name: 'Start Timer' }));
    expect(await screen.findByText('Timer started')).toBeInTheDocument();
    expect(api.calls[0]).toEqual({
      method: 'POST timer',
      body: { title: 'Biology', description: '', duration: 1500 },
    });
    expect(await timerCard('Biology')).toBeInTheDocument();
  });

  it('refuses a zero duration; the dial works with the arrow keys', async () => {
    const api = renderPage([]);
    await screen.findByText('No active timers. Create one to get started!');
    await userEvent.type(screen.getByLabelText(/^Title/), 'Quick');
    await userEvent.click(screen.getByRole('button', { name: 'Set minutes: 25' }));
    const dial = screen.getByRole('slider', { name: 'Clock dial: minutes' });
    for (let step = 0; step < 25; step += 1) fireEvent.keyDown(dial, { key: 'ArrowDown' });
    expect(await screen.findByRole('button', { name: 'Set minutes: 0' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start Timer' }));
    expect(await screen.findByText('Duration must be greater than 0.')).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);
  });
});
