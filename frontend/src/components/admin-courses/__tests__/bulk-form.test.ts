import { describe, expect, it } from 'vitest';

import {
  buildDiscountRequest,
  buildUpdateRequest,
  CLEAR_COURSE_TYPE,
  emptyAnnouncement,
  emptyFields,
} from '../bulk/bulk-form';

const IDS = ['a'];
const NOW = Date.parse('2026-10-31T10:00:00Z');

describe('buildUpdateRequest', () => {
  it('sends only the filled fields', () => {
    const result = buildUpdateRequest(
      IDS,
      { ...emptyFields(), status: 'Draft', courseType: CLEAR_COURSE_TYPE, teacherIds: ['t1'] },
      emptyAnnouncement(),
      'fields',
    );
    expect(result).toEqual({
      ok: true,
      body: { courseIds: IDS, updates: { status: 'Draft', courseType: null, teachers: ['t1'] } },
    });
  });

  it('needs a positive price for Paid and clears the price for Free', () => {
    expect(
      buildUpdateRequest(
        IDS,
        { ...emptyFields(), pricing: 'Paid', price: '' },
        emptyAnnouncement(),
        'fields',
      ),
    ).toEqual({ ok: false, error: 'price' });
    expect(
      buildUpdateRequest(
        IDS,
        { ...emptyFields(), pricing: 'Paid', price: '900' },
        emptyAnnouncement(),
        'fields',
      ),
    ).toMatchObject({ ok: true, body: { updates: { pricing: 'Paid', price: 900 } } });
    expect(
      buildUpdateRequest(IDS, { ...emptyFields(), pricing: 'Free' }, emptyAnnouncement(), 'fields'),
    ).toMatchObject({ ok: true, body: { updates: { pricing: 'Free', price: null } } });
  });

  it('sends the subscription only once it was touched', () => {
    const touched = {
      ...emptyFields(),
      subscriptionIncluded: true,
      subscriptionPlans: ['Gold'],
      subscriptionEdited: true,
    };
    expect(buildUpdateRequest(IDS, touched, emptyAnnouncement(), 'fields')).toMatchObject({
      body: { updates: { includedInSubscription: true, allowedSubscriptionPlans: ['Gold'] } },
    });
  });

  it('refuses an empty change and requires the announcement on its tab', () => {
    expect(buildUpdateRequest(IDS, emptyFields(), emptyAnnouncement(), 'fields')).toEqual({
      ok: false,
      error: 'nothing',
    });
    expect(
      buildUpdateRequest(
        IDS,
        { ...emptyFields(), status: 'Draft' },
        { title: 'Hi', description: '<p></p>' },
        'announcement',
      ),
    ).toEqual({ ok: false, error: 'announcement' });
  });

  it('sends the announcement rich text as written (an editor paragraph without text counts as empty)', () => {
    const result = buildUpdateRequest(
      IDS,
      emptyFields(),
      { title: ' Exam ', description: '<p>Line <strong>1</strong></p><p>Next</p>' },
      'announcement',
    );
    expect(result).toEqual({
      ok: true,
      body: {
        courseIds: IDS,
        announcement: {
          title: 'Exam',
          description: '<p>Line <strong>1</strong></p><p>Next</p>',
        },
      },
    });
  });
});

describe('buildDiscountRequest', () => {
  it('checks the percentage and the end date', () => {
    expect(
      buildDiscountRequest(IDS, { discountPercent: '0', discountEndsAt: '2026-12-01T10:00' }, NOW),
    ).toEqual({ ok: false, error: 'percent' });
    expect(
      buildDiscountRequest(
        IDS,
        { discountPercent: '100', discountEndsAt: '2026-12-01T10:00' },
        NOW,
      ),
    ).toEqual({ ok: false, error: 'percent' });
    expect(
      buildDiscountRequest(IDS, { discountPercent: '20', discountEndsAt: '2026-01-01T10:00' }, NOW),
    ).toEqual({ ok: false, error: 'endsAt' });
    expect(buildDiscountRequest(IDS, { discountPercent: '20', discountEndsAt: '' }, NOW)).toEqual({
      ok: false,
      error: 'endsAt',
    });
  });

  it('builds the request with a UTC end date', () => {
    const result = buildDiscountRequest(
      IDS,
      { discountPercent: '25', discountEndsAt: '2026-12-01T10:00' },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.discountPercent).toBe(25);
      expect(result.body.discountEndsAt).toMatch(/Z$/);
    }
  });
});
