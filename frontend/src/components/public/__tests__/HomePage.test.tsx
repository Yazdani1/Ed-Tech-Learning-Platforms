import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fail, makeUser, ok, signedInAs } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { makeEnrolledCourse } from '@/components/student/__tests__/fixtures';

import { HomePage } from '../home/HomePage';

import { browsePage, makeCategory, makeCourse, makeTeacher } from './public-fixtures';

// jsdom has no WebGL: the decorative 3D scene is left out of these tests
vi.mock('../home/ThreeLearningScene', () => ({ default: () => null }));

const course = makeCourse();

describe('HomePage', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/home-hero-posts/public', () => ok([])),
      http.get('*/api/categories', () => ok([makeCategory()])),
      http.get('*/api/course-types', () =>
        ok([{ _id: '650000000000000000000009', name: 'Recorded', description: '' }]),
      ),
      http.get('*/api/teachers', () => ok([makeTeacher()])),
      http.get('*/api/courses/browse', () => browsePage([course])),
    );
  });

  it('shows categories that open the filtered catalog', async () => {
    renderWithProviders(<HomePage />);

    const link = await screen.findByRole('link', { name: /Programming/ });
    expect(link).toHaveAttribute('href', '/courses?categories=650000000000000000000001');
  });

  it('shows the popular courses with their price and discount', async () => {
    renderWithProviders(<HomePage />);

    const card = await screen.findByRole('link', { name: /TypeScript Basics/ });
    expect(card).toHaveAttribute('href', `/courses/${course._id}`);
    expect(within(card).getByText('৳800')).toBeInTheDocument();
    expect(within(card).getByText('৳1,000')).toBeInTheDocument();
    expect(within(card).getByText('20% off')).toBeInTheDocument();
    expect(within(card).getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('shows learning paths from the course types with the fallback text', async () => {
    renderWithProviders(<HomePage />);

    const path = await screen.findByRole('link', { name: /Path 1/ });
    expect(path).toHaveAttribute('href', '/courses?courseTypes=650000000000000000000009');
    expect(within(path).getByText(/Explore courses, teachers/)).toBeInTheDocument();
  });

  it('shows the instructors band', async () => {
    renderWithProviders(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Our Instructors' })).toBeInTheDocument();
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);
  });

  it('says when there are no published courses yet', async () => {
    server.use(http.get('*/api/courses/browse', () => browsePage([])));
    renderWithProviders(<HomePage />);

    expect(await screen.findByText('No published courses yet.')).toBeInTheDocument();
  });

  it('shows the error with a retry when courses cannot load', async () => {
    server.use(http.get('*/api/courses/browse', () => fail(500, 'Server error')));
    renderWithProviders(<HomePage />);

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('offers "Continue Learning" on courses a signed-in Student is enrolled in', async () => {
    server.use(
      signedInAs(makeUser('Student')),
      http.get('*/api/enrollments', () =>
        ok([makeEnrolledCourse({ _id: course._id, title: course.title })]),
      ),
    );
    renderWithProviders(<HomePage />);

    expect(await screen.findByRole('link', { name: 'Continue Learning' })).toHaveAttribute(
      'href',
      `/student/courses/${course._id}/learn`,
    );
  });

  it('does not ask for enrolments when the visitor is not a Student', async () => {
    let enrolmentsAsked = false;
    server.use(
      signedInAs(makeUser('Admin')),
      http.get('*/api/enrollments', () => {
        enrolmentsAsked = true;
        return ok([]);
      }),
    );
    renderWithProviders(<HomePage />);

    await screen.findByRole('link', { name: /TypeScript Basics/ });
    expect(enrolmentsAsked).toBe(false);
    expect(screen.queryByRole('link', { name: 'Continue Learning' })).not.toBeInTheDocument();
  });

  describe('showcase slider', () => {
    const posts = [
      { _id: 'p1', imageUrl: 'https://res.cloudinary.com/demo/one.jpg', order: 0 },
      { _id: 'p2', imageUrl: 'https://res.cloudinary.com/demo/two.jpg', order: 1 },
    ];

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('can be paused and played again', async () => {
      server.use(http.get('*/api/home-hero-posts/public', () => ok(posts)));
      renderWithProviders(<HomePage />);
      const user = userEvent.setup();

      await user.click(await screen.findByRole('button', { name: 'Pause slideshow' }));
      await user.click(screen.getByRole('button', { name: 'Play slideshow' }));
      expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Show header image 2' }));
      expect(screen.getByRole('button', { name: 'Show header image 2' })).toHaveAttribute(
        'aria-current',
        'true',
      );
    });

    it('starts paused for people who prefer reduced motion', async () => {
      vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }));
      server.use(http.get('*/api/home-hero-posts/public', () => ok(posts)));
      renderWithProviders(<HomePage />);

      expect(await screen.findByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
    });
  });
});
