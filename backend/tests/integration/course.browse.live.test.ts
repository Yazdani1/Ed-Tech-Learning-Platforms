import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { CourseType } from '../../src/models/CourseType.model';
import { createCategory, createCourse, createCourseType, nextId } from '../factories';

const BROWSE = '/api/courses/browse';
const ids = (res: { body: { data: Array<{ _id: string }> } }) => res.body.data.map((c) => c._id);

beforeEach(async () => {
  await CourseType.updateMany({}, { isLive: false });
});

describe('GET /api/courses/browse?liveOnly=true', () => {
  it('returns only Published + Public courses of live course types', async () => {
    const tag = `live${nextId()}`;
    const live = await createCourseType({ isLive: true });
    const normal = await createCourseType({ isLive: false });
    const inLive = await createCourse({ courseType: live._id, title: `${tag} in live` });
    await createCourse({ courseType: normal._id, title: `${tag} normal` });
    await createCourse({ courseType: live._id, title: `${tag} draft`, status: 'Draft' });
    await createCourse({ courseType: live._id, title: `${tag} private`, visibility: 'Private' });

    const res = await request(app).get(`${BROWSE}?liveOnly=true&search=${tag}`);

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([String(inLive._id)]);
    expect(res.body.data[0].courseType).toMatchObject({ _id: String(live._id), isLive: true });
  });

  it('returns nothing when no course type is flagged live', async () => {
    const tag = `none${nextId()}`;
    await createCourse({ title: `${tag} a` });
    const res = await request(app).get(`${BROWSE}?liveOnly=true&search=${tag}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.filterCounts.liveCategories).toEqual({});
  });

  it('ignores the flag unless the value is exactly true', async () => {
    const tag = `off${nextId()}`;
    const course = await createCourse({ title: `${tag} a` });
    const res = await request(app).get(`${BROWSE}?liveOnly=false&search=${tag}`);
    expect(ids(res)).toEqual([String(course._id)]);
  });

  it('intersects with the courseTypes filter', async () => {
    const tag = `mix${nextId()}`;
    const liveA = await createCourseType({ isLive: true });
    const liveB = await createCourseType({ isLive: true });
    const normal = await createCourseType({ isLive: false });
    const a = await createCourse({ courseType: liveA._id, title: `${tag} a` });
    await createCourse({ courseType: liveB._id, title: `${tag} b` });
    await createCourse({ courseType: normal._id, title: `${tag} c` });

    const onlyA = await request(app).get(
      `${BROWSE}?liveOnly=true&search=${tag}&courseTypes=${liveA._id},${normal._id}`,
    );
    expect(ids(onlyA)).toEqual([String(a._id)]);

    const notLive = await request(app).get(
      `${BROWSE}?liveOnly=true&search=${tag}&courseTypes=${normal._id}`,
    );
    expect(notLive.body.data).toEqual([]);
  });

  it('paginates the live result with the right total', async () => {
    const tag = `pg${nextId()}`;
    const live = await createCourseType({ isLive: true });
    await createCourse({ courseType: live._id, title: `${tag} 1` });
    await createCourse({ courseType: live._id, title: `${tag} 2` });
    await createCourse({ courseType: live._id, title: `${tag} 3` });
    const res = await request(app).get(`${BROWSE}?liveOnly=true&search=${tag}&page=1&limit=2`);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(3);
  });
});

describe('browse filterCounts.liveCategories', () => {
  it('counts live, published public courses per category only', async () => {
    const live = await createCourseType({ isLive: true });
    const normal = await createCourseType({ isLive: false });
    const catA = await createCategory();
    const catB = await createCategory();
    await createCourse({ courseType: live._id, category: catA._id });
    await createCourse({ courseType: live._id, category: catA._id });
    await createCourse({ courseType: live._id, category: catB._id });
    await createCourse({ courseType: live._id, category: catB._id, status: 'Draft' });
    await createCourse({ courseType: normal._id, category: catB._id });

    const res = await request(app).get(BROWSE);

    expect(res.status).toBe(200);
    expect(res.body.filterCounts.liveCategories).toEqual({
      [String(catA._id)]: 2,
      [String(catB._id)]: 1,
    });
  });

  it('includes isLive in the populated courseType of a normal browse', async () => {
    const live = await createCourseType({ isLive: true });
    const tag = `pop${nextId()}`;
    await createCourse({ courseType: live._id, title: tag });
    const res = await request(app).get(`${BROWSE}?search=${tag}`);
    expect(res.body.data[0].courseType.isLive).toBe(true);
  });
});

describe('GET /api/courses/browse: paid courses per course type', () => {
  it('filterCounts.paidByCourseType counts published paid courses per type and category', async () => {
    const type = await createCourseType();
    const catA = await createCategory();
    const catB = await createCategory();
    await createCourse({ courseType: type._id, category: catA._id, pricing: 'Paid', price: 10 });
    await createCourse({ courseType: type._id, category: catA._id, pricing: 'Paid', price: 10 });
    await createCourse({ courseType: type._id, category: catB._id, pricing: 'Paid', price: 10 });
    // free and draft courses are not counted
    await createCourse({ courseType: type._id, category: catA._id, pricing: 'Free' });
    await createCourse({
      courseType: type._id,
      category: catA._id,
      pricing: 'Paid',
      status: 'Draft',
    });

    const res = await request(app).get(`${BROWSE}?limit=1`);

    expect(res.status).toBe(200);
    expect(res.body.filterCounts.paidByCourseType[String(type._id)]).toEqual({
      total: 3,
      categories: { [String(catA._id)]: 2, [String(catB._id)]: 1 },
    });
  });
});
