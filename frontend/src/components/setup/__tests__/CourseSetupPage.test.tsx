import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { setupItemSchema, type SetupItem } from '@/schemas/setup.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { CourseSetupPage } from '../CourseSetupPage';

import type { SetupKind } from '@/schemas/setup.schema';

const makeItem = (id: string, name: string, description = ''): SetupItem =>
  setupItemSchema.parse({
    _id: `64b7f0c2a1b2c3d4e5f6a${id}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description,
  });

const WEB = makeItem('001', 'Web Dev', 'All about the web');
const MATHS = makeItem('002', 'Maths');

const renderPage = (
  kind: SetupKind = 'category',
  role: 'Super Admin' | 'Admin' | 'Moderator' = 'Admin',
) => {
  server.use(signedInAs(makeUser(role)));
  return renderWithProviders(
    <ConfirmProvider>
      <CourseSetupPage kind={kind} />
    </ConfirmProvider>,
  );
};

const openRowMenu = async (name: string): Promise<void> => {
  await userEvent.setup().click(await screen.findByRole('button', { name: `Actions for ${name}` }));
};

describe('CourseSetupPage', () => {
  it('lists the categories with their slug and description', async () => {
    server.use(http.get('*/api/categories', () => ok([WEB, MATHS], { total: 2 })));
    renderPage();

    expect(await screen.findByText('Web Dev')).toBeInTheDocument();
    expect(screen.getByText('web-dev')).toBeInTheDocument();
    expect(screen.getByText('All about the web')).toBeInTheDocument();
    expect(screen.getByText('Maths')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Course Setup' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Course Types' })).toHaveAttribute(
      'href',
      '/admin/course-types',
    );
  });

  it('shows the empty state', async () => {
    server.use(http.get('*/api/categories', () => ok([])));
    renderPage();

    expect(await screen.findByText('No categories yet.')).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    server.use(http.get('*/api/categories', () => fail(500, 'Server exploded')));
    renderPage();

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('creates a category and refreshes the list', async () => {
    let body: unknown;
    let items = [MATHS];
    server.use(
      http.get('*/api/categories', () => ok(items)),
      http.post('*/api/categories', async ({ request }) => {
        body = await request.json();
        items = [MATHS, WEB];
        return ok(WEB);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Category' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Category' });
    await user.type(within(dialog).getByLabelText(/Name/), '  Web Dev ');
    await user.type(within(dialog).getByLabelText('Description'), 'All about the web');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Category created')).toBeInTheDocument();
    expect(body).toEqual({ name: 'Web Dev', description: 'All about the web' });
    expect(await screen.findByText('Web Dev')).toBeInTheDocument();
  });

  it('requires a name with letters or digits before sending anything', async () => {
    let called = false;
    server.use(
      http.get('*/api/categories', () => ok([])),
      http.post('*/api/categories', () => {
        called = true;
        return ok(WEB);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Category' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('This field is required')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Name/), '!!!');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      await within(dialog).findByText('The name must contain letters or numbers'),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('shows the backend message when saving fails (duplicate name)', async () => {
    server.use(
      http.get('*/api/categories', () => ok([])),
      http.post('*/api/categories', () => fail(400, 'Category already exists')),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Category' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Name/), 'Maths');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText('Category already exists')).toBeInTheDocument();
  });

  it('edits a category with the form filled in', async () => {
    let url = '';
    let body: unknown;
    server.use(
      http.get('*/api/categories', () => ok([WEB])),
      http.put('*/api/categories/:id', async ({ request }) => {
        url = request.url;
        body = await request.json();
        return ok({ ...WEB, name: 'Web Development' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await openRowMenu('Web Dev');
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Category' });
    const name = within(dialog).getByLabelText(/Name/);
    expect(name).toHaveValue('Web Dev');
    await user.clear(name);
    await user.type(name, 'Web Development');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Category updated')).toBeInTheDocument();
    expect(url).toContain(`/api/categories/${WEB._id}`);
    expect(body).toEqual({ name: 'Web Development', description: 'All about the web' });
  });

  it('deletes a category after confirmation', async () => {
    let deleted = '';
    server.use(
      http.get('*/api/categories', () => ok([WEB])),
      http.delete('*/api/categories/:id', ({ params }) => {
        deleted = String(params.id);
        return ok(undefined);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await openRowMenu('Web Dev');
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Delete "Web Dev"?');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Category deleted')).toBeInTheDocument();
    expect(deleted).toBe(WEB._id);
  });

  it('shows why a category used by courses cannot be deleted', async () => {
    server.use(
      http.get('*/api/categories', () => ok([WEB])),
      http.delete('*/api/categories/:id', () => fail(400, 'Category is used by 3 course(s)')),
    );
    renderPage();
    const user = userEvent.setup();

    await openRowMenu('Web Dev');
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(await screen.findByText('Category is used by 3 course(s)')).toBeInTheDocument();
  });

  it('manages course types on the course types tab', async () => {
    let body: unknown;
    server.use(
      http.get('*/api/course-types', () => ok([makeItem('003', 'Live Course')])),
      http.post('*/api/course-types', async ({ request }) => {
        body = await request.json();
        return ok(makeItem('004', 'Seminar'));
      }),
    );
    renderPage('courseType', 'Super Admin');
    const user = userEvent.setup();

    expect(await screen.findByText('Live Course')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Course Types' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Add Course Type' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Course Type' });
    await user.type(within(dialog).getByLabelText(/Name/), 'Seminar');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Course type created')).toBeInTheDocument();
    expect(body).toEqual({ name: 'Seminar', description: '' });
  });

  it('sends a Moderator away (managers only, as the backend allows)', async () => {
    server.use(http.get('*/api/categories', () => ok([WEB])));
    renderPage('category', 'Moderator');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
    expect(screen.queryByRole('button', { name: 'Add Category' })).not.toBeInTheDocument();
  });
});
