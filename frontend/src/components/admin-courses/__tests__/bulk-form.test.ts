import { describe, expect, it } from 'vitest';

import { buildUpdateRequest, CLEAR_COURSE_TYPE, emptyFields } from '../bulk/bulk-form';

const IDS = ['a'];

describe('buildUpdateRequest', () => {
  it('sends only the filled fields', () => {
    const result = buildUpdateRequest(IDS, {
      ...emptyFields(),
      status: 'Draft',
      courseType: CLEAR_COURSE_TYPE,
      teacherIds: ['t1'],
    });
    expect(result).toEqual({
      ok: true,
      body: { courseIds: IDS, updates: { status: 'Draft', courseType: null, teachers: ['t1'] } },
    });
  });

  it('needs a positive price for Paid and clears the price for Free', () => {
    expect(buildUpdateRequest(IDS, { ...emptyFields(), pricing: 'Paid', price: '' })).toEqual({
      ok: false,
      error: 'price',
    });
    expect(
      buildUpdateRequest(IDS, { ...emptyFields(), pricing: 'Paid', price: '900' }),
    ).toMatchObject({
      ok: true,
      body: { updates: { pricing: 'Paid', price: 900 } },
    });
    expect(buildUpdateRequest(IDS, { ...emptyFields(), pricing: 'Free' })).toMatchObject({
      ok: true,
      body: { updates: { pricing: 'Free', price: null } },
    });
  });

  it('sends the subscription only once it was touched', () => {
    const touched = {
      ...emptyFields(),
      subscriptionIncluded: true,
      subscriptionPlans: ['Gold'],
      subscriptionEdited: true,
    };
    expect(buildUpdateRequest(IDS, touched)).toMatchObject({
      body: { updates: { includedInSubscription: true, allowedSubscriptionPlans: ['Gold'] } },
    });
  });

  it('refuses an empty change', () => {
    expect(buildUpdateRequest(IDS, emptyFields())).toEqual({ ok: false, error: 'nothing' });
  });
});
