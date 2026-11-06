import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeUser, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { TopBar } from '../TopBar';
import { TopBarUser } from '../TopBarUser';

describe('TopBarUser', () => {
  it('shows a student their name and student ID', async () => {
    server.use(signedInAs(makeUser('Student', { name: 'Asha', studentNumber: '123-456-789' })));
    renderWithProviders(<TopBarUser />);

    expect(await screen.findByText('Asha')).toBeInTheDocument();
    expect(screen.getByText('Student ID: 123-456-789')).toBeInTheDocument();
    expect(screen.queryByText('Student')).not.toBeInTheDocument();
  });

  it('shows no second line for a student without a number', async () => {
    server.use(signedInAs(makeUser('Student', { name: 'Asha' })));
    renderWithProviders(<TopBarUser />);

    expect(await screen.findByText('Asha')).toBeInTheDocument();
    expect(screen.queryByText(/Student ID/)).not.toBeInTheDocument();
  });

  it.each(['Super Admin', 'Admin', 'Moderator', 'Teacher'] as const)(
    'shows the role of a %s',
    async (role) => {
      server.use(signedInAs(makeUser(role, { name: 'Rahim' })));
      renderWithProviders(<TopBarUser />);

      expect(await screen.findByText('Rahim')).toBeInTheDocument();
      expect(screen.getByText(role)).toBeInTheDocument();
    },
  );

  it('shows nothing while nobody is signed in', () => {
    renderWithProviders(<TopBarUser />);
    expect(screen.queryByTestId('top-bar-user')).not.toBeInTheDocument();
  });
});

describe('TopBar', () => {
  it('has the menu button and the signed-in user', async () => {
    server.use(signedInAs(makeUser('Teacher', { name: 'Rahim' })));
    const onOpenMenu = vi.fn();
    renderWithProviders(<TopBar onOpenMenu={onOpenMenu} />);

    expect(await screen.findByText('Rahim')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Open menu' }));
    expect(onOpenMenu).toHaveBeenCalled();
  });
});
