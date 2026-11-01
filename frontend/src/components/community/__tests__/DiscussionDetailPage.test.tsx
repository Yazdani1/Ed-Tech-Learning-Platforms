import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { DiscussionDetailPage } from '../detail/DiscussionDetailPage';

import {
  authorOf,
  makeDetail,
  makeOverview,
  makePost,
  makeReply,
  overviewHandler,
} from './fixtures';

const POST = '*/api/community/posts/p1';
const post = makePost({ description: '<p>Loops <script>alert(1)</script>repeat code.</p>' });
const accepted = makeReply({
  _id: 'r1',
  isAccepted: true,
  childReplyCount: 1,
  childReplies: [
    {
      _id: 'c1',
      body: '<p>Thanks!</p>',
      author: authorOf('Student'),
      createdAt: '2026-10-29T12:00:00.000Z',
    },
  ],
});
const studentReply = makeReply({
  _id: 'r2',
  body: '<p>My own answer</p>',
  author: authorOf('Student'),
});

const renderDetail = () =>
  renderWithProviders(
    <ConfirmProvider>
      <DiscussionDetailPage postId="p1" />
    </ConfirmProvider>,
  );

const useDiscussion = (hasMore = false) => {
  server.use(
    http.get(POST, () => ok(makeDetail(post, [accepted, studentReply], hasMore))),
    overviewHandler(makeOverview([post, makePost({ _id: 'p9', title: 'Related topic' })])),
  );
};

describe('DiscussionDetailPage', () => {
  it('shows the discussion (sanitised), its answers and related discussions', async () => {
    useDiscussion();
    renderDetail();

    const article = await screen.findByRole('article', { name: post.title });
    expect(
      within(article).getByRole('heading', { level: 1, name: post.title }),
    ).toBeInTheDocument();
    expect(await within(article).findByText(/repeat code/)).toBeInTheDocument();
    expect(article.querySelector('script')).toBeNull();
    expect(within(article).getByText('Accepted answer')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Related topic' })[0]).toHaveAttribute(
      'href',
      '/community-hub/p9',
    );
    expect(screen.getByRole('link', { name: 'Sign in to reply' })).toHaveAttribute(
      'href',
      '/auth/login?next=%2Fcommunity-hub%2Fp1',
    );
  });

  it('says when the discussion does not exist', async () => {
    server.use(http.get(POST, () => fail(404, 'Discussion not found')));
    renderDetail();
    expect(await screen.findByText('Discussion not found')).toBeInTheDocument();
  });

  it('lets only the discussion creator accept an answer', async () => {
    const toggled = vi.fn();
    server.use(
      signedInAs(makeUser('Student')),
      http.patch('*/api/community/replies/r2/accepted', () => {
        toggled();
        return ok({ ...studentReply, isAccepted: true });
      }),
    );
    useDiscussion();
    const { unmount } = renderDetail();
    const user = userEvent.setup();
    const answer = await screen.findByRole('listitem', { name: 'Reply by Test Student' });
    await user.click(await within(answer).findByRole('button', { name: 'Mark accepted answer' }));
    expect(toggled).toHaveBeenCalled();
    unmount();

    server.use(signedInAs(makeUser('Teacher')));
    renderDetail();
    expect(
      await screen.findByRole('listitem', { name: 'Reply by Test Student' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accepted answer/ })).not.toBeInTheDocument();
  });

  it('posts an answer with the reply form', async () => {
    const sent = vi.fn();
    server.use(
      signedInAs(makeUser('Teacher')),
      http.post(`${POST}/replies`, async ({ request }) => {
        sent(Object.fromEntries((await request.formData()).entries()));
        return ok(makeReply({ _id: 'r3' }));
      }),
    );
    useDiscussion();
    renderDetail();
    const user = userEvent.setup();

    // The first Reply button opens the answer form (the others reply to an answer)
    const [replyButton] = await screen.findAllByRole('button', { name: 'Reply' });
    if (!replyButton) throw new Error('Reply button missing');
    await user.click(replyButton);
    await user.type(screen.getByRole('textbox', { name: 'Your reply' }), '<p>Try while</p>');
    await user.click(screen.getByRole('button', { name: 'Publish Reply' }));
    expect(await screen.findByText('Reply added')).toBeInTheDocument();
    expect(sent).toHaveBeenCalledWith({ body: '<p>Try while</p>' });
  });

  it('shows nested replies and deletes your own answer after confirming', async () => {
    const archived = vi.fn();
    server.use(
      signedInAs(makeUser('Student')),
      http.patch('*/api/community/replies/r2/archive', () => {
        archived();
        return ok({ _id: 'r2' });
      }),
    );
    useDiscussion();
    renderDetail();
    const user = userEvent.setup();

    const first = await screen.findByRole('listitem', { name: 'Reply by Test Teacher' });
    await user.click(within(first).getByRole('button', { name: 'Replies (1)' }));
    expect(await within(first).findByText('Thanks!')).toBeInTheDocument();
    // A teacher's answer has no delete menu for a student
    expect(within(first).getAllByRole('button', { name: 'Answer actions' })).toHaveLength(1);

    const mine = screen.getByRole('listitem', { name: 'Reply by Test Student' });
    await user.click(within(mine).getByRole('button', { name: 'Answer actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    expect(await screen.findByText('Answer deleted')).toBeInTheDocument();
    expect(archived).toHaveBeenCalled();
  });

  it('loads more answers', async () => {
    const more = makeReply({ _id: 'r9', body: '<p>Late answer</p>', author: authorOf('Admin') });
    server.use(
      http.get(`${POST}/replies`, () =>
        ok({ replies: [more], total: 3, limit: 10, skip: 2, hasMore: false }),
      ),
    );
    useDiscussion(true);
    renderDetail();
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Load more answers' }));
    expect(await screen.findByText('Late answer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more answers' })).not.toBeInTheDocument();
  });

  it('goes back to the hub after the author deletes the discussion', async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.patch(`${POST}/archive`, () => ok({ _id: 'p1' })),
    );
    useDiscussion();
    renderDetail();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: `Actions for ${post.title}` }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    expect(await screen.findByText('Discussion deleted')).toBeInTheDocument();
    expect(router.push).toHaveBeenCalledWith('/community-hub');
  });
});
