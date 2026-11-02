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

  it('shows one titled panel per revenue / enrolment chart', () => {
    renderWithProviders(<DashboardCharts summary={makeSummary()} />);

    for (const title of [
      'Daily revenue, last 30 days',
      'Daily enrollments, last 30 days',
      'Monthly revenue, last 12 months',
      'Revenue by source (all time)',
    ]) {
      expect(screen.getByRole('figure', { name: title })).toBeInTheDocument();
    }
  });

  it('no longer shows the users-by-role, course status or course pricing charts', () => {
    renderWithProviders(<DashboardCharts summary={makeSummary()} />);

    expect(screen.getAllByRole('figure')).toHaveLength(4);
    expect(screen.queryByRole('figure', { name: /role|status|pricing/i })).not.toBeInTheDocument();
  });
});
