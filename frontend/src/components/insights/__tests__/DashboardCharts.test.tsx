import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

import DashboardCharts from '../dashboard/DashboardCharts';

import { makeSummary, stubResizeObserver } from './fixtures';

// The dashboard loads this part with next/dynamic; here it is rendered directly.
describe('DashboardCharts', () => {
  beforeEach(() => {
    stubResizeObserver();
  });

  it('shows one titled panel per chart', () => {
    renderWithProviders(<DashboardCharts summary={makeSummary()} />);

    for (const title of [
      'Revenue, Last 30 Days',
      'Paid Enrollments, Last 30 Days',
      'Users By Role',
      'Course Status',
      'Course Pricing',
    ]) {
      expect(screen.getByRole('figure', { name: title })).toBeInTheDocument();
    }
  });
});
