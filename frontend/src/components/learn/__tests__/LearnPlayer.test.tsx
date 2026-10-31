import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router, setLocation } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { LearnPlayer } from '../LearnPlayer';

import { COURSE_ID, contentHandlers, noAccessHandler } from './fixtures';

import type { LearnArea } from '../learn-tabs';

const renderPlayer = (area: LearnArea = 'student') =>
  renderWithProviders(
    <ConfirmProvider>
      <LearnPlayer courseId={COURSE_ID} area={area} />
    </ConfirmProvider>,
  );

describe('LearnPlayer', () => {
  it('plays the first lecture with a video and lists the course content', async () => {
    setLocation(`/student/courses/${COURSE_ID}/learn`);
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    renderPlayer();

    expect(
      await screen.findByRole('heading', { name: 'Physics 101', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByTitle('Welcome')).toHaveAttribute(
      'src',
      expect.stringContaining('youtube-nocookie.com/embed/abcdefghijk'),
    );
    expect(screen.getByRole('heading', { name: 'Welcome', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Duration: 2:05')).toBeInTheDocument();
    // A lecture without a video the viewer may watch cannot be chosen
    const locked = screen.getAllByRole('button', { name: /Locked lecture/ })[0];
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Back to courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
  });

  it('hides the Students tab from students and shows it to teachers', async () => {
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    const { unmount } = renderPlayer();
    const tabs = await screen.findByRole('tablist', { name: 'Course sections' });
    expect(within(tabs).queryByRole('tab', { name: 'Students' })).not.toBeInTheDocument();
    unmount();

    server.use(signedInAs(makeUser('Teacher')));
    renderPlayer('teacher');
    const teacherTabs = await screen.findByRole('tablist', { name: 'Course sections' });
    expect(await within(teacherTabs).findByRole('tab', { name: 'Students' })).toBeInTheDocument();
  });

  it('keeps the open tab in the URL', async () => {
    setLocation(`/student/courses/${COURSE_ID}/learn`);
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    renderPlayer();

    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Announcements' }));
    expect(router.replace).toHaveBeenCalledWith(
      `/student/courses/${COURSE_ID}/learn?tab=announcements`,
      { scroll: false },
    );
  });

  it('opens the tab named in the URL', async () => {
    setLocation(`/student/courses/${COURSE_ID}/learn`, '?tab=announcements');
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    renderPlayer();

    expect(await screen.findByRole('heading', { name: 'Announcements (1)' })).toBeInTheDocument();
    expect(screen.getByText('Exam on Friday')).toBeInTheDocument();
  });

  it('shows "enrol first" with a link to the course page when the server answers 403', async () => {
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    server.use(noAccessHandler);
    renderPlayer();

    expect(
      await screen.findByRole('heading', { name: 'Enrol to open this course' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View course & enrol' })).toHaveAttribute(
      'href',
      `/courses/${COURSE_ID}`,
    );
  });

  it('shows "course not found" for an unknown course', async () => {
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    server.use(http.get(`*/api/courses/${COURSE_ID}`, () => fail(404, 'Course not found')));
    renderPlayer();

    expect(await screen.findByRole('heading', { name: 'Course not found' })).toBeInTheDocument();
  });

  it('shows the server message when the course cannot load', async () => {
    server.use(signedInAs(makeUser('Student')), ...contentHandlers());
    server.use(http.get(`*/api/courses/${COURSE_ID}`, () => fail(500, 'Database unavailable')));
    renderPlayer();

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });
});
