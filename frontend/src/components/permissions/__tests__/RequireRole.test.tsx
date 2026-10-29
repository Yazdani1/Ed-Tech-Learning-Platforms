import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { fail, makeUser, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { ADMIN_AREA_ROLES, SUPER_ADMIN_ROLES } from '@/utils/roles';

import { RequireRole } from '../RequireRole';

describe('RequireRole', () => {
  it('shows the page to an allowed role', async () => {
    server.use(signedInAs(makeUser('Moderator')));
    renderWithProviders(<RequireRole roles={ADMIN_AREA_ROLES}>admin page</RequireRole>);

    expect(await screen.findByText('admin page')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to sign in, keeping the page and its query string', async () => {
    setLocation('/admin/courses');
    window.history.replaceState(null, '', '/admin/courses?page=3');
    renderWithProviders(<RequireRole roles={ADMIN_AREA_ROLES}>admin page</RequireRole>);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(
        `/auth/login?next=${encodeURIComponent('/admin/courses?page=3')}`,
      );
    });
    expect(screen.queryByText('admin page')).not.toBeInTheDocument();
  });

  it('sends another role to its own home page', async () => {
    server.use(signedInAs(makeUser('Student')));
    renderWithProviders(<RequireRole roles={ADMIN_AREA_ROLES}>admin page</RequireRole>);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/student/dashboard');
    });
  });

  it('uses the fallback page when given (Admin on the Super Admin dashboard)', async () => {
    server.use(signedInAs(makeUser('Admin')));
    renderWithProviders(
      <RequireRole roles={SUPER_ADMIN_ROLES} fallbackPath="/admin/courses">
        dashboard
      </RequireRole>,
    );

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
  });

  it('after sign-out goes to /auth/login WITHOUT ?next= (the next person must not land here)', async () => {
    setLocation('/student/dashboard');
    server.use(signedInAs(makeUser('Student')));
    const { queryClient } = renderWithProviders(
      <RequireRole roles={['Student']}>student page</RequireRole>,
    );
    await screen.findByText('student page');

    act(() => {
      queryClient.setQueryData(queryKeys.auth.me, null);
    });

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('shows an error with "Try again" when the sign-in check itself fails (not a 401)', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/auth/me', () => {
        calls += 1;
        return fail(500, 'Internal Server Error');
      }),
    );
    renderWithProviders(<RequireRole roles={ADMIN_AREA_ROLES}>admin page</RequireRole>);

    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(router.replace).not.toHaveBeenCalled();
    await userEvent.setup().click(retry);
    await waitFor(() => {
      expect(calls).toBe(2);
    });
  });
});
