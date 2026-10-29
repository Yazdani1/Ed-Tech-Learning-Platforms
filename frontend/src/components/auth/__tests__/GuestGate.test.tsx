import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeUser, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { GuestGate } from '../GuestGate';

describe('GuestGate', () => {
  it('shows the sign-in form to visitors who are not signed in', async () => {
    renderWithProviders(<GuestGate>sign-in form</GuestGate>);

    expect(await screen.findByText('sign-in form')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sends a signed-in user to their role home', async () => {
    server.use(signedInAs(makeUser('Teacher')));
    renderWithProviders(<GuestGate>sign-in form</GuestGate>);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/teacher/courses');
    });
    expect(screen.queryByText('sign-in form')).not.toBeInTheDocument();
  });

  it('follows a safe ?next= page the role may open', async () => {
    setLocation('/auth/login', '?next=%2Fadmin%2Fusers%3Fpage%3D2');
    server.use(signedInAs(makeUser('Admin')));
    renderWithProviders(<GuestGate>sign-in form</GuestGate>);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/users?page=2');
    });
  });

  it('ignores an external ?next= (open redirect) and goes home instead', async () => {
    setLocation('/auth/login', '?next=%2F%09%2Fevil.example');
    server.use(signedInAs(makeUser('Super Admin')));
    renderWithProviders(<GuestGate>sign-in form</GuestGate>);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});
