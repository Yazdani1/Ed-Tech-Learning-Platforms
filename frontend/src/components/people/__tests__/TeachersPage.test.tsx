import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { TeachersPage } from '../teachers/TeachersPage';

import { makeManagedUser, makeTeacher, objectId, usersHandler } from './people-fixtures';

import type { UserRole } from '@/types';

const ACCOUNT = makeManagedUser('0201', 'Rina Akter', 'Teacher');
const FREE_ACCOUNT = makeManagedUser('0202', 'Karim Uddin', 'Teacher');
const RINA = makeTeacher('0301', 'Rina Akter', {
  userId: ACCOUNT._id,
  socialLinks: { linkedin: 'https://linkedin.com/in/rina', website: 'javascript:alert(1)' },
});
const SAMI = makeTeacher('0302', 'Sami Hasan');
const COURSE = {
  _id: objectId('0401'),
  title: 'Algebra 101',
  status: 'Published',
  visibility: 'Public',
  pricing: 'Free',
  teachers: [{ _id: RINA._id, name: RINA.name }],
  category: { _id: objectId('0501'), name: 'Maths' },
  courseType: { _id: objectId('0502'), name: 'Live' },
  enrollmentStats: { totalEnrollments: 4 },
};

const renderPage = (role: UserRole = 'Admin', teachers = [RINA, SAMI]) => {
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/teachers', () => ok(teachers)),
    http.get('*/api/courses', () => ok([COURSE])),
    usersHandler([ACCOUNT, FREE_ACCOUNT]),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <TeachersPage />
    </ConfirmProvider>,
  );
};

const user = () => userEvent.setup();

describe('TeachersPage', () => {
  it('shows each teacher with course count and linked account', async () => {
    renderPage();

    const rina = await screen.findByRole('article', { name: 'Rina Akter' });
    expect(await within(rina).findByText('1 course teaching')).toBeInTheDocument();
    expect(within(rina).getByText(ACCOUNT.email)).toBeInTheDocument();
    const sami = screen.getByRole('article', { name: 'Sami Hasan' });
    expect(within(sami).getByText('0 courses teaching')).toBeInTheDocument();
    expect(within(sami).getByText('Not linked')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    renderPage('Admin', []);
    expect(await screen.findByText('No teachers yet.')).toBeInTheDocument();
  });

  it('shows the list error with a retry button', async () => {
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/teachers', () => fail(500, 'Teachers failed')),
      http.get('*/api/courses', () => ok([])),
      usersHandler([]),
    );
    renderWithProviders(
      <ConfirmProvider>
        <TeachersPage />
      </ConfirmProvider>,
    );
    expect(await screen.findByText('Teachers failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('opens the details with assigned courses and only safe social links', async () => {
    renderPage();

    await user().click(await screen.findByRole('button', { name: 'Actions for Rina Akter' }));
    await user().click(await screen.findByRole('menuitem', { name: 'View details' }));
    const dialog = await screen.findByRole('dialog', { name: 'Teacher details' });
    expect(await within(dialog).findByText('Algebra 101')).toBeInTheDocument();
    expect(within(dialog).getByText('4 students')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'View Course' })).toHaveAttribute(
      'href',
      `/admin/courses/${COURSE._id}/learn`,
    );
    expect(within(dialog).getByRole('link', { name: 'linkedin' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/rina',
    );
    expect(within(dialog).queryByRole('link', { name: 'website' })).not.toBeInTheDocument();
  });

  it('adds a teacher as multipart, offering only unlinked Teacher accounts', async () => {
    let form: FormData | undefined;
    server.use(
      http.post('*/api/teachers', async ({ request }) => {
        form = await request.formData();
        return ok(makeTeacher('0303', 'Karim Uddin'));
      }),
    );
    renderPage();

    await user().click(await screen.findByRole('button', { name: 'Add Teacher' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Teacher' });
    await user().click(within(dialog).getByRole('combobox'));
    expect(screen.queryByRole('option', { name: /Rina Akter/ })).not.toBeInTheDocument();
    await user().click(screen.getByRole('option', { name: /Karim Uddin/ }));
    expect(within(dialog).getByLabelText(/Name/)).toHaveValue('Karim Uddin');
    await user().type(within(dialog).getByLabelText(/Bio/), 'Physics teacher');
    await user().type(within(dialog).getByLabelText(/Expertise/), 'Physics, Chemistry');
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Teacher created')).toBeInTheDocument();
    expect(form?.get('name')).toBe('Karim Uddin');
    expect(form?.get('bio')).toBe('Physics teacher');
    expect(form?.get('expertise')).toBe('Physics, Chemistry');
    expect(form?.get('userId')).toBe(FREE_ACCOUNT._id);
    expect(form?.get('profileImage')).toBeNull();
  });

  it('refuses invalid social links JSON before sending', async () => {
    let called = false;
    server.use(
      http.put('*/api/teachers/:id', () => {
        called = true;
        return ok(SAMI);
      }),
    );
    renderPage();

    await user().click(await screen.findByRole('button', { name: 'Actions for Sami Hasan' }));
    await user().click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Teacher' });
    await user().type(within(dialog).getByLabelText(/Social Links/), 'not json');
    await user().click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await within(dialog).findByText(/Social links must be a JSON object/),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('deletes a teacher after confirmation', async () => {
    let deleted = '';
    server.use(
      http.delete('*/api/teachers/:id', ({ params }) => {
        deleted = String(params.id);
        return ok(undefined);
      }),
    );
    renderPage();

    await user().click(await screen.findByRole('button', { name: 'Actions for Sami Hasan' }));
    await user().click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user().click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByText('Teacher deleted')).toBeInTheDocument();
    expect(deleted).toBe(SAMI._id);
  });

  it('sends a Moderator away', async () => {
    renderPage('Moderator');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
  });
});
