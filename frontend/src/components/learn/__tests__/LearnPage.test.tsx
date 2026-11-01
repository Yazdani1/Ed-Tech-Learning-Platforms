import { screen } from '@testing-library/react';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { LearnPage } from '../LearnPage';

import { COURSE_ID, contentHandlers } from './fixtures';

const renderPage = () =>
  renderWithProviders(
    <ConfirmProvider>
      <LearnPage courseId={COURSE_ID} area="student" />
    </ConfirmProvider>,
  );

describe('LearnPage support chat', () => {
  beforeEach(() => {
    setLocation(`/student/courses/${COURSE_ID}/learn`);
    server.use(
      ...contentHandlers(),
      http.get('*/api/notifications/unread-count', () => ok({ count: 0 })),
      http.get('*/api/chat/conversations', () =>
        ok({ _id: '64b7f0c2a1b2c3d4e5f67001', student: null, unreadByStudent: 0 }),
      ),
    );
  });

  it('shows students the floating support chat button in the player', async () => {
    server.use(signedInAs(makeUser('Student')));
    renderPage();
    expect(await screen.findByRole('button', { name: 'Open support chat' })).toBeVisible();
    expect(
      await screen.findByRole('heading', { name: 'Physics 101', level: 1 }),
    ).toBeInTheDocument();
  });

  it('hides the button from staff', async () => {
    server.use(signedInAs(makeUser('Admin')));
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'Physics 101', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /support chat/i })).not.toBeInTheDocument();
  });
});
