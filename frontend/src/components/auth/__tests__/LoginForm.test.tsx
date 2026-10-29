import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { fail, makeUser, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { LoginForm } from '../LoginForm';

const fillAndSubmit = async (email: string, password: string): Promise<void> => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email Address'), email);
  await user.type(screen.getByLabelText('Password', { selector: 'input' }), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('LoginForm', () => {
  it('shows the required-field messages and sends nothing when empty', async () => {
    let called = false;
    server.use(
      http.post('*/api/auth/login', () => {
        called = true;
        return ok(makeUser('Student'));
      }),
    );
    renderWithProviders(<LoginForm />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
    expect(called).toBe(false);
  });

  it('rejects an invalid email before calling the server', async () => {
    let called = false;
    server.use(
      http.post('*/api/auth/login', () => {
        called = true;
        return ok(makeUser('Student'));
      }),
    );
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('not-an-email', 'secret');

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('shows the backend message when the credentials are wrong', async () => {
    server.use(http.post('*/api/auth/login', () => fail(401, 'Invalid credentials')));
    renderWithProviders(<LoginForm />);

    await fillAndSubmit('student@example.com', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('signs in: sends the trimmed email and stores the user (never the token)', async () => {
    let body: unknown;
    const student = makeUser('Student');
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, token: 'jwt-in-body', data: student });
      }),
    );
    const { queryClient } = renderWithProviders(<LoginForm />);

    await fillAndSubmit('  student@example.com  ', 'secret');

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.me)).toEqual(student);
    });
    expect(body).toEqual({ email: 'student@example.com', password: 'secret' });
    expect(
      JSON.stringify(
        queryClient
          .getQueryCache()
          .getAll()
          .map((q) => q.state.data),
      ),
    ).not.toContain('jwt-in-body');
  });

  it('links to the register page', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/auth/register',
    );
  });
});
