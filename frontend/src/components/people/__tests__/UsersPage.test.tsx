import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { UsersPage } from '../users/UsersPage';

import { makeManagedUser, usersEnvelope, usersHandler } from './people-fixtures';

import type { UserRole } from '@/types';

const ASHA = makeManagedUser('0101', 'Asha Rahman', 'Student', {
  enrollmentSummary: { free: 1, paid: 2, subscription: 0, total: 3 },
  spendingSummary: { paidCourses: 1500, subscriptions: 0, total: 1500 },
});
const BOSS = makeManagedUser('0102', 'Big Boss', 'Super Admin');
const OTHER_ADMIN = makeManagedUser('0103', 'Other Admin', 'Admin');

const renderPage = (role: UserRole = 'Admin') => {
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/subscription-plans', () => ok([])),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <UsersPage />
    </ConfirmProvider>,
  );
};

const user = () => userEvent.setup();

const openMenu = async (name: string): Promise<void> => {
  await user().click(await screen.findByRole('button', { name: `Actions for ${name}` }));
};

describe('UsersPage', () => {
  it('lists users with counts; an Admin cannot manage Admin or Super Admin accounts', async () => {
    server.use(usersHandler([ASHA, BOSS, OTHER_ADMIN], 42));
    renderPage('Admin');

    expect(await screen.findByRole('heading', { name: 'User List' })).toBeInTheDocument();
    expect(await screen.findByText('Asha Rahman')).toBeInTheDocument();
    expect(screen.getByText('3 of 42 users available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Big Boss' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Other Admin' }),
    ).not.toBeInTheDocument();

    await openMenu('Asha Rahman');
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Change Role' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'View Details' })).not.toBeInTheDocument();
  });

  it('shows the empty and error states', async () => {
    server.use(usersHandler([]));
    const { unmount } = renderPage();
    expect(await screen.findByText('No users yet.')).toBeInTheDocument();
    unmount();

    server.use(http.get('*/api/users', () => fail(500, 'Database down')));
    renderPage();
    expect(await screen.findByText('Database down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('sends the URL filters; Super Admin-only filters are not sent for an Admin', async () => {
    const urls: string[] = [];
    server.use(
      http.get('*/api/users', ({ request }) => {
        urls.push(request.url);
        return ok([ASHA], usersEnvelope([ASHA]));
      }),
    );
    setLocation('/admin/users', '?role=Student&search=asha&subscriptionStatus=active');
    renderPage('Admin');

    expect(await screen.findByText('Asha Rahman')).toBeInTheDocument();
    const params = new URL(urls[0] ?? '').searchParams;
    expect(params.get('role')).toBe('Student');
    expect(params.get('search')).toBe('asha');
    expect(params.get('subscriptionStatus')).toBeNull();
    expect(screen.getByText('1 of 1 users matches your filters')).toBeInTheDocument();
  });

  it('a Super Admin sees the advanced filters and the user details', async () => {
    server.use(usersHandler([ASHA]));
    renderPage('Super Admin');

    expect(await screen.findByText('Asha Rahman')).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Show filters' }));
    expect(await screen.findByLabelText('Enrollment Activity')).toBeInTheDocument();

    await openMenu('Asha Rahman');
    await user().click(await screen.findByRole('menuitem', { name: 'View Details' }));
    const dialog = await screen.findByRole('dialog', { name: 'User Details' });
    expect(within(dialog).getByText('Total Enrolled Courses').nextSibling).toHaveTextContent('3');
    expect(within(dialog).getByText('No active subscription')).toBeInTheDocument();
  });

  it('creates a user after checking the password length', async () => {
    let body: unknown;
    server.use(
      usersHandler([]),
      http.post('*/api/users', async ({ request }) => {
        body = await request.json();
        return ok({ ...ASHA, name: 'New Person' });
      }),
    );
    renderPage('Admin');

    await user().click(await screen.findByRole('button', { name: 'Create User' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create User' });
    await user().type(within(dialog).getByLabelText(/Name/), 'New Person');
    await user().type(within(dialog).getByLabelText(/Email/), 'new@example.com');
    await user().type(within(dialog).getByLabelText(/Password/), '123');
    await user().click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(await within(dialog).findByText('Password must be 6-72 characters')).toBeInTheDocument();

    // An Admin can only give Moderator, Teacher or Student
    await user().click(within(dialog).getByRole('combobox'));
    expect(screen.queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument();
    await user().click(screen.getByRole('option', { name: 'Teacher' }));

    await user().clear(within(dialog).getByLabelText(/Password/));
    await user().type(within(dialog).getByLabelText(/Password/), 'secret123');
    await user().click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('User created')).toBeInTheDocument();
    expect(body).toEqual({
      name: 'New Person',
      email: 'new@example.com',
      password: 'secret123',
      role: 'Teacher',
    });
  });

  it('edits a user without sending an empty password', async () => {
    let body: unknown;
    server.use(
      usersHandler([ASHA]),
      http.put('*/api/users/:id', async ({ request }) => {
        body = await request.json();
        return ok(ASHA);
      }),
    );
    renderPage('Admin');

    await openMenu('Asha Rahman');
    await user().click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit User' });
    const name = within(dialog).getByLabelText(/Name/);
    await user().clear(name);
    await user().type(name, 'Asha R');
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('User updated')).toBeInTheDocument();
    expect(body).toEqual({ name: 'Asha R', email: ASHA.email, role: 'Student' });
  });

  it('changes a role and shows the backend refusal', async () => {
    server.use(
      usersHandler([BOSS]),
      http.put('*/api/users/:id/role', () => fail(400, 'At least one Super Admin must remain')),
    );
    renderPage('Super Admin');

    await openMenu('Big Boss');
    await user().click(await screen.findByRole('menuitem', { name: 'Change Role' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change Role' });
    await user().click(within(dialog).getByRole('combobox'));
    await user().click(screen.getByRole('option', { name: 'Admin' }));
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await within(dialog).findByText('At least one Super Admin must remain'),
    ).toBeInTheDocument();
  });

  it('a Super Admin deletes a user after confirmation', async () => {
    let deleted = '';
    server.use(
      usersHandler([ASHA]),
      http.delete('*/api/users/:id', ({ params }) => {
        deleted = String(params.id);
        return ok(undefined);
      }),
    );
    renderPage('Super Admin');

    await openMenu('Asha Rahman');
    await user().click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user().click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByText('User deleted')).toBeInTheDocument();
    expect(deleted).toBe(ASHA._id);
  });

  it('sends a Moderator away', async () => {
    server.use(usersHandler([ASHA]));
    renderPage('Moderator');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
  });
});
