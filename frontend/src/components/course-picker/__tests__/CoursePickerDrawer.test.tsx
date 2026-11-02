import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n/i18n';
import { ApiError } from '@/services/http.service';
import { renderWithProviders } from '@/test/render';

import { courseSelectionLabel } from '../course-picker.utils';
import { CoursePickerDrawer } from '../CoursePickerDrawer';

import type { PickerCourse } from '../course-picker.types';
import type { FC } from 'react';

const COURSES: PickerCourse[] = [
  { _id: 'a1', title: 'Algebra 101', status: 'Published', count: 3 },
  { _id: 'b2', title: 'Biology', status: 'Draft', count: 0 },
];

const query = (overrides: Partial<Parameters<typeof CoursePickerDrawer>[0]['courses']> = {}) => ({
  data: COURSES,
  isPending: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

interface HarnessProps {
  onApply: (ids: string[]) => void;
  initial?: string[];
}

/** Opens and closes the drawer like a page does, keeping the applied selection. */
const Harness: FC<HarnessProps> = ({ onApply, initial = [] }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        open picker
      </button>
      <CoursePickerDrawer
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Select courses"
        courses={query()}
        selectedIds={initial}
        countLabel={(count) => `${String(count)} students`}
        onApply={(ids) => {
          onApply(ids);
          setOpen(false);
        }}
      />
    </>
  );
};

const openPicker = async (): Promise<HTMLElement> => {
  await userEvent.click(screen.getByRole('button', { name: 'open picker' }));
  return screen.findByRole('list', { name: 'Courses' });
};

describe('CoursePickerDrawer', () => {
  it('closing without Apply drops the ticks; reopening starts from the applied selection', async () => {
    const onApply = vi.fn();
    renderWithProviders(<Harness onApply={onApply} initial={['b2']} />);

    let list = await openPicker();
    expect(within(list).getByRole('checkbox', { name: 'Biology' })).toBeChecked();
    await userEvent.click(within(list).getByRole('checkbox', { name: 'Algebra 101' }));
    expect(within(list).getByRole('checkbox', { name: 'Algebra 101' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('list', { name: 'Courses' })).not.toBeInTheDocument();
    });

    list = await openPicker();
    expect(within(list).getByRole('checkbox', { name: 'Algebra 101' })).not.toBeChecked();
    expect(within(list).getByRole('checkbox', { name: 'Biology' })).toBeChecked();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('keeps the ticks of courses hidden by the search when applying', async () => {
    const onApply = vi.fn();
    renderWithProviders(<Harness onApply={onApply} />);

    const list = await openPicker();
    await userEvent.click(within(list).getByRole('checkbox', { name: 'Biology' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search for a keyword' }), 'alg');
    await userEvent.click(within(list).getByRole('checkbox', { name: 'Algebra 101' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply (2 courses)' }));
    expect(onApply).toHaveBeenLastCalledWith(['b2', 'a1']);
  });

  it('"Clear" empties the selection and "Show all courses" applies it', async () => {
    const onApply = vi.fn();
    renderWithProviders(<Harness onApply={onApply} initial={['a1']} />);

    const list = await openPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(within(list).getByRole('checkbox', { name: 'All courses' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Show all courses' }));
    expect(onApply).toHaveBeenLastCalledWith([]);
  });

  it('shows the loading skeleton and the error with a retry', () => {
    const refetch = vi.fn();
    const { rerender } = renderWithProviders(
      <CoursePickerDrawer
        open
        onClose={vi.fn()}
        title="Select courses"
        courses={query({ data: undefined, isPending: true })}
        selectedIds={[]}
        countLabel={String}
        onApply={vi.fn()}
      />,
    );
    expect(screen.queryByRole('list', { name: 'Courses' })).not.toBeInTheDocument();

    rerender(
      <CoursePickerDrawer
        open
        onClose={vi.fn()}
        title="Select courses"
        courses={query({ data: undefined, error: new ApiError(500, 'Server error'), refetch })}
        selectedIds={[]}
        countLabel={String}
        onApply={vi.fn()}
      />,
    );
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });
});

describe('courseSelectionLabel', () => {
  const t = i18n.getFixedT('en');

  it('says "All courses", the one title, or the number of courses', () => {
    expect(courseSelectionLabel(t, [], COURSES)).toBe('All courses');
    expect(courseSelectionLabel(t, ['a1'], COURSES)).toBe('Algebra 101');
    expect(courseSelectionLabel(t, ['a1', 'b2'], COURSES)).toBe('2 courses');
    // A selected course that no longer exists still counts
    expect(courseSelectionLabel(t, ['gone'], COURSES)).toBe('1 course');
  });
});
