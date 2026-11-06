import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { CommunityHubPage } from '../hub/CommunityHubPage';

import { authorOf, makeOverview, makePost, overviewHandler } from './fixtures';

const renderHub = () => {
  setLocation('/community-hub');
  return renderWithProviders(
    <ConfirmProvider>
      <CommunityHubPage />
    </ConfirmProvider>,
  );
};

const post = makePost();

describe('CommunityHubPage', () => {
  it('shows a guest the limited preview with a sign-in button and no posting tools', async () => {
    server.use(overviewHandler(makeOverview([post], { guestLimited: true })));
    renderHub();

    expect(await screen.findByRole('article', { name: post.title })).toBeInTheDocument();
    expect(screen.getByText(/limited guest preview/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to participate' })).toHaveAttribute(
      'href',
      '/community-hub?auth=login&next=%2Fcommunity-hub',
    );
    expect(screen.queryByRole('button', { name: 'New Discussion' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Community Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Like (0)' })).toBeDisabled();
    expect(screen.getByText('42 Total Members')).toBeInTheDocument();
  });

  it('shows the error message when the hub cannot load', async () => {
    server.use(http.get('*/api/community', () => fail(500, 'Server is down')));
    renderHub();
    expect(await screen.findByText('Server is down')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    server.use(overviewHandler(makeOverview([])));
    renderHub();
    expect(await screen.findByText('No discussions found')).toBeInTheDocument();
  });

  it('lets a signed-in student start a discussion', async () => {
    const sent = vi.fn();
    server.use(
      signedInAs(makeUser('Student')),
      overviewHandler(makeOverview([post])),
      http.post('*/api/community/posts', async ({ request }) => {
        const body = await request.formData();
        sent(Object.fromEntries(body.entries()));
        return ok({ ...post, _id: 'p2', title: 'New topic' });
      }),
    );
    renderHub();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'New Discussion' }));
    const form = screen.getByRole('form', { name: 'Start a discussion' });
    await user.click(within(form).getByRole('button', { name: 'Publish Discussion' }));
    expect(await within(form).findAllByText('This field is required')).not.toHaveLength(0);

    await user.click(within(form).getByRole('combobox', { name: 'Channel' }));
    await user.click(await screen.findByRole('option', { name: 'Physics' }));
    await user.type(within(form).getByRole('textbox', { name: 'Title' }), 'New topic');
    await user.type(within(form).getByRole('textbox', { name: 'Description' }), '<p>Body</p>');
    await user.click(within(form).getByRole('button', { name: 'Publish Discussion' }));

    expect(await screen.findByText('Discussion created')).toBeInTheDocument();
    expect(sent).toHaveBeenCalledWith({
      channel: 'ch2',
      title: 'New topic',
      description: '<p>Body</p>',
    });
  });

  it('refuses a picked file that is not an image', async () => {
    server.use(signedInAs(makeUser('Student')), overviewHandler(makeOverview([post])));
    renderHub();
    const user = userEvent.setup({ applyAccept: false });

    await user.click(await screen.findByRole('button', { name: 'New Discussion' }));
    const form = screen.getByRole('form', { name: 'Start a discussion' });
    const input = form.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('file input missing');
    await user.upload(input, new File(['x'], 'notes.txt', { type: 'text/plain' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'notes.txt is not a PNG, JPEG, GIF or WEBP image',
    );
  });

  it('shows Community Settings to an Admin only', async () => {
    server.use(signedInAs(makeUser('Admin')), overviewHandler(makeOverview([post])));
    renderHub();
    expect(await screen.findByRole('button', { name: 'Community Settings' })).toBeInTheDocument();
  });

  it('gives staff Pin in the post menu but hides the menu from other students', async () => {
    const pinned = vi.fn();
    server.use(
      signedInAs(makeUser('Moderator')),
      overviewHandler(makeOverview([post])),
      http.patch('*/api/community/posts/p1/pin', () => {
        pinned();
        return ok({ ...post, isPinned: true });
      }),
    );
    const { unmount } = renderHub();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: `Actions for ${post.title}` }));
    await user.click(screen.getByRole('menuitem', { name: 'Pin' }));
    expect(await screen.findByText('Discussion pinned')).toBeInTheDocument();
    expect(pinned).toHaveBeenCalled();
    unmount();

    const otherStudent = makeUser('Student', { _id: 'someone-else' });
    server.use(signedInAs(otherStudent), overviewHandler(makeOverview([post])));
    renderHub();
    expect(await screen.findByRole('article', { name: post.title })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: `Actions for ${post.title}` }),
    ).not.toBeInTheDocument();
  });

  it('reacts with a Like and shows the new count', async () => {
    const student = makeUser('Student');
    const sent = vi.fn();
    server.use(
      signedInAs(student),
      overviewHandler(makeOverview([post])),
      http.patch('*/api/community/posts/p1/reactions', async ({ request }) => {
        sent(await request.json());
        return ok({ ...post, reactions: [{ user: authorOf('Student'), type: 'Like' }] });
      }),
    );
    renderHub();
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Like (0)' }));
    expect(await screen.findByRole('button', { name: 'Remove your Like (1)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(sent).toHaveBeenCalledWith({ type: 'Like' });
  });

  it('puts the chosen channel in the URL', async () => {
    server.use(overviewHandler(makeOverview([post])));
    renderHub();
    const channels = await screen.findByRole('navigation', { name: 'Channels' });
    await userEvent.setup().click(await within(channels).findByRole('button', { name: /Physics/ }));
    expect(router.replace).toHaveBeenCalledWith('/community-hub?channel=ch2', { scroll: false });
  });

  it('loads the next page of discussions', async () => {
    const skips: string[] = [];
    const second = makePost({ _id: 'p2', title: 'Second page post' });
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/community', ({ request }) => {
        const skip = new URL(request.url).searchParams.get('skip') ?? '0';
        skips.push(skip);
        return skip === '0'
          ? ok(
              makeOverview([post], {
                postPagination: { skip: 0, limit: 10, loaded: 1, hasMore: true },
              }),
            )
          : ok(
              makeOverview([second], {
                postPagination: { skip: 1, limit: 10, loaded: 1, hasMore: false },
              }),
            );
      }),
    );
    renderHub();
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Load more discussions' }));
    expect(await screen.findByRole('article', { name: 'Second page post' })).toBeInTheDocument();
    await waitFor(() => {
      expect(skips).toEqual(['0', '1']);
    });
  });
});
