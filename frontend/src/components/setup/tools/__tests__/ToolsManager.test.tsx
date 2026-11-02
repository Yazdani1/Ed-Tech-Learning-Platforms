import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { CourseSetupPage } from '../../CourseSetupPage';

import type { Tool } from '@/schemas/tools.schema';
import type { UserRole } from '@/types';
import { waitFor } from '@testing-library/react';

const CLOUD = 'https://res.cloudinary.com/test-cloud/image/upload';
const NODE: Tool = {
  _id: '64b7f0c2a1b2c3d4e5f6a101',
  name: 'Node.js',
  logoUrl: `${CLOUD}/node.png`,
};
const REACT: Tool = {
  _id: '64b7f0c2a1b2c3d4e5f6a102',
  name: 'React',
  logoUrl: `${CLOUD}/react.png`,
};

const png = (name = 'logo.png'): File => new File(['png-bytes'], name, { type: 'image/png' });

const renderPage = (role: UserRole = 'Admin') => {
  server.use(signedInAs(makeUser(role)));
  return renderWithProviders(
    <ConfirmProvider>
      <CourseSetupPage kind="tool" />
    </ConfirmProvider>,
  );
};

const fileInput = (root: HTMLElement): HTMLInputElement => {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('file input not found');
  return input;
};

describe('Tools tab of Course Setup', () => {
  it('is the third tab and lists the tools as cards with their logo and name', async () => {
    server.use(http.get('*/api/tools', () => ok([NODE, REACT])));
    renderPage();

    const list = await screen.findByRole('list', { name: 'Tools' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Node.js')).toBeInTheDocument();
    expect(within(list).getByText('React')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tools' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tools' })).toHaveAttribute('href', '/admin/tools');
  });

  it('shows the empty state and the error with a retry', async () => {
    server.use(http.get('*/api/tools', () => ok([])));
    const first = renderPage();
    expect(await screen.findByText('No tools yet. Add the first one.')).toBeInTheDocument();
    first.unmount();

    server.use(http.get('*/api/tools', () => fail(500, 'Tools exploded')));
    renderPage();
    expect(await screen.findByText('Tools exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('adds a tool with a name and logo (multipart) and refreshes the grid', async () => {
    let sent: FormData | null = null;
    let tools = [NODE];
    server.use(
      http.get('*/api/tools', () => ok(tools)),
      http.post('*/api/tools', async ({ request }) => {
        sent = await request.formData();
        tools = [NODE, REACT];
        return ok(REACT);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Tool' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add Tool' });
    // The logo is required for a new tool
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Tool name/), '  React ');
    await user.upload(fileInput(dialog), png('react.png'));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Tool added')).toBeInTheDocument();
    const body = sent as FormData | null;
    expect(body?.get('name')).toBe('React');
    expect(body?.get('logo')).toHaveProperty('name', 'react.png');
    expect(await screen.findByText('React')).toBeInTheDocument();
  });

  it('requires a name', async () => {
    let called = false;
    server.use(
      http.get('*/api/tools', () => ok([])),
      http.post('*/api/tools', () => {
        called = true;
        return ok(NODE);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Tool' }));
    const dialog = await screen.findByRole('dialog');
    await user.upload(fileInput(dialog), png());
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText('This field is required')).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('refuses a logo that is not an image', async () => {
    server.use(http.get('*/api/tools', () => ok([])));
    renderPage();
    const user = userEvent.setup({ applyAccept: false });

    await user.click(await screen.findByRole('button', { name: 'Add Tool' }));
    const dialog = await screen.findByRole('dialog');
    await user.upload(fileInput(dialog), new File(['x'], 'notes.pdf', { type: 'application/pdf' }));

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the backend message when saving fails', async () => {
    server.use(
      http.get('*/api/tools', () => ok([])),
      http.post('*/api/tools', () => fail(400, 'Tool already exists')),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Add Tool' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Tool name/), 'Node.js');
    await user.upload(fileInput(dialog), png());
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText('Tool already exists')).toBeInTheDocument();
  });

  it('edits a tool: name filled in, logo optional (not sent when unchanged)', async () => {
    let url = '';
    let sent: FormData | null = null;
    server.use(
      http.get('*/api/tools', () => ok([NODE])),
      http.put('*/api/tools/:id', async ({ request }) => {
        url = request.url;
        sent = await request.formData();
        return ok({ ...NODE, name: 'NodeJS' });
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Actions for Node.js' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Tool' });
    const name = within(dialog).getByLabelText(/Tool name/);
    expect(name).toHaveValue('Node.js');
    await user.clear(name);
    await user.type(name, 'NodeJS');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Tool updated')).toBeInTheDocument();
    expect(url).toContain(`/api/tools/${NODE._id}`);
    const body = sent as FormData | null;
    expect(body?.get('name')).toBe('NodeJS');
    expect(body?.has('logo')).toBe(false);
  });

  it('deletes a tool after confirmation', async () => {
    let deleted = '';
    server.use(
      http.get('*/api/tools', () => ok([NODE])),
      http.delete('*/api/tools/:id', ({ params }) => {
        deleted = String(params.id);
        return ok(undefined);
      }),
    );
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Actions for Node.js' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Delete "Node.js"?');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Tool deleted')).toBeInTheDocument();
    expect(deleted).toBe(NODE._id);
  });

  it('sends a Moderator away (managers only)', async () => {
    server.use(http.get('*/api/tools', () => ok([NODE])));
    renderPage('Moderator');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
    expect(screen.queryByRole('button', { name: 'Add Tool' })).not.toBeInTheDocument();
  });
});
