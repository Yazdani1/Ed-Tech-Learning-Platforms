import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { AnnouncementsTab } from '../announcements/AnnouncementsTab';
import { StudyMaterialsTab } from '../materials/StudyMaterialsTab';

import { COURSE_ID, makeAnnouncement, posterOf } from './fixtures';

const ANNOUNCEMENTS = `*/api/announcements/course/${COURSE_ID}`;

const renderTab = () =>
  renderWithProviders(
    <ConfirmProvider>
      <AnnouncementsTab courseId={COURSE_ID} />
    </ConfirmProvider>,
  );

describe('AnnouncementsTab', () => {
  it('lists announcements with sanitised text; students cannot post or edit', async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.get(ANNOUNCEMENTS, () =>
        ok([makeAnnouncement({ description: '<p>Bring a pencil</p><script>alert(1)</script>' })]),
      ),
    );
    renderTab();

    const card = await screen.findByRole('article', { name: 'Exam on Friday' });
    expect(await within(card).findByText('Bring a pencil')).toBeInTheDocument();
    expect(card.querySelector('script')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Post Announcement' })).not.toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
  });

  it('shows the empty and error states', async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.get(ANNOUNCEMENTS, () => ok([])),
    );
    const { unmount } = renderTab();
    expect(await screen.findByText('No announcements yet.')).toBeInTheDocument();
    unmount();

    server.use(http.get(ANNOUNCEMENTS, () => fail(500, 'Database unavailable')));
    renderTab();
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });

  it('lets a teacher post an announcement (title and text required)', async () => {
    const posted = vi.fn();
    server.use(
      signedInAs(makeUser('Teacher')),
      http.get(ANNOUNCEMENTS, () => ok([])),
      http.post(ANNOUNCEMENTS, async ({ request }) => {
        const body = (await request.json()) as Record<string, string>;
        posted(body);
        return ok(makeAnnouncement({ title: body.title, description: body.description }));
      }),
    );
    renderTab();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Post Announcement' }));
    const dialog = await screen.findByRole('dialog', { name: 'New Announcement' });
    await user.click(within(dialog).getByRole('button', { name: 'Post' }));
    expect(await within(dialog).findAllByText('This field is required')).toHaveLength(2);

    await user.type(within(dialog).getByRole('textbox', { name: 'Title' }), 'Class moved');
    await user.type(await within(dialog).findByLabelText('Description'), 'To Monday');
    await user.click(within(dialog).getByRole('button', { name: 'Post' }));

    expect(await screen.findByText('Announcement posted')).toBeInTheDocument();
    expect(posted).toHaveBeenCalledWith({ title: 'Class moved', description: 'To Monday' });
  });

  it("lets the author delete their own announcement after confirming, but not another teacher's", async () => {
    const deleted = vi.fn();
    server.use(
      signedInAs(makeUser('Teacher')),
      http.get(ANNOUNCEMENTS, () =>
        ok([
          makeAnnouncement(),
          makeAnnouncement({
            _id: 'a2',
            title: 'Other teacher post',
            postedBy: { ...posterOf('Teacher'), _id: 'someone-else' },
          }),
        ]),
      ),
      http.delete('*/api/announcements/a1', () => {
        deleted();
        return ok(null);
      }),
    );
    renderTab();
    const user = userEvent.setup();

    const other = await screen.findByRole('article', { name: 'Other teacher post' });
    expect(within(other).queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Actions for Exam on Friday' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Announcement deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(deleted).toHaveBeenCalledTimes(1);
    });
  });
});

describe('StudyMaterialsTab', () => {
  it('shows only http(s) resource links and rejects other links in the form', async () => {
    server.use(
      signedInAs(makeUser('Admin')),
      http.get(`*/api/study-materials/course/${COURSE_ID}`, () =>
        ok([
          { ...makeAnnouncement({ title: 'Notes' }), fileUrl: 'https://example.com/notes.pdf' },
          { ...makeAnnouncement({ _id: 'm2', title: 'Bad link' }), fileUrl: 'javascript:alert(1)' },
        ]),
      ),
    );
    renderWithProviders(
      <ConfirmProvider>
        <StudyMaterialsTab courseId={COURSE_ID} />
      </ConfirmProvider>,
    );
    const user = userEvent.setup();

    const notes = await screen.findByRole('article', { name: 'Notes' });
    expect(within(notes).getByRole('link', { name: 'Open Resource →' })).toHaveAttribute(
      'href',
      'https://example.com/notes.pdf',
    );
    const bad = screen.getByRole('article', { name: 'Bad link' });
    expect(within(bad).queryByRole('link')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Add Material' }));
    const dialog = await screen.findByRole('dialog', { name: 'New Study Material' });
    await user.type(within(dialog).getByRole('textbox', { name: /Resource Link/ }), 'ftp://x');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));
    expect(
      await within(dialog).findByText('Enter a link that starts with http:// or https://'),
    ).toBeInTheDocument();
  });
});
