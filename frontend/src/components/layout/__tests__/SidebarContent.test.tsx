import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { ADMIN_NAV, STUDENT_NAV } from '../nav-items';
import { SidebarContent } from '../SidebarContent';

import type { UserRole } from '@/types';

const renderAdminMenu = async (role: UserRole): Promise<HTMLElement> => {
  server.use(signedInAs(makeUser(role)));
  const { queryClient } = renderWithProviders(
    <SidebarContent navItems={ADMIN_NAV} collapsed={false} />,
  );
  // Role-gated items appear once the signed-in user has loaded
  await waitFor(() => {
    expect(queryClient.getQueryData(queryKeys.auth.me)).toBeTruthy();
  });
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

  it('groups the admin items under headings, each item under its own group', async () => {
    const menu = await renderAdminMenu('Super Admin');
    const groupOf = (heading: string) => {
      const list = within(menu).getByText(heading).closest('ul');
      if (!list) throw new Error(`no list for ${heading}`);
      return within(list);
    };

    expect(
      groupOf('Course Management').getByRole('link', { name: 'Course Setup' }),
    ).toBeInTheDocument();
    expect(groupOf('Users & Students').getByRole('link', { name: 'Students' })).toBeInTheDocument();
    expect(
      groupOf('Communication').getByRole('link', { name: 'Support Chat' }),
    ).toBeInTheDocument();
    expect(groupOf('Website').getByRole('link', { name: 'Site Pages' })).toBeInTheDocument();
    expect(groupOf('Analytics').getByRole('link', { name: 'Performance' })).toBeInTheDocument();
  });

  it('shows an Admin the manager groups; Analytics holds Revenue but not Performance', async () => {
    const menu = await renderAdminMenu('Admin');
    expect(within(menu).getByText('Users & Students')).toBeInTheDocument();
    expect(within(menu).getByText('Website')).toBeInTheDocument();
    expect(within(menu).getByText('Analytics')).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Revenue' })).toHaveAttribute(
      'href',
      '/admin/revenue',
    );
    expect(within(menu).getByRole('link', { name: 'Promos' })).toHaveAttribute(
      'href',
      '/admin/promos',
    );
    expect(within(menu).getByRole('link', { name: 'Announcements' })).toHaveAttribute(
      'href',
      '/admin/announcements',
    );
    expect(within(menu).queryByRole('link', { name: 'Performance' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Set up VAT' })).not.toBeInTheDocument();
  });

  it('gives a Moderator Announcements but not Revenue or Promos', async () => {
    const menu = await renderAdminMenu('Moderator');
    expect(within(menu).getByRole('link', { name: 'Announcements' })).toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Revenue' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Promos' })).not.toBeInTheDocument();
  });

  it('has no Pricing or Dashboard link in the student menu', async () => {
    server.use(signedInAs(makeUser('Student')));
    renderWithProviders(<SidebarContent navItems={STUDENT_NAV} collapsed={false} />);
    const menu = await screen.findByRole('navigation', { name: 'Main menu' });
    expect(within(menu).getByRole('link', { name: 'My Courses' })).toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Pricing' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('student menus have no group headings', async () => {
    server.use(signedInAs(makeUser('Student')));
    renderWithProviders(<SidebarContent navItems={STUDENT_NAV} collapsed={false} />);
    await screen.findByRole('link', { name: 'My Courses' });
    expect(screen.queryByText('Course Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('leaves out a heading when the role sees none of its items', async () => {
    const menu = await renderAdminMenu('Moderator');
    expect(within(menu).getByText('Course Management')).toBeInTheDocument();
    expect(within(menu).queryByText('Users & Students')).not.toBeInTheDocument();
    expect(within(menu).queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('hides the Super Admin and manager items from a Moderator', async () => {
    const menu = await renderAdminMenu('Moderator');

    expect(within(menu).getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    for (const label of [
      'Dashboard',
      'Teachers',
      'User List',
      'Students',
      'Subscriptions',
      'Performance',
    ]) {
      expect(within(menu).queryByRole('link', { name: label })).not.toBeInTheDocument();
    }
  });

  it('shows an Admin the manager items but not the Super Admin ones', async () => {
    const menu = await renderAdminMenu('Admin');

    expect(within(menu).getByRole('link', { name: 'User List' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Students' })).toHaveAttribute(
      'href',
      '/admin/students',
    );
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

  it('has a red Logout row instead of the user block (name and role are in the top bar)', async () => {
    server.use(signedInAs(makeUser('Teacher', { name: 'Karim' })));
    renderWithProviders(<SidebarContent navItems={STUDENT_NAV} collapsed={false} />);

    expect(await screen.findByRole('button', { name: 'Logout' })).toHaveTextContent('Logout');
    expect(screen.queryByText('Karim')).not.toBeInTheDocument();
  });

  it('orders the student menu Home, My Courses, Profile, Purchases', async () => {
    server.use(signedInAs(makeUser('Student')));
    renderWithProviders(<SidebarContent navItems={STUDENT_NAV} collapsed={false} />);
    const menu = await screen.findByRole('navigation', { name: 'Main menu' });
    const names = within(menu)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(names.slice(0, 4)).toEqual(['Home', 'My Courses', 'Profile', 'Purchases']);
  });

  it('puts the Analytics group first, with Set up VAT for a Super Admin only', async () => {
    const menu = await renderAdminMenu('Super Admin');
    const headings = within(menu)
      .getAllByText(/^(Analytics|Course Management|Users & Students|Communication|Website)$/)
      .map((node) => node.textContent);
    expect(headings[0]).toBe('Analytics');
    expect(within(menu).getByRole('link', { name: 'Set up VAT' })).toHaveAttribute(
      'href',
      '/admin/vat',
    );
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
    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.me)).toBeTruthy();
    });

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
    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.me)).toBeTruthy();
    });

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

  it('puts the unread counts into the accessible names of the menu items', async () => {
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/notifications/unread-count', () => ok({ count: 3 })),
      http.get('*/api/chat/conversations', () =>
        ok([{ _id: 'c1', student: null, unreadByStaff: 2, lastMessage: '' }]),
      ),
    );
    renderWithProviders(<SidebarContent navItems={ADMIN_NAV} collapsed={false} />);
    const menu = await screen.findByRole('navigation', { name: 'Main menu' });
    expect(
      await within(menu).findByRole('link', { name: 'Notifications (3 unread)' }),
    ).toBeInTheDocument();
    expect(
      await within(menu).findByRole('link', { name: 'Support Chat (2 unread)' }),
    ).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Courses' })).toBeInTheDocument();
  });
});
