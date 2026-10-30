import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { ConfirmProvider } from '@/context/ConfirmContext';
import { heroPostSchema, siteLogoSchema, type HeroPost } from '@/schemas/showcase.schema';
import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { router } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';

import { HomepageShowcasePage } from '../HomepageShowcasePage';

import type { UserRole } from '@/types';

const CLOUD = 'https://res.cloudinary.com/test-cloud/image/upload';

const makePost = (id: string, overrides: Partial<HeroPost> = {}): HeroPost =>
  heroPostSchema.parse({
    _id: `64b7f0c2a1b2c3d4e5f6b${id}`,
    imageUrl: `${CLOUD}/hero-${id}.jpg`,
    imageWidth: 2048,
    imageHeight: 460,
    visibility: 'Private',
    order: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  });

const FIRST = makePost('001', { visibility: 'Public', order: 0 });
const SECOND = makePost('002', {
  order: 1,
  scheduledVisibility: 'Public',
  publishAt: '2099-01-01T09:00:00.000Z',
  imageWidth: null,
  imageHeight: null,
});
const LOGO = siteLogoSchema.parse({
  _id: '64b7f0c2a1b2c3d4e5f6c001',
  imageUrl: `${CLOUD}/logo.png`,
  imageWidth: 320,
  imageHeight: 96,
});

const png = (name = 'banner.png'): File => new File(['png-bytes'], name, { type: 'image/png' });

interface Api {
  posts?: HeroPost[];
  logo?: typeof LOGO | null;
}

const renderPage = (
  { posts = [FIRST, SECOND], logo = LOGO }: Api = {},
  role: UserRole = 'Admin',
) => {
  server.use(
    signedInAs(makeUser(role)),
    http.get('*/api/home-hero-posts', () => ok(posts)),
    http.get('*/api/home-hero-posts/logo', () => ok(logo)),
  );
  return renderWithProviders(
    <ConfirmProvider>
      <HomepageShowcasePage />
    </ConfirmProvider>,
  );
};

const fileInput = (root: HTMLElement): HTMLInputElement => {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('file input not found');
  return input;
};

const openMenuItem = async (position: number, item: string): Promise<void> => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: `Actions for image ${position}` }));
  await user.click(await screen.findByRole('menuitem', { name: item }));
};

