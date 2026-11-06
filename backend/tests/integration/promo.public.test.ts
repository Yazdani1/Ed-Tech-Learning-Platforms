import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Promo } from '../../src/models/Promo.model';
import { createCourse } from '../factories';
import {
  createDiscountedCourse,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
} from '../factories/commerce';

// Promos are global (home banner, list): every test starts without any
beforeEach(async () => {
  await Promo.deleteMany({});
});

interface Active {
  _id: string;
  title: string;
  code: string;
  courseCount: number;
}
interface CourseRow {
  _id: string;
  offer: { code: string; source: string; price: number } | null;
}

describe('GET /api/promos/active (public)', () => {
  it('lists only running promos, newest first, without the course list', async () => {
    const course = await createPaidCourse();
    const older = await createPromoDoc([course], { title: 'Older' });
    const newer = await createPromoDoc([course, await createPaidCourse()], { title: 'Newer' });
    await createPromoDoc([course], { title: 'Off', isActive: false });
    await createPromoDoc([course], {
      title: 'Over',
      startsAt: hoursFromNow(-5),
      endsAt: hoursFromNow(-1),
    });
    await createPromoDoc([course], {
      title: 'Soon',
      startsAt: hoursFromNow(2),
      endsAt: hoursFromNow(8),
    });

    const res = await request(app).get('/api/promos/active');
    expect(res.status).toBe(200);
    const rows = res.body.data as Active[];
    expect(res.body.total).toBe(2);
    expect(rows.map((row) => row.title)).toEqual(['Newer', 'Older']);
    expect(rows[0]).toMatchObject({ _id: String(newer._id), code: newer.code, courseCount: 2 });
    expect(rows[1]._id).toBe(String(older._id));
    expect(Object.keys(rows[0]).sort()).toEqual(
      ['_id', 'code', 'courseCount', 'discountType', 'endsAt', 'startsAt', 'title', 'value'].sort(),
    );
  });

  it('answers an empty list when nothing runs', async () => {
    const res = await request(app).get('/api/promos/active');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [], total: 0 });
  });
});

describe('GET /api/promos/active/courses (public)', () => {
  it('lists the published public paid courses of running promos, once each, with offers', async () => {
    const shared = await createPaidCourse();
    const own = await createDiscountedCourse(900, 'OWN-PC');
    const other = await createPaidCourse();
    const small = await createPromoDoc([shared, own], { discountType: 'percent', value: 10 });
    const big = await createPromoDoc([shared], { discountType: 'percent', value: 60 });
    await createPromoDoc([other], { isActive: false });

    const res = await request(app).get('/api/promos/active/courses');
    expect(res.status).toBe(200);
    const rows = res.body.data as CourseRow[];
    expect(rows.map((row) => row._id).sort()).toEqual([String(shared._id), String(own._id)].sort());
    expect(res.body.total).toBe(2);
    const byId = new Map(rows.map((row) => [row._id, row]));
    expect(byId.get(String(shared._id))?.offer).toMatchObject({
      code: big.code,
      source: 'promo',
      price: 400,
    });
    expect(byId.get(String(own._id))?.offer).toMatchObject({
      code: 'OWN-PC',
      source: 'course',
      price: 900,
    });
    expect(small.code).toBeTruthy();
  });

  it('leaves out Draft, Private and Free courses even when a promo lists them', async () => {
    const draft = await createPaidCourse();
    const hidden = await createPaidCourse();
    const free = await createCourse();
    const shown = await createPaidCourse();
    await createPromoDoc([draft, hidden, free, shown]);
    await draft.updateOne({ status: 'Draft' });
    await hidden.updateOne({ visibility: 'Private' });
    const res = await request(app).get('/api/promos/active/courses');
    expect((res.body.data as CourseRow[]).map((row) => row._id)).toEqual([String(shown._id)]);
  });

  it('answers an empty list without promos and does not leak private course fields', async () => {
    const empty = await request(app).get('/api/promos/active/courses');
    expect(empty.body).toMatchObject({ success: true, data: [], total: 0 });

    const course = await createPaidCourse({ coverImagePublicId: 'secret/cover', viewCount: 7 });
    await createPromoDoc([course]);
    const res = await request(app).get('/api/promos/active/courses');
    expect(res.body.total).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain('secret/cover');
    expect(res.body.data[0]).not.toHaveProperty('createdBy');
    expect(res.body.data[0]).not.toHaveProperty('viewCount');
  });
});
