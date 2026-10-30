import { describe, expect, it } from 'vitest';

import { coursesHref } from '../common/public-links';
import { splitRemaining } from '../layout/countdown';
import {
  accentColor,
  billingPeriods,
  defaultPeriod,
  getSavings,
  isCurrentPlan,
  runningSubscription,
} from '../pricing/pricing.utils';

import { makePlan, makeSubscription } from './public-fixtures';

const NOW = Date.parse('2026-06-01T00:00:00.000Z');

describe('public-site helpers', () => {
  it('builds catalog addresses with the backend filter names', () => {
    expect(coursesHref({})).toBe('/courses');
    expect(coursesHref({ search: 'a b' })).toBe('/courses?search=a+b');
    expect(coursesHref({ categories: 'x' })).toBe('/courses?categories=x');
  });

  it('splits the countdown into days, hours, minutes and seconds', () => {
    expect(splitRemaining(90_061_000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 });
    expect(splitRemaining(-5)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('lists billing periods and picks monthly first', () => {
    const plans = [makePlan(), makePlan({ billingOptions: [], duration: 3, price: 1200 })];
    expect(billingPeriods(plans)).toEqual([1, 3, 12]);
    expect(defaultPeriod([3, 12])).toBe(3);
    expect(defaultPeriod([])).toBeNull();
  });

  it('computes the saving against paying monthly', () => {
    const options = makePlan().billingOptions;
    expect(getSavings(options, options[1])).toEqual({
      savings: 1200,
      percent: 20,
      monthlyEquivalent: 400,
    });
    expect(getSavings(options, options[0])).toBeNull();
  });

  it('uses only hex colours from admins', () => {
    expect(accentColor(makePlan({ color: '#abcdef' }))).toBe('#abcdef');
    expect(accentColor(makePlan({ color: 'red;background:url(x)' }))).toBe('#7c3aed');
  });

  it('knows the running plan and whether a card is the current one', () => {
    const running = runningSubscription(makeSubscription(), NOW);
    expect(running).not.toBeNull();
    expect(
      runningSubscription(makeSubscription({ endDate: '2026-01-01T00:00:00.000Z' }), NOW),
    ).toBeNull();
    expect(isCurrentPlan(running, 'Premium', 1)).toBe(true);
    expect(isCurrentPlan(running, 'Premium', 12)).toBe(false);
    expect(isCurrentPlan(null, 'Premium', 1)).toBe(false);
  });
});
