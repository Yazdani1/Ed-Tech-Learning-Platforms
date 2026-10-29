import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { fail, makeUser, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { RegisterForm } from '../RegisterForm';

const fill = async (name: string, email: string, password: string): Promise<void> => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Full Name'), name);
  await user.type(screen.getByLabelText('Email Address'), email);
  await user.type(screen.getByLabelText('Password', { selector: 'input' }), password);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
};

describe('RegisterForm', () => {
  it('requires a password of at least 6 characters (same rule as the backend)', async () => {
    renderWithProviders(<RegisterForm />);

    await fill('Rahim', 'rahim@example.com', '12345');

    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('shows the backend message when the email is taken', async () => {
    server.use(http.post('*/api/auth/register', () => fail(400, 'Email is already registered')));
    renderWithProviders(<RegisterForm />);

    await fill('Rahim', 'rahim@example.com', 'secret1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is already registered');
  });

  it('creates the account and signs the new student in', async () => {
    let body: unknown;
    const student = makeUser('Student', { name: 'Rahim', email: 'rahim@example.com' });
    server.use(
      http.post('*/api/auth/register', async ({ request }) => {
        body = await request.json();
        return ok(student);
      }),
    );
    const { queryClient } = renderWithProviders(<RegisterForm />);

    await fill(' Rahim ', 'rahim@example.com', 'secret1');

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.auth.me)).toEqual(student);
    });
    // The client never sends a role: the backend always creates a Student
    expect(body).toEqual({ name: 'Rahim', email: 'rahim@example.com', password: 'secret1' });
  });
});
