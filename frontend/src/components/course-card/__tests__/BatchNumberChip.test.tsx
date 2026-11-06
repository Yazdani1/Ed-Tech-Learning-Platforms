import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import i18n from '@/i18n/i18n';
import { renderWithProviders } from '@/test/render';

import { BatchNumberChip } from '../BatchNumberChip';

describe('BatchNumberChip', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows "Batch 1234"', () => {
    renderWithProviders(<BatchNumberChip batchNumber="1234" />);
    expect(screen.getByText('Batch 1234')).toBeInTheDocument();
  });

  it('shows the dark tone chip on the course page banner', () => {
    renderWithProviders(<BatchNumberChip batchNumber="0042" tone="dark" />);
    expect(screen.getByText('Batch 0042')).toBeInTheDocument();
  });

  it('shows nothing without a batch number', () => {
    renderWithProviders(<BatchNumberChip batchNumber={null} />);
    expect(screen.queryByText(/Batch/)).not.toBeInTheDocument();
  });

  it('writes the digits in Bangla', async () => {
    await i18n.changeLanguage('bn');
    renderWithProviders(<BatchNumberChip batchNumber="1234" />);
    expect(screen.getByText(/১২৩৪/)).toBeInTheDocument();
  });
});
