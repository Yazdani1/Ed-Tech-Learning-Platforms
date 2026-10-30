import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/api/query-keys';
import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { EditProfileModal } from '../EditProfileModal';

import { makeProfile } from './fixtures';

import type { Profile } from '@/schemas/profile.schema';

type Sent = Record<string, string | File>;

/** PUT /api/auth/me: records the multipart fields and answers with the updated profile. */
const captureUpdate = (updated: Profile): { sent: Sent | null } => {
  const capture: { sent: Sent | null } = { sent: null };
  server.use(
    http.put('*/api/auth/me', async ({ request }) => {
      const body = await request.formData();
      capture.sent = Object.fromEntries(body.entries());
      return ok(updated);
    }),
  );
  return capture;
};

const renderModal = (profile: Profile) => {
  let closed = false;
  const result = renderWithProviders(
    <EditProfileModal
      profile={profile}
      onClose={() => {
        closed = true;
      }}
    />,
  );
  return { ...result, isClosed: () => closed };
};

const save = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));
};

describe('EditProfileModal', () => {
  beforeAll(() => {
    // jsdom has no object URLs (the avatar preview)
    URL.createObjectURL = vi.fn(() => 'blob:avatar-preview');
    URL.revokeObjectURL = vi.fn();
  });

  it('sends only the changed name and updates the cached "me" user', async () => {
    const profile = makeProfile('Teacher', { name: 'Old Name' });
    const capture = captureUpdate({ ...profile, name: 'New Name' });
    const view = renderModal(profile);
    const user = userEvent.setup();

    const name = screen.getByLabelText(/^Name/);
    await user.clear(name);
    await user.type(name, 'New Name');
    await save(user);

    await waitFor(() => {
      expect(view.isClosed()).toBe(true);
    });
    expect(capture.sent).toEqual({ name: 'New Name' });
    expect(view.queryClient.getQueryData(queryKeys.auth.me)).toMatchObject({ name: 'New Name' });
    expect(view.queryClient.getQueryData(queryKeys.profile.me)).toMatchObject({ name: 'New Name' });
    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
  });

  it('says so when nothing changed and sends nothing', async () => {
    const capture = captureUpdate(makeProfile('Admin'));
    renderModal(makeProfile('Admin'));
    await save(userEvent.setup());

    expect(await screen.findByText('Make at least one change before saving.')).toBeInTheDocument();
    expect(capture.sent).toBeNull();
  });

  it('checks the password fields before sending', async () => {
    const capture = captureUpdate(makeProfile('Student'));
    renderModal(makeProfile('Student'));
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('New password'), 'abc');
    await user.type(screen.getByLabelText('Confirm new password'), 'abd');
    await save(user);

    expect(
      await screen.findByText('Current password is required to change your password or email.'),
    ).toBeInTheDocument();
    expect(screen.getByText('New password must be 6-72 characters.')).toBeInTheDocument();
    expect(screen.getByText('New passwords do not match.')).toBeInTheDocument();
    expect(capture.sent).toBeNull();
  });

  it('sends the current and new password together', async () => {
    const profile = makeProfile('Moderator');
    const capture = captureUpdate(profile);
    const view = renderModal(profile);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Current password'), 'old-secret');
    await user.type(screen.getByLabelText('New password'), 'new-secret-1');
    await user.type(screen.getByLabelText('Confirm new password'), 'new-secret-1');
    await save(user);

    await waitFor(() => {
      expect(view.isClosed()).toBe(true);
    });
    expect(capture.sent).toEqual({ currentPassword: 'old-secret', newPassword: 'new-secret-1' });
  });

  it('lets a student change the email only with the current password', async () => {
    const profile = makeProfile('Student', { email: 'asha@example.com' });
    const capture = captureUpdate({ ...profile, email: 'asha.new@example.com' });
    renderModal(profile);
    const user = userEvent.setup();

    const email = screen.getByLabelText(/^Email/);
    await user.clear(email);
    await user.type(email, 'Asha.New@example.com');
    await save(user);
    expect(
      await screen.findByText('Current password is required to change your password or email.'),
    ).toBeInTheDocument();
    expect(capture.sent).toBeNull();

    await user.type(screen.getByLabelText('Current password'), 'my-secret');
    await save(user);
    await waitFor(() => {
      expect(capture.sent).toEqual({ email: 'asha.new@example.com', currentPassword: 'my-secret' });
    });
  });

  it('keeps the email read-only for staff', () => {
    renderModal(makeProfile('Teacher'));

    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('readonly');
    expect(
      screen.getByText('Email changes for this role are managed by an administrator.'),
    ).toBeInTheDocument();
  });

  it('shows the server message and stays open when the save fails', async () => {
    server.use(http.put('*/api/auth/me', () => fail(400, 'Current password is incorrect')));
    const view = renderModal(makeProfile('Student'));
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Current password'), 'wrong');
    await user.type(screen.getByLabelText('New password'), 'new-secret-1');
    await user.type(screen.getByLabelText('Confirm new password'), 'new-secret-1');
    await save(user);

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
    expect(view.isClosed()).toBe(false);
  });

  it('turns the private community profile on', async () => {
    const profile = makeProfile('Student');
    const capture = captureUpdate({ ...profile, isCommunityProfilePrivate: true });
    renderModal(profile);
    const user = userEvent.setup();

    await user.click(screen.getByRole('switch', { name: /Private community profile/ }));
    await save(user);

    await waitFor(() => {
      expect(capture.sent).toEqual({ isCommunityProfilePrivate: 'true' });
    });
  });

  it('rejects a non-image avatar and uploads an image', async () => {
    const profile = makeProfile('Student');
    const capture = captureUpdate({ ...profile, avatar: 'https://res.cloudinary.com/x/a.png' });
    renderModal(profile);
    const user = userEvent.setup({ applyAccept: false });
    const input = screen.getByLabelText('Upload Avatar', { selector: 'input' });

    await user.upload(input, new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a JPG, PNG, WEBP or GIF image.',
    );

    await user.upload(input, new File(['png'], 'me.png', { type: 'image/png' }));
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    await save(user);

    await waitFor(() => {
      expect(capture.sent?.avatar).toMatchObject({ name: 'me.png', type: 'image/png' });
    });
  });

  it('removes the current avatar', async () => {
    const profile = makeProfile('Admin', { avatar: 'https://res.cloudinary.com/x/me.png' });
    const capture = captureUpdate({ ...profile, avatar: undefined });
    renderModal(profile);
    const user = userEvent.setup();

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(within(dialog).queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    await save(user);

    await waitFor(() => {
      expect(capture.sent).toEqual({ removeAvatar: 'true' });
    });
  });
});
