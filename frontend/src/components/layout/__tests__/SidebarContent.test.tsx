import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { fail, makeUser, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { ADMIN_NAV, STUDENT_NAV } from '../nav-items';
import { SidebarContent } from '../SidebarContent';

import type { UserRole } from '@/types';

const renderAdminMenu = async (role: UserRole): Promise<HTMLElement> => {
  server.use(signedInAs(makeUser(role)));
  renderWithProviders(<SidebarContent navItems={ADMIN_NAV} collapsed={false} />);
  await screen.findByText(`Test ${role}`);
  return screen.getByRole('navigation', { name: 'Main menu' });
};

describe('SidebarContent', () => {
  it('shows a Super Admin every admin item, including Dashboard and Performance', async () => {
    const menu = await renderAdminMenu('Super Admin');

    for (const label of ['Dashboard', 'Courses', 'User List', 'Performance']) {
      expect(within(menu).getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(within(menu).getByText('Analytics')).toBeInTheDocument();
  });

  it('hides the Super Admin and manager items from a Moderator', async () => {
    const menu = await renderAdminMenu('Moderator');

    expect(within(menu).getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    for (const label of ['Dashboard', 'Teachers', 'User List', 'Subscriptions', 'Performance']) {
      expect(within(menu).queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });

  it('shows an Admin the manager items but not the Super Admin ones', async () => {
    const menu = await renderAdminMenu('Admin');

    expect(within(menu).getByRole('link', { name: 'User List' })).toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Performance' })).not.toBeInTheDocument();
  });

  it('marks the current page (and its sub-pages) as active', async () => {
    setLocation('/student/courses/abc');
    server.use(signedInAs(makeUser('Student')));
    renderWithProviders(<SidebarContent navItems={STUDENT_NAV} collapsed={false} />);

    const link = await screen.findByRole('link', { name: 'My Courses' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('shows the signed-in user and their translated role', async () => {
    server.use(signedInAs(makeUser('Teacher', { name: 'Karim' })));
    renderWithProviders(<SidebarContent navItems={STUDENT_NAV} collapsed={false} />);

    expect(await screen.findByText('Karim')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
  });

  it('signs out: calls the backend, then marks the user signed out', async () => {
    let loggedOut = false;
    server.use(
      signedInAs(makeUser('Student')),
      http.post('*/api/auth/logout', () => {
        loggedOut = true;
        return HttpResponse.json({ success: true, message: 'Logged out successfully' });
      }),
    );
    const { queryClient } = renderWithProviders(
      <SidebarContent navItems={STUDENT_NAV} collapsed={false} />,
    );
    await screen.findByText('Test Student');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.me)).toBeNull();
    });
    expect(loggedOut).toBe(true);
    expect(await screen.findByText('Logged out successfully')).toBeInTheDocument();
  });

  it('keeps the user signed in and says so when sign-out fails', async () => {
    const student = makeUser('Student');
    server.use(
      signedInAs(student),
      http.post('*/api/auth/logout', () => fail(500, 'Internal Server Error')),
    );
    const { queryClient } = renderWithProviders(
      <SidebarContent navItems={STUDENT_NAV} collapsed={false} />,
    );
    await screen.findByText('Test Student');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Logout' }));

    expect(
      await screen.findByText('Could not sign out. Check your connection and try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeEnabled();
    expect(queryClient.getQueryData(queryKeys.auth.me)).toEqual(student);
  });

  it('shows only icons with labels for screen readers when collapsed', async () => {
    server.use(signedInAs(makeUser('Super Admin')));
    renderWithProviders(<SidebarContent navItems={ADMIN_NAV} collapsed />);

    expect(await screen.findByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });
});
