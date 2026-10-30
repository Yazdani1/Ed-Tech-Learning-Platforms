import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { ResponsiveDataView, type DataColumn } from '../ResponsiveDataView';

import type { ReactElement } from 'react';

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: '1', name: 'Algebra' },
  { id: '2', name: 'Physics' },
];
const COLUMNS: DataColumn<Row>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
  { key: 'id', header: 'Code', render: (row) => `#${row.id}`, hideOnMobile: true },
];
const DESKTOP = 1280;
const PHONE = 360;

/** Pretends the window is this wide: min-width queries match accordingly (md breakpoint = 900 px). */
const setViewportWidth = (width: number): void => {
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    return {
      matches: min ? width >= Number(min[1]) : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
  });
};

type ViewProps = Partial<Parameters<typeof ResponsiveDataView<Row>>[0]>;

const view = (props: ViewProps = {}): ReactElement => (
  <ResponsiveDataView
    rows={ROWS}
    columns={COLUMNS}
    getRowId={(row) => row.id}
    label="Courses"
    isLoading={false}
    error={null}
    {...props}
  />
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ResponsiveDataView', () => {
  it('shows a table from the md breakpoint up', () => {
    setViewportWidth(DESKTOP);
    renderWithProviders(view());

    const table = screen.getByRole('table', { name: 'Courses' });
    expect(within(table).getByRole('columnheader', { name: 'Code' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(ROWS.length + 1);
  });

  it('shows one card per row on phones, without the hidden columns', () => {
    setViewportWidth(PHONE);
    renderWithProviders(view());

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Courses' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(ROWS.length);
    expect(within(list).getByText('Algebra')).toBeInTheDocument();
    expect(within(list).queryByText('#1')).not.toBeInTheDocument();
  });

  it('opens a clickable row from the keyboard, in the table and in the cards', async () => {
    const opened: string[] = [];
    const onRowClick = (row: Row): void => {
      opened.push(row.name);
    };
    const user = userEvent.setup();
    setViewportWidth(DESKTOP);
    const desktop = renderWithProviders(view({ onRowClick }));

    await user.tab();
    await user.keyboard('{Enter}');
    expect(opened).toEqual(['Algebra']);
    desktop.unmount();

    setViewportWidth(PHONE);
    renderWithProviders(view({ onRowClick }));
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(ROWS.length);
    cards[1]?.focus();
    await user.keyboard(' ');
    expect(opened).toEqual(['Algebra', 'Physics']);
  });

  it('rows are not focusable when they are not clickable', () => {
    setViewportWidth(PHONE);
    renderWithProviders(view());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the empty text, and the error with a retry button', async () => {
    setViewportWidth(DESKTOP);
    const onRetry = vi.fn();
    const empty = renderWithProviders(view({ rows: [], emptyText: 'No courses yet' }));
    expect(screen.getByText('No courses yet')).toBeInTheDocument();
    empty.unmount();

    renderWithProviders(view({ rows: [], error: new Error('Server down'), onRetry }));
    expect(screen.getByRole('alert')).toHaveTextContent('Server down');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows skeletons while loading and the pagination under the list', () => {
    setViewportWidth(DESKTOP);
    const loading = renderWithProviders(view({ rows: [], isLoading: true }));
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    loading.unmount();

    renderWithProviders(
      view({ pagination: { page: 1, limit: 2, total: 5, onPageChange: vi.fn() } }),
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
  });
});
