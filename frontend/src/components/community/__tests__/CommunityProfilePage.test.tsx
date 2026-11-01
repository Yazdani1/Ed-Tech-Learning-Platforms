import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CommunityProfilePage } from '../profile/CommunityProfilePage';

import { makePublicProfile } from './fixtures';

const student = makeUser('Student');
const PROFILE = `*/api/community/users/${student._id}`;

describe('CommunityProfilePage', () => {
  it('shows a public profile: stats, discussions, answers and badges', async () => {
    server.use(http.get(PROFILE, () => ok(makePublicProfile('Student'))));
    renderWithProviders(<CommunityProfilePage userId={student._id} />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Test Student' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Reactions given')).toBeInTheDocument();
    const discussions = screen.getByRole('region', { name: 'Discussions' });
    expect(within(discussions).getByRole('link', { name: 'How do loops work?' })).toHaveAttribute(
      'href',
      '/community-hub/p1',
    );
    const answers = screen.getByRole('region', { name: 'Answers and Replies' });
    expect(within(answers).getByText('My answer text')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Badges' })).getByText('Helper'),
    ).toBeInTheDocument();
    // Not your profile: no privacy switch
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('shows only the notice for a private profile', async () => {
    server.use(
      http.get(PROFILE, () =>
        ok({
          isPrivate: true,
          user: {
            _id: student._id,
            name: 'Test Student',
            role: 'Student',
            isCommunityProfilePrivate: true,
          },
        }),
      ),
    );
    renderWithProviders(<CommunityProfilePage userId={student._id} />);
    expect(await screen.findByText('This profile is private.')).toBeInTheDocument();
    expect(screen.queryByText('Reactions given')).not.toBeInTheDocument();
  });

  it('says when the member does not exist', async () => {
    server.use(http.get(PROFILE, () => fail(404, 'User not found')));
    renderWithProviders(<CommunityProfilePage userId={student._id} />);
    expect(await screen.findByText('Profile not found')).toBeInTheDocument();
  });

  it('lets you make your own profile private', async () => {
    const sent = vi.fn();
    server.use(
      signedInAs(student),
      http.get(PROFILE, () => ok(makePublicProfile('Student'))),
      http.put('*/api/auth/me', async ({ request }) => {
        sent(Object.fromEntries((await request.formData()).entries()));
        return ok({ ...student, isCommunityProfilePrivate: true });
      }),
    );
    renderWithProviders(<CommunityProfilePage userId={student._id} />);

    await userEvent
      .setup()
      .click(await screen.findByRole('switch', { name: 'Make community profile private' }));
    expect(await screen.findByText('Community profile is private')).toBeInTheDocument();
    expect(sent).toHaveBeenCalledWith({ isCommunityProfilePrivate: 'true' });
  });
});
