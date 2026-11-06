import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { AuthDrawer } from '../AuthDrawer';

describe('AuthDrawer', () => {
  it('stays closed without ?auth= in the address', () => {
    setLocation('/courses', '');
    renderWithProviders(<AuthDrawer />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the sign-in form on the right for ?auth=login', async () => {
    setLocation('/courses', '?auth=login');
    renderWithProviders(<AuthDrawer />);

    const panel = await screen.findByRole('dialog', { name: 'Sign In' });
    expect(within(panel).getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(within(panel).getByRole('form', { name: 'Sign in form' })).toBeInTheDocument();
  });

  it('opens the create-account form for ?auth=register', async () => {
    setLocation('/courses', '?auth=register');
    renderWithProviders(<AuthDrawer />);

    const panel = await screen.findByRole('dialog', { name: 'Sign Up' });
    expect(within(panel).getByRole('form', { name: 'Create account form' })).toBeInTheDocument();
  });

  it('ignores an unknown mode', () => {
    setLocation('/', '?auth=admin');
    renderWithProviders(<AuthDrawer />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closing removes the panel parameters and keeps the rest of the address', async () => {
    setLocation('/courses', '?search=react&auth=login&next=%2Fpricing');
    renderWithProviders(<AuthDrawer />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Close' }));

    expect(router.replace).toHaveBeenCalledWith('/courses?search=react', { scroll: false });
  });

  it('switches to the create-account form and keeps the way back', async () => {
    setLocation('/', '?auth=login&next=%2Fpricing');
    window.history.replaceState(null, '', '/?auth=login&next=%2Fpricing');
    renderWithProviders(<AuthDrawer />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Create an account' }));

    expect(router.push).toHaveBeenCalledWith('/?auth=register&next=%2Fpricing', {
      scroll: false,
    });
  });

  it('signs in from the panel and goes to the safe next page', async () => {
    setLocation('/', '?auth=login&next=%2Fstudent%2Fprofile');
    server.use(http.post('*/api/auth/login', () => ok(makeUser('Student'))));
    renderWithProviders(<AuthDrawer />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Email Address'), 'student@example.com');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/student/profile');
    });
  });

  it("goes to the role's home when the next page belongs to another role", async () => {
    setLocation('/', '?auth=login&next=%2Fadmin%2Fcourses');
    server.use(signedInAs(makeUser('Student')));
    renderWithProviders(<AuthDrawer />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/student/courses');
    });
  });

  it('goes to the role home when there is no next page', async () => {
    setLocation('/', '?auth=login');
    server.use(signedInAs(makeUser('Admin')));
    renderWithProviders(<AuthDrawer />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
  });

  it('never follows an unsafe next address', async () => {
    setLocation('/', '?auth=login&next=https%3A%2F%2Fevil.example');
    server.use(signedInAs(makeUser('Teacher')));
    renderWithProviders(<AuthDrawer />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/teacher/courses');
    });
  });

  it('does nothing for a signed-in user on a page without ?auth=', async () => {
    setLocation('/courses', '');
    server.use(signedInAs(makeUser('Student')));
    const { queryClient } = renderWithProviders(<AuthDrawer />);

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.me)).toBeTruthy();
    });
    expect(router.replace).not.toHaveBeenCalled();
  });
});