describe('HomepageShowcasePage', () => {
  it('shows the logo and the slider images in order with their details', async () => {
    renderPage();

    expect(await screen.findByRole('img', { name: 'Site logo' })).toBeInTheDocument();
    expect(screen.getByText('Current logo size: 320 x 96px')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Header image 1' })).toBeInTheDocument();
    expect(screen.getByText('2048 x 460px')).toBeInTheDocument();
    expect(screen.getByText('Image dimensions unavailable')).toBeInTheDocument();
    expect(screen.getByText('Publishes immediately when public')).toBeInTheDocument();
    expect(screen.getByText('Scheduled to Public')).toBeInTheDocument();
    expect(screen.getByText(/^Changes to Public /)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Logo' })).toBeDisabled();
  });

  it('shows the empty states', async () => {
    renderPage({ posts: [], logo: null });

    expect(await screen.findByText('No logo uploaded yet.')).toBeInTheDocument();
    expect(await screen.findByText('No header images uploaded yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Logo' })).toBeDisabled();
  });

  it('shows a list error with a retry button', async () => {
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/home-hero-posts', () => fail(500, 'Could not load posts')),
      http.get('*/api/home-hero-posts/logo', () => ok(null)),
    );
    renderWithProviders(
      <ConfirmProvider>
        <HomepageShowcasePage />
      </ConfirmProvider>,
    );

    expect(await screen.findByText('Could not load posts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('uploads a new logo', async () => {
    let field: FormDataEntryValue | null = null;
    renderPage({ logo: null });
    server.use(
      http.put('*/api/home-hero-posts/logo', async ({ request }) => {
        field = (await request.formData()).get('logo');
        return ok(LOGO);
      }),
    );
    const user = userEvent.setup();
    const panel = (await screen.findByRole('heading', { name: 'Site logo' })).closest('section');
    if (!panel) throw new Error('logo panel not found');

    await user.upload(fileInput(panel), png('logo.png'));
    expect(await screen.findByText('logo.png (0 KB)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save Logo' }));

    expect(await screen.findByText('Logo saved')).toBeInTheDocument();
    expect(field).toHaveProperty('name', 'logo.png');
    expect(await screen.findByRole('img', { name: 'Site logo' })).toBeInTheDocument();
  });

  it('refuses a logo that is not a PNG, JPEG, GIF or WEBP image', async () => {
    renderPage({ logo: null });
    const user = userEvent.setup({ applyAccept: false });
    const panel = (await screen.findByRole('heading', { name: 'Site logo' })).closest('section');
    if (!panel) throw new Error('logo panel not found');

    await user.upload(fileInput(panel), new File(['x'], 'notes.pdf', { type: 'application/pdf' }));

    expect(
      await screen.findByText('notes.pdf is not a PNG, JPEG, GIF or WEBP image'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Logo' })).toBeDisabled();
  });

  it('uploads several slider images with visibility and position', async () => {
    let sent: FormData | null = null;
    renderPage();
    server.use(
      http.post('*/api/home-hero-posts', async ({ request }) => {
        sent = await request.formData();
        return ok([makePost('003'), makePost('004')]);
      }),
    );
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Upload Images' }));
    const dialog = await screen.findByRole('dialog', { name: 'Upload Header Images' });
    expect(within(dialog).getByRole('button', { name: 'Upload' })).toBeDisabled();
    await user.upload(fileInput(dialog), [png('a.png'), png('b.png')]);
    await user.click(within(dialog).getByRole('combobox', { name: 'Visibility' }));
    await user.click(await screen.findByRole('option', { name: 'Public' }));
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }));

    expect(await screen.findByText('Images uploaded')).toBeInTheDocument();
    const body = sent as FormData | null;
    expect(body?.getAll('images')).toHaveLength(2);
    expect(body?.get('visibility')).toBe('Public');
    expect(body?.get('order')).toBe('2');
    expect(body?.has('publishAt')).toBe(false);
  });

  it('shows the backend message when an upload is refused', async () => {
    renderPage();
    server.use(http.post('*/api/home-hero-posts', () => fail(400, 'Only image files are allowed')));
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Upload Images' }));
    const dialog = await screen.findByRole('dialog');
    await user.upload(fileInput(dialog), png());
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }));

    expect(await within(dialog).findByText('Only image files are allowed')).toBeInTheDocument();
  });

  it('edits an image with its current values filled in', async () => {
    let url = '';
    let sent: FormData | null = null;
    renderPage();
    server.use(
      http.put('*/api/home-hero-posts/:id', async ({ request }) => {
        url = request.url;
        sent = await request.formData();
        return ok(FIRST);
      }),
    );
    const user = userEvent.setup();

    await openMenuItem(1, 'Edit');
    const dialog = await screen.findByRole('dialog', { name: 'Edit Header Image' });
    expect(within(dialog).getByRole('combobox', { name: 'Visibility' })).toHaveTextContent(
      'Public',
    );
    expect(within(dialog).getByLabelText('Position')).toHaveValue(0);
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Image updated')).toBeInTheDocument();
    expect(url).toContain(`/api/home-hero-posts/${FIRST._id}`);
    const body = sent as FormData | null;
    expect(body?.get('visibility')).toBe('Public');
    expect(body?.get('publishAt')).toBe('');
    expect(body?.has('image')).toBe(false);
  });

  it('makes a private image public at once', async () => {
    let sent: FormData | null = null;
    renderPage();
    server.use(
      http.put('*/api/home-hero-posts/:id', async ({ request }) => {
        sent = await request.formData();
        return ok(SECOND);
      }),
    );

    await openMenuItem(2, 'Make Public');

    expect(await screen.findByText('Image updated')).toBeInTheDocument();
    const body = sent as FormData | null;
    expect(body?.get('visibility')).toBe('Public');
    expect(body?.get('publishAt')).toBe('');
  });

  it('moves an image down and saves the new order', async () => {
    let orderedIds: unknown;
    renderPage();
    server.use(
      http.patch('*/api/home-hero-posts/reorder', async ({ request }) => {
        orderedIds = ((await request.json()) as { orderedIds: unknown }).orderedIds;
        return ok(undefined);
      }),
    );

    await openMenuItem(1, 'Move Down');

    expect(await screen.findByText('Order saved')).toBeInTheDocument();
    expect(orderedIds).toEqual([SECOND._id, FIRST._id]);
  });

  it('disables Move Up on the first image', async () => {
    renderPage();
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Actions for image 1' }));

    expect(await screen.findByRole('menuitem', { name: 'Move Up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('deletes an image after confirmation', async () => {
    let deleted = '';
    renderPage();
    server.use(
      http.delete('*/api/home-hero-posts/:id', ({ params }) => {
        deleted = String(params.id);
        return ok(undefined);
      }),
    );
    const user = userEvent.setup();

    await openMenuItem(2, 'Delete');
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('header image 2');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Image deleted')).toBeInTheDocument();
    expect(deleted).toBe(SECOND._id);
  });

  it('opens the details of an image', async () => {
    renderPage();
    await openMenuItem(1, 'View Details');

    const dialog = await screen.findByRole('dialog', { name: 'Header Image Details' });
    expect(
      within(dialog).getByRole('img', { name: 'Homepage header preview' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('2048 x 460px')).toBeInTheDocument();
  });

  it('sends a Moderator away (managers only, as the backend allows)', async () => {
    renderPage({}, 'Moderator');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/admin/courses');
    });
    expect(screen.queryByRole('button', { name: 'Upload Images' })).not.toBeInTheDocument();
  });
});
