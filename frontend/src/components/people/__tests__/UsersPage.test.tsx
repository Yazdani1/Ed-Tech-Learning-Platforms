import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

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
    expect(screen.queryByRole('menuitem', { name: 'Change Role' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Block' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'History' })).toBeInTheDocument();
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

  it('shows the student number under a student name and in the details; staff have none', async () => {
    const numbered = makeManagedUser('0104', 'Numbered Student', 'Student', {
      studentNumber: '123-456-789',
    });
    server.use(usersHandler([numbered, OTHER_ADMIN]));
    renderPage('Super Admin');

    expect(await screen.findByText('No. 123-456-789')).toBeInTheDocument();
    expect(screen.getAllByText(/^No. /)).toHaveLength(1);
    expect(
      screen.getByPlaceholderText('Search name, email or student number...'),
    ).toBeInTheDocument();

    await openMenu('Numbered Student');
    await user().click(await screen.findByRole('menuitem', { name: 'View Details' }));
    const dialog = await screen.findByRole('dialog', { name: 'User Details' });
    expect(within(dialog).getByText('Student number')).toBeInTheDocument();
    expect(within(dialog).getByText('123-456-789')).toBeInTheDocument();
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
      phone: '',
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
    await user().type(within(dialog).getByLabelText('Phone number (optional)'), '01711 000111');
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('User updated')).toBeInTheDocument();
    expect(body).toEqual({
      name: 'Asha R',
      email: ASHA.email,
      phone: '01711 000111',
      role: 'Student',
    });
  });

  it('blocks a user with a reason, and shows Blocked in the list', async () => {
    let body: unknown;
    server.use(
      usersHandler([ASHA]),
      http.patch('*/api/users/:id/block', async ({ request }) => {
        body = await request.json();
        return ok({ ...ASHA, isBlocked: true, blockReason: 'Spam' });
      }),
    );
    renderPage('Admin');

    expect(await screen.findByText('Active')).toBeInTheDocument();
    await openMenu('Asha Rahman');
    await user().click(await screen.findByRole('menuitem', { name: 'Block' }));
    const dialog = await screen.findByRole('dialog', { name: 'Block Asha Rahman?' });
    await user().type(within(dialog).getByLabelText(/Reason/), 'Spam');
    await user().click(within(dialog).getByRole('button', { name: 'Block' }));

    expect(await screen.findByText('Asha Rahman blocked')).toBeInTheDocument();
    expect(body).toEqual({ blocked: true, reason: 'Spam' });
  });

  it('unblocks a blocked user and shows the backend refusal', async () => {
    const blocked = { ...ASHA, isBlocked: true, blockReason: 'Spam' };
    server.use(
      usersHandler([blocked]),
      http.patch('*/api/users/:id/block', () => fail(403, 'Not allowed')),
    );
    renderPage('Super Admin');

    expect(await screen.findByText('Blocked')).toBeInTheDocument();
    await openMenu('Asha Rahman');
    await user().click(await screen.findByRole('menuitem', { name: 'Unblock' }));
    const dialog = await screen.findByRole('dialog', { name: 'Unblock Asha Rahman?' });
    expect(within(dialog).getByText('Blocked because: Spam')).toBeInTheDocument();
    await user().click(within(dialog).getByRole('button', { name: 'Unblock' }));
    expect(await within(dialog).findByText('Not allowed')).toBeInTheDocument();
  });

  it('shows the role and block history with who did it', async () => {
    server.use(
      usersHandler([ASHA]),
      http.get('*/api/users/:id/history', () =>
        ok([
          {
            _id: 'a1',
            action: 'user.role',
            actor: { _id: 'x', name: 'Big Boss', role: 'Super Admin' },
            before: { role: 'Student' },
            after: { role: 'Teacher' },
            createdAt: '2026-11-01T10:00:00.000Z',
          },
          {
            _id: 'a2',
            action: 'user.block',
            actor: { _id: 'x', name: 'Big Boss', role: 'Super Admin' },
            note: 'Spam',
            createdAt: '2026-11-02T10:00:00.000Z',
          },
        ]),
      ),
    );
    renderPage('Admin');

    await openMenu('Asha Rahman');
    await user().click(await screen.findByRole('menuitem', { name: 'History' }));
    const dialog = await screen.findByRole('dialog', { name: 'History of Asha Rahman' });
    expect(
      await within(dialog).findByText('Role changed from Student to Teacher'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Account blocked')).toBeInTheDocument();
    expect(within(dialog).getByText('Spam')).toBeInTheDocument();
  });

  it('exports the ticked users as a CSV', async () => {
    let csv = '';
    const createObjectURL = (blob: Blob) => {
      void blob.text().then((text) => {
        csv = text;
      });
      return 'blob:csv';
    };
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    server.use(usersHandler([ASHA, BOSS]));
    renderPage('Super Admin');

    await user().click(await screen.findByRole('checkbox', { name: 'Select Asha Rahman' }));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Export CSV' }));
    const dialog = await screen.findByRole('dialog', { name: 'Export CSV' });
    await user().click(within(dialog).getByRole('button', { name: 'Download CSV' }));

    await waitFor(() => {
      expect(csv).toContain('Asha Rahman');
    });
    expect(csv).toContain('Name,Email,Role,Student ID,Phone,Status,Joined');
    expect(csv).not.toContain('Big Boss');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
