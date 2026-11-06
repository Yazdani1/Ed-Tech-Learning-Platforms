import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { lastOf } from '@/test/pick';
import { renderWithProviders } from '@/test/render';

import { BulkEditModal } from '../bulk/BulkEditModal';

import { makeCourse, referenceHandlers } from './admin-courses-fixtures';

const REACT = makeCourse('001', { title: 'React Basics' });
const NODE = makeCourse('002', { title: 'Node Advanced', status: 'Draft', pricing: 'Free' });

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
    await user.click(lastOf(within(dialog).getAllByRole('combobox', { name: 'Visibility' })));
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
  });

  it('has only the fields to update (no tabs, discount or announcement)', async () => {
    renderModal();
    const dialog = await screen.findByRole('dialog', { name: /Bulk Edit Courses/ });

    expect(within(dialog).getByRole('heading', { name: 'Update Fields' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('tab')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Discount Campaign')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Post Announcement')).not.toBeInTheDocument();
  });
});
