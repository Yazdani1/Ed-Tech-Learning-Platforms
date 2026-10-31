import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { toDateTimeInput } from '@/utils/dateTime';

import { BulkEditModal } from '../bulk/BulkEditModal';

import { makeCourse, referenceHandlers } from './admin-courses-fixtures';

const REACT = makeCourse('001', { title: 'React Basics' });
const NODE = makeCourse('002', { title: 'Node Advanced', status: 'Draft', pricing: 'Free' });
const DAY_MS = 86_400_000;

const renderModal = () => {
  const onClose = vi.fn();
  server.use(signedInAs(makeUser('Admin')), ...referenceHandlers());
  renderWithProviders(<BulkEditModal open courses={[REACT, NODE]} onClose={onClose} />);
  return { onClose, user: userEvent.setup() };
};

describe('BulkEditModal', () => {
  it('filters the course list and selects all visible courses', async () => {
    const { user } = renderModal();
    const dialog = await screen.findByRole('dialog', { name: /Bulk Edit Courses/ });

    expect(within(dialog).getByRole('button', { name: 'Apply' })).toBeDisabled();
    const selector = within(dialog).getByRole('region', { name: 'Courses to update' });
    await user.click(within(selector).getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'Draft' }));
    expect(within(dialog).queryByText('React Basics')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('checkbox', { name: 'Select all (1)' }));
    expect(within(dialog).getByText('1 course selected')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Apply to 1 course' })).toBeEnabled();
  });

  it('updates the chosen fields of the selected courses', async () => {
    let body: unknown;
    server.use(
      http.patch('*/api/courses/bulk', async ({ request }) => {
        body = await request.json();
        return ok(null);
      }),
    );
    const { user, onClose } = renderModal();
    const dialog = await screen.findByRole('dialog', { name: /Bulk Edit Courses/ });

    await user.click(within(dialog).getByRole('checkbox', { name: 'React Basics' }));
    const panel = within(dialog).getByRole('tabpanel');
    await user.click(within(panel).getByRole('combobox', { name: 'Visibility' }));
    await user.click(await screen.findByRole('option', { name: 'Private' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply to 1 course' }));

    expect(await screen.findByText('Updated 1 course')).toBeInTheDocument();
    expect(body).toEqual({ courseIds: [REACT._id], updates: { visibility: 'Private' } });
    expect(onClose).toHaveBeenCalled();
  });

  it('says what is missing instead of sending an empty change', async () => {
    const { user } = renderModal();
    const dialog = await screen.findByRole('dialog', { name: /Bulk Edit Courses/ });

    await user.click(within(dialog).getByRole('checkbox', { name: 'React Basics' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply to 1 course' }));
    expect(await screen.findByText('Fill in at least one field to update')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('tab', { name: 'Post Announcement' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply to 1 course' }));
    expect(
      await screen.findByText('Announcement title and description are required'),
    ).toBeInTheDocument();
  });

  it('applies a discount campaign and shows a backend error as is', async () => {
    let body: { discountPercent?: number; courseIds?: string[] } = {};
    let status = 400;
    server.use(
      http.patch('*/api/courses/bulk/discount', async ({ request }) => {
        body = (await request.json()) as typeof body;
        return status === 400 ? fail(400, 'Every course needs a list price above 0') : ok(null);
      }),
    );
    const { user } = renderModal();
    const dialog = await screen.findByRole('dialog', { name: /Bulk Edit Courses/ });

    await user.click(within(dialog).getByRole('checkbox', { name: 'React Basics' }));
    await user.click(within(dialog).getByRole('tab', { name: 'Discount Campaign' }));
    await user.click(within(dialog).getByRole('button', { name: 'Apply to 1 course' }));
    expect(
      await screen.findByText('Discount percentage must be between 1 and 99'),
    ).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Discount Percentage'), '30');
    await user.type(
      within(dialog).getByLabelText('Discount Ends At'),
      toDateTimeInput(new Date(Date.now() + DAY_MS)),
    );
    expect(within(dialog).getByText('1 selected course will get 30% off')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Apply to 1 course' }));
    expect(await screen.findByText('Every course needs a list price above 0')).toBeInTheDocument();

    status = 200;
    await user.click(within(dialog).getByRole('button', { name: 'Apply to 1 course' }));
    expect(await screen.findByText('Discount applied to 1 course')).toBeInTheDocument();
    expect(body).toMatchObject({ courseIds: [REACT._id], discountPercent: 30 });
  });
});
