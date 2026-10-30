import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { PublicTeachersPage } from '../teachers/PublicTeachersPage';

import { makeTeacher } from './public-fixtures';

describe('PublicTeachersPage', () => {
  it('shows every teacher with subjects, bio and safe social links', async () => {
    server.use(
      http.get('*/api/teachers', () =>
        ok([
          makeTeacher({
            expertise: ['Math', 'Code', 'Logic', 'Music', 'Art'],
            socialLinks: {
              linkedin: 'https://linkedin.com/in/ada',
              website: 'javascript:alert(1)',
            },
          }),
        ]),
      ),
    );
    renderWithProviders(<PublicTeachersPage />);

    const card = await screen.findByRole('article');
    expect(within(card).getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(within(card).getByText('Teaches programming.')).toBeInTheDocument();
    expect(within(card).getByText('+1')).toBeInTheDocument();
    const linkedIn = within(card).getByRole('link', { name: 'Ada Lovelace on LinkedIn' });
    expect(linkedIn).toHaveAttribute('href', 'https://linkedin.com/in/ada');
    expect(linkedIn).toHaveAttribute('rel', 'noopener noreferrer');
    // A javascript: address is never rendered as a link
    expect(within(card).queryByRole('link', { name: /Website/ })).not.toBeInTheDocument();
  });

  it('says when there are no teachers', async () => {
    server.use(http.get('*/api/teachers', () => ok([])));
    renderWithProviders(<PublicTeachersPage />);

    expect(await screen.findByText('No teachers found.')).toBeInTheDocument();
  });

  it('shows the error when the list cannot load', async () => {
    server.use(http.get('*/api/teachers', () => fail(500, 'Server error')));
    renderWithProviders(<PublicTeachersPage />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('shows a loading state first', () => {
    server.use(http.get('*/api/teachers', () => ok([])));
    renderWithProviders(<PublicTeachersPage />);

    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Our Instructors' })).toBeInTheDocument();
  });
});
