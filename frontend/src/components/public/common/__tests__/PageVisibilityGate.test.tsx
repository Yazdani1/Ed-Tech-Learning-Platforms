import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';

import { PageVisibilityGate } from '../PageVisibilityGate';

const CONTACT = { phone: '', whatsapp: '', email: '', address: '' };

describe('PageVisibilityGate', () => {
  it('shows the page while it is switched on', async () => {
    renderWithProviders(
      <PageVisibilityGate pageKey="pricing">
        <p>Pricing content</p>
      </PageVisibilityGate>,
    );

    expect(await screen.findByText('Pricing content')).toBeInTheDocument();
  });

  it('shows "Page not found" instead of a hidden page, but not for other pages', async () => {
    server.use(
      http.get('*/api/site-settings/public', () =>
        ok({ hiddenPages: ['pricing'], contact: CONTACT }),
      ),
    );
    renderWithProviders(
      <>
        <PageVisibilityGate pageKey="pricing">
          <p>Pricing content</p>
        </PageVisibilityGate>
        <PageVisibilityGate pageKey="teachers">
          <p>Teachers content</p>
        </PageVisibilityGate>
      </>,
    );

    expect(await screen.findByText('Teachers content')).toBeInTheDocument();
    expect(screen.queryByText('Pricing content')).not.toBeInTheDocument();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it('shows the page when the settings cannot be read (a backend hiccup never hides the site)', async () => {
    server.use(http.get('*/api/site-settings/public', () => fail(500, 'down')));
    renderWithProviders(
      <PageVisibilityGate pageKey="courses">
        <p>Courses content</p>
      </PageVisibilityGate>,
    );

    expect(await screen.findByText('Courses content')).toBeInTheDocument();
  });
});
