import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { CommunityAdminModal } from '../admin/CommunityAdminModal';

import { BADGE, CHANNEL } from './fixtures';

const RULES = [
  { key: 'acceptedAnswer', label: 'Points for accepted answer', points: 5 },
  { key: 'createPost', label: 'Points for creating a post', points: 1 },
  { key: 'createReply', label: 'Points for replying to a post', points: 1 },
  { key: 'receiveReaction', label: 'Points for receiving reactions', points: 0 },
];

const useAdminApi = () => {
  server.use(
    signedInAs(makeUser('Admin')),
    http.get('*/api/community/settings', () =>
      ok({ title: 'Community Hub', description: 'Old text' }),
    ),
    http.get('*/api/community/admin/channels', () =>
      ok([CHANNEL, { _id: 'old', name: 'Old', isArchived: true }]),
    ),
    http.get('*/api/community/badges', () => ok([BADGE])),
    http.get('*/api/community/point-rules', () => ok(RULES)),
  );
};

const renderModal = () =>
  renderWithProviders(
    <ConfirmProvider>
      <CommunityAdminModal onClose={vi.fn()} />
    </ConfirmProvider>,
  );

const openSection = async (name: string) => {
  const user = userEvent.setup();
  const nav = await screen.findByRole('navigation', { name: 'Settings sections' });
  await user.click(within(nav).getByRole('button', { name }));
  return user;
};

describe('CommunityAdminModal', () => {
  it('saves the header title and description', async () => {
    const sent = vi.fn();
    useAdminApi();
    server.use(
      http.put('*/api/community/settings', async ({ request }) => {
        sent(Object.fromEntries((await request.formData()).entries()));
        return ok({ title: 'Hub', description: 'New text' });
      }),
    );
    renderModal();
    const user = userEvent.setup();
    const title = await screen.findByRole('textbox', { name: 'Header title' });
    await user.clear(title);
    await user.type(title, 'Hub');
    await user.click(screen.getByRole('button', { name: 'Save Header' }));
    expect(await screen.findByText('Header saved')).toBeInTheDocument();
    expect(sent).toHaveBeenCalledWith({ title: 'Hub', description: 'Old text' });
  });

  it('creates a channel and archives one after confirming', async () => {
    const created = vi.fn();
    const archived = vi.fn();
    useAdminApi();
    server.use(
      http.post('*/api/community/channels', async ({ request }) => {
        created(Object.fromEntries((await request.formData()).entries()));
        return ok({ _id: 'ch9', name: 'Maths' });
      }),
      http.patch('*/api/community/channels/ch1/archive', () => {
        archived();
        return ok({ _id: 'ch1' });
      }),
    );
    renderModal();
    const user = await openSection('Channels');

    expect(await screen.findByText('Archived')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create New Channel' }));
    const form = screen.getByRole('form', { name: 'Channel details' });
    await user.type(within(form).getByRole('textbox', { name: 'Channel name' }), 'Maths');
    await user.click(within(form).getByRole('button', { name: 'Save Channel' }));
    expect(await screen.findByText('Channel saved')).toBeInTheDocument();
    expect(created).toHaveBeenCalledWith({ name: 'Maths', description: '' });

    await user.click(screen.getByRole('button', { name: 'Actions for General' }));
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
    const confirm = await screen.findByRole('dialog', { name: 'Archive?' });
    await user.click(within(confirm).getByRole('button', { name: 'Archive' }));
    expect(await screen.findByText('Channel archived')).toBeInTheDocument();
    expect(archived).toHaveBeenCalled();
  });

  it('refuses badge points that are not a whole number of 0 or more', async () => {
    const created = vi.fn();
    useAdminApi();
    server.use(
      http.post('*/api/community/badges', () => {
        created();
        return ok(BADGE);
      }),
    );
    renderModal();
    const user = await openSection('Badges');
    await user.click(await screen.findByRole('button', { name: 'Create New Badge' }));
    const form = screen.getByRole('form', { name: 'Badge details' });
    await user.type(within(form).getByRole('textbox', { name: 'Badge name' }), 'Star');
    const points = within(form).getByRole('spinbutton', { name: 'Required points' });
    await user.clear(points);
    await user.click(within(form).getByRole('button', { name: 'Save Badge' }));
    expect(await within(form).findByText('Enter a whole number of 0 or more')).toBeInTheDocument();
    expect(created).not.toHaveBeenCalled();
  });

  it('saves the point rules as numbers', async () => {
    const sent = vi.fn();
    useAdminApi();
    server.use(
      http.put('*/api/community/point-rules', async ({ request }) => {
        sent(await request.json());
        return ok(RULES);
      }),
    );
    renderModal();
    const user = await openSection('Points Settings');
    const accepted = await screen.findByRole('spinbutton', { name: 'Points for accepted answer' });
    await user.clear(accepted);
    await user.type(accepted, '10');
    await user.click(screen.getByRole('button', { name: 'Save Point Settings' }));
    expect(await screen.findByText('Point settings saved')).toBeInTheDocument();
    expect(sent).toHaveBeenCalledWith({
      rules: [
        { key: 'acceptedAnswer', points: 10 },
        { key: 'createPost', points: 1 },
        { key: 'createReply', points: 1 },
        { key: 'receiveReaction', points: 0 },
      ],
    });
  });
});
