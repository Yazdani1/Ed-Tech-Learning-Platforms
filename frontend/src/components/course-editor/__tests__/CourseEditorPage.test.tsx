import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { CourseEditorPage } from '../CourseEditorPage';

import { CATEGORY, COURSE_ID, COURSE_TYPE, catalogHandlers, makeCourse } from './fixtures';

import type { UserRole } from '@/types';

const NEW_ID = '64b7f0c2a1b2c3d4e5f6c999';

const renderEditor = (courseId?: string, role: UserRole = 'Admin') => {
  server.use(signedInAs(makeUser(role)), ...catalogHandlers);
  return renderWithProviders(
    <ConfirmProvider>
      <CourseEditorPage courseId={courseId} />
    </ConfirmProvider>,
  );
};

const formEntries = async (request: Request): Promise<Record<string, string>> => {
  const data = await request.formData();
  return Object.fromEntries(
    [...data.entries()].map(([key, value]) => [
      key,
      typeof value === 'string' ? value : value.name,
    ]),
  );
};

describe('CourseEditorPage (create)', () => {
  it('creates a draft with the first category and type, adds the intro section and opens the editor', async () => {
    let created: Record<string, string> = {};
    const outline: unknown[] = [];
    server.use(
      http.post('*/api/courses', async ({ request }) => {
        created = await formEntries(request);
        return ok({ _id: NEW_ID, status: 'Draft' });
      }),
      http.patch(`*/api/courses/${NEW_ID}/status`, () => ok({ _id: NEW_ID, status: 'Draft' })),
      http.post(`*/api/courses/${NEW_ID}/sections`, async ({ request }) => {
        outline.push(await request.json());
        return ok({ _id: '64b7f0c2a1b2c3d4e5f6e099' });
      }),
      http.post(`*/api/courses/${NEW_ID}/sections/:sectionId/lectures`, async ({ request }) => {
        outline.push(await request.json());
        return ok({ _id: '64b7f0c2a1b2c3d4e5f6f099' });
      }),
    );
    renderEditor();
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'Create Course' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Course Title/), 'Geometry');
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Category/ })).toHaveTextContent('Maths');
    });
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByText('Course draft created')).toBeInTheDocument();
    expect(created).toMatchObject({
      title: 'Geometry',
      category: CATEGORY._id,
      courseType: COURSE_TYPE._id,
      pricing: 'Free',
      visibility: 'Private',
      teachers: '[]',
    });
    expect(outline).toEqual([
      { title: 'Introduction' },
      { title: 'Course Introduction', isPreview: true },
    ]);
    expect(router.replace).toHaveBeenCalledWith(`/admin/courses/${NEW_ID}/edit`);
  });

  it('opens the edit page with a warning when a step after creating fails (a retry never creates a second course)', async () => {
    let creates = 0;
    server.use(
      http.post('*/api/courses', () => {
        creates += 1;
        return ok({ _id: NEW_ID, status: 'Draft' });
      }),
      http.put(`*/api/courses/${NEW_ID}`, () => ok({ _id: NEW_ID, status: 'Draft' })),
      http.post(`*/api/courses/${NEW_ID}/sections`, () => fail(500, 'Server exploded')),
    );
    renderEditor();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText(/Course Title/), 'Geometry');
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Category/ })).toHaveTextContent('Maths');
    });
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(
      await screen.findByText(/The course was created, but some details were not saved/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Course draft created')).not.toBeInTheDocument();
    expect(router.replace).toHaveBeenCalledWith(`/admin/courses/${NEW_ID}/edit`);
    expect(creates).toBe(1);
  });

  it('checks the prices of a paid course before saving', async () => {
    let called = false;
    server.use(
      http.post('*/api/courses', () => {
        called = true;
        return ok({ _id: NEW_ID });
      }),
    );
    renderEditor();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('combobox', { name: /Pricing/ }));
    await user.click(await screen.findByRole('option', { name: 'Paid' }));
    await user.type(screen.getByLabelText(/List Price/), '500');
    await user.type(screen.getByLabelText(/Discount Price/), '800');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(
      await screen.findByText('The discount price cannot be higher than the list price'),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('asks to save the course before the curriculum can be built', async () => {
    renderEditor();
    await userEvent.setup().click(await screen.findByRole('tab', { name: 'Curriculum' }));
    expect(screen.getByText(/Save the course first/)).toBeInTheDocument();
  });
});

describe('CourseEditorPage (edit)', () => {
  it('shows the saved course and publishes it', async () => {
    let updated: Record<string, string> = {};
    let status: unknown;
    server.use(
      http.get(`*/api/courses/${COURSE_ID}`, () => ok(makeCourse())),
      http.put(`*/api/courses/${COURSE_ID}`, async ({ request }) => {
        updated = await formEntries(request);
        return ok({ _id: COURSE_ID, status: 'Draft' });
      }),
      http.patch(`*/api/courses/${COURSE_ID}/status`, async ({ request }) => {
        status = await request.json();
        return ok({ _id: COURSE_ID, status: 'Published', publishedAt: '2026-10-30T10:00:00.000Z' });
      }),
    );
    renderEditor(COURSE_ID);
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'Algebra 101' })).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Preview' })).toHaveAttribute(
      'href',
      `/courses/${COURSE_ID}`,
    );
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Course published')).toBeInTheDocument();
    expect(status).toEqual({ status: 'Published' });
    expect(updated).toMatchObject({
      title: 'Algebra 101',
      teachers: JSON.stringify(['64b7f0c2a1b2c3d4e5f6d003']),
      whatYouWillLearn: '["Equations"]',
      description: '<p>All about algebra</p>',
    });
    expect(await screen.findByText('Published')).toBeInTheDocument();
  });

  it('saves the learning content lists', async () => {
    let updated: Record<string, string> = {};
    server.use(
      http.get(`*/api/courses/${COURSE_ID}`, () => ok(makeCourse())),
      http.put(`*/api/courses/${COURSE_ID}`, async ({ request }) => {
        updated = await formEntries(request);
        return ok({ _id: COURSE_ID, status: 'Draft' });
      }),
    );
    server.use(
      http.patch(`*/api/courses/${COURSE_ID}/status`, () =>
        ok({ _id: COURSE_ID, status: 'Draft' }),
      ),
    );
    renderEditor(COURSE_ID);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('tab', { name: 'Learning Content' }));
    const requirements = screen.getByRole('group', { name: 'Requirements' });
    await user.type(
      within(requirements).getByLabelText('New item for Requirements'),
      'A pencil{Enter}',
    );
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByText('Course updated')).toBeInTheDocument();
    expect(updated.requirements).toBe('["A pencil"]');
  });

  it('shows "Course not found" for an unknown course', async () => {
    server.use(http.get(`*/api/courses/${COURSE_ID}`, () => fail(404, 'Course not found')));
    renderEditor(COURSE_ID);
    expect(await screen.findByText('Course not found.')).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    server.use(http.get(`*/api/courses/${COURSE_ID}`, () => fail(500, 'Server exploded')));
    renderEditor(COURSE_ID);
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('sends a Moderator away (course writes are Super Admin and Admin only)', async () => {
    renderEditor(COURSE_ID, 'Moderator');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
    expect(screen.queryByRole('heading', { name: 'Algebra 101' })).not.toBeInTheDocument();
  });
});
