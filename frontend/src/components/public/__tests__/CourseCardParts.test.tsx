import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { requirementIcon } from '@/components/browse/detail/extras/requirement-icon';
import i18n from '@/i18n/i18n';
import { renderWithProviders } from '@/test/render';

import { CourseCardPrice } from '../common/CourseCardPrice';
import { CourseStartDay } from '../common/CourseStartDay';
import { categoryIcon } from '../home/category-icon';

const PAID = { pricing: 'Paid', price: 800, listPrice: 1000, discountPrice: 800 } as const;

describe('CourseStartDay', () => {
  it('shows the coming date, that registration is open after it, or that it is still to come', () => {
    const { unmount } = renderWithProviders(
      <CourseStartDay startDate="2099-12-05T12:00:00.000Z" />,
    );
    expect(screen.getByText(/^Dec \d, 2099$/)).toBeInTheDocument();
    expect(screen.getByText('Course Start Date:')).toBeInTheDocument();
    unmount();

    const past = renderWithProviders(<CourseStartDay startDate="2000-01-05T12:00:00.000Z" />);
    expect(screen.getByText('Registration open')).toBeInTheDocument();
    expect(screen.queryByText('Course Start Date:')).not.toBeInTheDocument();
    past.unmount();

    renderWithProviders(<CourseStartDay startDate={null} />);
    expect(screen.getByText('To be announced')).toBeInTheDocument();
  });
});

describe('CourseCardPrice', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows the price, the struck list price and both chips while a discount runs', () => {
    renderWithProviders(<CourseCardPrice course={PAID} />);
    expect(screen.getByText('৳800')).toBeInTheDocument();
    expect(screen.getByText('৳1,000').tagName).toBe('S');
    expect(screen.getByText('20% off')).toBeInTheDocument();
    expect(screen.getByText('Save ৳200')).toBeInTheDocument();
  });

  it('shows no chips without a discount or on a free course', () => {
    const { unmount } = renderWithProviders(
      <CourseCardPrice course={{ pricing: 'Paid', price: 500, listPrice: 500 }} />,
    );
    expect(screen.getByText('৳500')).toBeInTheDocument();
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<CourseCardPrice course={{ pricing: 'Free' }} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.queryByText(/Scholarship|% off|Save/)).not.toBeInTheDocument();
  });

  it('writes Bangla digits for Bangla readers', async () => {
    await i18n.changeLanguage('bn');
    renderWithProviders(<CourseCardPrice course={PAID} />);
    expect(screen.getByText('৳৮০০')).toBeInTheDocument();
    expect(screen.getByText('৳১,০০০')).toBeInTheDocument();
  });
});

describe('icons chosen from text', () => {
  it.each([
    ['Data Science', 'PollOutlinedIcon'],
    ['ডিজাইন ও ইউএক্স', 'BrushOutlinedIcon'],
    ['Spoken English', 'TranslateIcon'],
    ['Web Development', 'TerminalIcon'],
    ['Business', 'InsightsIcon'],
    ['Cooking', 'CategoryOutlinedIcon'],
  ])('category "%s" gets %s', (name, testId) => {
    render(<>{categoryIcon(name)}</>);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });

  it.each([
    ['A Laptop / PC', 'LaptopMacIcon'],
    ['Stable Internet', 'WifiIcon'],
    ['Basic Computer Fluency', 'PsychologyOutlinedIcon'],
    ['A notebook', 'BuildOutlinedIcon'],
  ])('requirement "%s" gets %s', (text, testId) => {
    render(<>{requirementIcon(text)}</>);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
