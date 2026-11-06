import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CourseDetailSkeleton } from '@/components/browse/detail/CourseDetailSkeleton';
import { LearnSkeleton } from '@/components/learn/LearnSkeleton';
import { CourseSectionSkeleton } from '@/components/public/common/CourseSectionSkeleton';
import { HomeCourseCardSkeleton } from '@/components/public/common/HomeCourseCardSkeleton';
import { renderWithProviders } from '@/test/render';

describe('loading skeletons', () => {
  it('the course page placeholder is announced as busy', () => {
    renderWithProviders(<CourseDetailSkeleton />);
    expect(screen.getByLabelText('Loading...')).toHaveAttribute('aria-busy', 'true');
  });

  it('the course-type box placeholder holds three card placeholders', () => {
    const { container } = renderWithProviders(<CourseSectionSkeleton />);
    expect(screen.getByLabelText('Loading...')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('[aria-hidden="true"].MuiCard-root')).toHaveLength(3);
  });

  it('the home card placeholder is hidden from screen readers', () => {
    const { container } = renderWithProviders(<HomeCourseCardSkeleton />);
    expect(container.querySelector('.MuiCard-root')).toHaveAttribute('aria-hidden', 'true');
  });

  it('the course player placeholder is announced as busy', () => {
    const { container } = renderWithProviders(<LearnSkeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });
});
