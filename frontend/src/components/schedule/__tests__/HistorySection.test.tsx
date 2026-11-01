import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import i18n from '@/i18n/i18n';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { SchedulePage } from '../SchedulePage';

import { makeSchedule, scheduleApi } from './fixtures';

import type { Schedule } from '@/schemas/schedule.schema';

vi.mock('../alarm', () => ({
  playAlarm: vi.fn(),
  showSystemNotification: vi.fn(),
  requestNotificationPermission: vi.fn(),
}));

const renderHistory = async (items: Schedule[]) => {
  const api = scheduleApi(items);
  server.use(...api.handlers);
  renderWithProviders(
    <ConfirmProvider>
      <SchedulePage />
    </ConfirmProvider>,
  );
  await userEvent.click(screen.getByRole('tab', { name: 'History' }));
  return api;
};

const DONE_TIMER = makeSchedule({
  title: 'Done maths',
  status: 'completed',
  duration: 3900,
  completedAt: '2026-10-30T10:00:00.000Z',
});
const DONE_REMINDER = makeSchedule({
  type: 'reminder',
  title: 'Done exam prep',
  status: 'completed',
  duration: null,
  startDateTime: '2026-10-30T08:00:00.000Z',
  firedAt: '2026-10-30T08:00:00.000Z',
  completedAt: '2026-10-30T08:45:00.000Z',
});

describe('Study schedule: history', () => {
  it('shows the empty state when nothing is completed', async () => {
    await renderHistory([makeSchedule({ status: 'active' })]);
    expect(
      await screen.findByText('No completed sessions yet. Your history will appear here.'),
    ).toBeInTheDocument();
  });

  it('filters by type and shows totals', async () => {
    await renderHistory([DONE_TIMER, DONE_REMINDER, makeSchedule({ status: 'cancelled' })]);
    expect(await screen.findByRole('tab', { name: 'Timers (1)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Done maths')).toBeInTheDocument();
    expect(screen.getByText('01:05:00')).toBeInTheDocument();
    expect(screen.getByText('1h 5m')).toBeInTheDocument();
    expect(screen.queryByText('Done exam prep')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Reminders (1)' }));
    expect(await screen.findByText('Done exam prep')).toBeInTheDocument();
    expect(screen.getByText('00:45:00')).toBeInTheDocument();
    expect(screen.getByText('Total studied:')).toBeInTheDocument();
  });

  it('deletes an item from the history after confirmation', async () => {
    const api = await renderHistory([DONE_TIMER]);
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Done maths' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete from history' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Removed from history')).toBeInTheDocument();
    expect(api.calls).toEqual([{ method: 'DELETE', id: DONE_TIMER._id }]);
  });

  it('is translated into Bangla', async () => {
    await i18n.changeLanguage('bn');
    const api = scheduleApi([DONE_TIMER]);
    server.use(...api.handlers);
    renderWithProviders(
      <ConfirmProvider>
        <SchedulePage />
      </ConfirmProvider>,
    );
    expect(screen.getByRole('heading', { name: 'পড়ার সময়সূচি' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'ইতিহাস' }));
    expect(await screen.findByRole('tab', { name: 'টাইমার (1)' })).toBeInTheDocument();
  });
});
