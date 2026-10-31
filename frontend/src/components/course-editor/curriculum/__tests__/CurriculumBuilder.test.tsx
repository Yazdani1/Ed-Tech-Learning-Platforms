import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { COURSE_ID, makeCourse } from '../../__tests__/fixtures';
import { CurriculumBuilder } from '../CurriculumBuilder';

const SECTION_ID = '64b7f0c2a1b2c3d4e5f6e001';
const LECTURE_ID = '64b7f0c2a1b2c3d4e5f6f001';

const renderBuilder = (course = makeCourse()) => {
  server.use(http.get(`*/api/courses/${COURSE_ID}`, () => ok(course)));
  return renderWithProviders(
    <ConfirmProvider>
      <CurriculumBuilder course={course} />
    </ConfirmProvider>,
  );
};

describe('CurriculumBuilder', () => {
  it('lists the sections with their lectures and the free preview badge', () => {
    renderBuilder();
    const intro = screen.getByRole('listitem', { name: 'Introduction' });
    expect(within(intro).getByText('Welcome')).toBeInTheDocument();
    expect(within(intro).getByText('Numbers')).toBeInTheDocument();
    expect(within(intro).getByText('Free Preview')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Equations' })).toBeInTheDocument();
    expect(screen.getByLabelText('Move section Introduction')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    renderBuilder(makeCourse({ sections: [] }));
    expect(screen.getByText('No sections yet. Add the first section.')).toBeInTheDocument();
  });

  it('adds a section', async () => {
    let body: unknown;
    server.use(
      http.post(`*/api/courses/${COURSE_ID}/sections`, async ({ request }) => {
        body = await request.json();
        return ok({ _id: '64b7f0c2a1b2c3d4e5f6e003' });
      }),
    );
    renderBuilder();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Add Section' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Section' });
    await user.type(within(dialog).getByLabelText(/Section title/), '  Geometry ');
    await user.click(within(dialog).getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Section added')).toBeInTheDocument();
    expect(body).toEqual({ title: 'Geometry' });
  });

  it('refuses a lecture with a video address that is not a web address', async () => {
    let called = false;
    server.use(
      http.post(`*/api/courses/${COURSE_ID}/sections/${SECTION_ID}/lectures`, () => {
        called = true;
        return ok({ _id: 'x' });
      }),
    );
    renderBuilder();
    const user = userEvent.setup();

    const intro = screen.getByRole('listitem', { name: 'Introduction' });
    await user.click(within(intro).getByRole('button', { name: 'Add Lecture' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Lecture' });
    await user.type(within(dialog).getByLabelText(/Lecture title/), 'Variables');
    await user.type(within(dialog).getByLabelText(/YouTube Video URL/), 'javascript:alert(1)');
    await user.click(within(dialog).getByRole('button', { name: 'Add Lecture' }));

    expect(
      await within(dialog).findByText('Enter a full web address (https://...)'),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('edits a lecture', async () => {
    let body: unknown;
    server.use(
      http.put(
        `*/api/courses/${COURSE_ID}/sections/${SECTION_ID}/lectures/${LECTURE_ID}`,
        async ({ request }) => {
          body = await request.json();
          return ok({ _id: LECTURE_ID });
        },
      ),
    );
    renderBuilder();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Edit lecture Welcome' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Lecture' });
    const title = within(dialog).getByLabelText(/Lecture title/);
    await user.clear(title);
    await user.type(title, 'Welcome aboard');
    await user.click(within(dialog).getByRole('switch'));
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Lecture updated')).toBeInTheDocument();
    expect(body).toEqual({
      title: 'Welcome aboard',
      videoUrl: 'https://youtu.be/a',
      isPreview: false,
    });
  });

  it('deletes a section after confirming and shows a server error', async () => {
    server.use(
      http.delete(`*/api/courses/${COURSE_ID}/sections/${SECTION_ID}`, () =>
        fail(403, 'Not authorized'),
      ),
    );
    renderBuilder();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Delete section Introduction' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Not authorized')).toBeInTheDocument();
  });
});
