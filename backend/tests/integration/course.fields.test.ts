import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import {
  PNG_BYTES,
  authCookie,
  bearer,
  createCategory,
  createCourseType,
  createUser,
  nextId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import { mockCloudinary } from '../helpers/cloudinary';
import {
  createCouponDoc,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
} from '../factories/commerce';

const validBody = async () => ({
  title: `Fields course ${nextId()}`,
  category: String((await createCategory())._id),
  courseType: String((await createCourseType())._id),
});

const create = async (body: Record<string, unknown>) => {
  const admin = await createUser('Admin');
  return request(app)
    .post('/api/courses')
    .set('Cookie', authCookie(admin))
    .send({ ...(await validBody()), ...body });
};

const update = async (id: string, body: Record<string, unknown>) => {
  const admin = await createUser('Admin');
  return request(app).put(`/api/courses/${id}`).set('Cookie', authCookie(admin)).send(body);
};

const PAID = { pricing: 'Paid', listPrice: '1000', discountPrice: '800' };

describe('POST /api/courses: batch number and schedules', () => {
  it('generates a free 4-digit batch number when none is sent', async () => {
    const res = await create({});
    expect(res.status).toBe(201);
    expect(res.body.data.batchNumber).toMatch(/^\d{4}$/);
    expect((await Course.findById(res.body.data._id))?.batchNumber).toBe(res.body.data.batchNumber);
  });

  it('generates one too when the batch number is an empty string', async () => {
    const res = await create({ batchNumber: '' });
    expect(res.status).toBe(201);
    expect(res.body.data.batchNumber).toMatch(/^\d{4}$/);
  });

  it('saves a batch number and both schedules (trimmed)', async () => {
    const res = await create({
      batchNumber: ' 7421 ',
      liveClassSchedule: ' Sat and Mon, 9-11 PM ',
      supportClassSchedule: 'Fri 5 PM',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      batchNumber: '7421',
      liveClassSchedule: 'Sat and Mon, 9-11 PM',
      supportClassSchedule: 'Fri 5 PM',
    });
  });

  it.each(['12', '12345', 'abcd', '12a4', '1 234', '-123'])(
    '400 for the batch number %s',
    async (batchNumber) => {
      const res = await create({ batchNumber });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Batch number must be exactly 4 digits');
    },
  );

  it('400 when the batch number is not text (a number, an object or a list)', async () => {
    for (const batchNumber of [1234, { $ne: null }, ['1234']]) {
      const res = await create({ batchNumber });
      expect(res.status).toBe(400);
    }
  });

  it('409 when another course already has the batch number', async () => {
    const first = await create({ batchNumber: '5555' });
    expect(first.status).toBe(201);
    const second = await create({ batchNumber: '5555' });
    expect(second.status).toBe(409);
    expect(second.body.message).toBe('This batch number is already used by another course');
    expect(await Course.countDocuments({ batchNumber: '5555' })).toBe(1);
  });

  it('400 for a schedule longer than 200 characters or not text', async () => {
    for (const field of ['liveClassSchedule', 'supportClassSchedule']) {
      const long = await create({ [field]: 'x'.repeat(201) });
      expect(long.status, field).toBe(400);
      const notText = await create({ [field]: 123 });
      expect(notText.status, field).toBe(400);
    }
  });

  it('accepts a schedule of exactly 200 characters', async () => {
    const res = await create({ liveClassSchedule: 'x'.repeat(200) });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/courses: the course discount code (auto coupon)', () => {
  it('suggests a SAVE- code when a discount has none', async () => {
    const res = await create(PAID);
    expect(res.status).toBe(201);
    expect(res.body.data.discountCode).toMatch(/^SAVE-[A-Z0-9]{8}$/);
    expect(res.body.data.discountPrice).toBe(800);
  });

  it('keeps a typed code (upper-cased) and the discount dates', async () => {
    const startsAt = hoursFromNow(1).toISOString();
    const endsAt = hoursFromNow(48).toISOString();
    const res = await create({
      ...PAID,
      discountCode: ' spring-25 ',
      discountStartsAt: startsAt,
      discountEndsAt: endsAt,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.discountCode).toBe('SPRING-25');
    expect(new Date(res.body.data.discountStartsAt).toISOString()).toBe(startsAt);
    expect(new Date(res.body.data.discountEndsAt).toISOString()).toBe(endsAt);
  });

  it('gives a course without a discount no code and no dates (a sent code is dropped)', async () => {
    const res = await create({
      pricing: 'Paid',
      listPrice: '1000',
      discountPrice: '1000',
      discountCode: 'IGNORED-1',
      discountEndsAt: hoursFromNow(5).toISOString(),
    });
    expect(res.status).toBe(201);
    const saved = await Course.findById(res.body.data._id);
    expect(saved?.discountCode).toBeUndefined();
    expect(saved?.discountEndsAt).toBeUndefined();
  });

  it.each(['abc', 'has space', 'bad_underscore', 'x'.repeat(21), 'café-code'])(
    '400 for the code "%s"',
    async (discountCode) => {
      const res = await create({ ...PAID, discountCode });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Coupon code must be 6-20 letters, digits or dashes');
    },
  );

  it('400 when the end is not after the start', async () => {
    const at = hoursFromNow(5).toISOString();
    for (const [start, end] of [
      [at, at],
      [hoursFromNow(10).toISOString(), hoursFromNow(5).toISOString()],
    ]) {
      const res = await create({ ...PAID, discountStartsAt: start, discountEndsAt: end });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('The discount must end after it starts');
    }
  });

  it('400 for an invalid discount date', async () => {
    const res = await create({ ...PAID, discountEndsAt: 'not a date' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid discount end date');
  });

  it('409 when the code belongs to another course discount, a coupon or a promo', async () => {
    const other = await createPaidCourse({ discountCode: 'TAKEN-COURSE' });
    await createCouponDoc(other, { code: 'TAKEN-COUPON' });
    const promo = await createPromoDoc([other], { code: 'TAKEN-PROMO' });
    for (const code of ['TAKEN-COURSE', 'taken-coupon', promo.code]) {
      const res = await create({ ...PAID, discountCode: code });
      expect(res.status, code).toBe(409);
      expect(res.body.message).toBe('This coupon code is already in use');
    }
  });
});

describe('PUT /api/courses/:id: new fields', () => {
  it('changes the batch number and the schedules, and clears a schedule with an empty text', async () => {
    const course = await createPaidCourse({ liveClassSchedule: 'Old' });
    const res = await update(String(course._id), {
      batchNumber: '8080',
      liveClassSchedule: '',
      supportClassSchedule: 'New support',
    });
    expect(res.status).toBe(200);
    const saved = await Course.findById(course._id);
    expect(saved?.batchNumber).toBe('8080');
    expect(saved?.liveClassSchedule ?? '').toBe('');
    expect(saved?.supportClassSchedule).toBe('New support');
  });

  it('keeps the batch number when it is not sent and accepts the course own number again', async () => {
    const course = await createPaidCourse({ batchNumber: '3141' });
    const kept = await update(String(course._id), { title: 'Renamed' });
    expect(kept.status).toBe(200);
    expect(kept.body.data.batchNumber).toBe('3141');
    const same = await update(String(course._id), { batchNumber: '3141' });
    expect(same.status).toBe(200);
  });

  it('400 for a bad batch number and 409 for one of another course', async () => {
    await createPaidCourse({ batchNumber: '2718' });
    const course = await createPaidCourse({ batchNumber: '1618' });
    const bad = await update(String(course._id), { batchNumber: '16' });
    expect(bad.status).toBe(400);
    const taken = await update(String(course._id), { batchNumber: '2718' });
    expect(taken.status).toBe(409);
    expect((await Course.findById(course._id))?.batchNumber).toBe('1618');
  });

  it('400 for a schedule over 200 characters', async () => {
    const course = await createPaidCourse();
    const res = await update(String(course._id), { supportClassSchedule: 'x'.repeat(201) });
    expect(res.status).toBe(400);
  });

  it('gives a newly discounted course a suggested code and clears it when the discount ends', async () => {
    const course = await createPaidCourse();
    const discounted = await update(String(course._id), { discountPrice: '700' });
    expect(discounted.status).toBe(200);
    expect(discounted.body.data.discountCode).toMatch(/^SAVE-[A-Z0-9]{8}$/);
    const code = discounted.body.data.discountCode as string;

    const sameCode = await update(String(course._id), { discountPrice: '600' });
    expect(sameCode.body.data.discountCode).toBe(code);

    const removed = await update(String(course._id), { discountPrice: '1000' });
    expect(removed.status).toBe(200);
    expect((await Course.findById(course._id))?.discountCode ?? null).toBeNull();
  });

  it('changes the discount code, and an empty code suggests a new one', async () => {
    const course = await createPaidCourse({
      price: 800,
      discountPrice: 800,
      discountCode: 'OLD-CODE',
    });
    const changed = await update(String(course._id), { discountCode: 'new-code' });
    expect(changed.status).toBe(200);
    expect(changed.body.data.discountCode).toBe('NEW-CODE');
    const again = await update(String(course._id), { discountCode: 'NEW-CODE' });
    expect(again.status).toBe(200);
    const reset = await update(String(course._id), { discountCode: '' });
    expect(reset.body.data.discountCode).toMatch(/^SAVE-[A-Z0-9]{8}$/);
  });

  it('409 when the discount code is used by a coupon, a promo or another course', async () => {
    const other = await createPaidCourse({ discountCode: 'OTHER-DISC' });
    const coupon = await createCouponDoc(other);
    const promo = await createPromoDoc([other]);
    const course = await createPaidCourse({
      price: 800,
      discountPrice: 800,
      discountCode: 'MINE-DISC',
    });
    for (const code of ['OTHER-DISC', coupon.code, promo.code]) {
      const res = await update(String(course._id), { discountCode: code });
      expect(res.status, code).toBe(409);
    }
    expect((await Course.findById(course._id))?.discountCode).toBe('MINE-DISC');
  });

  it('400 for a malformed code and for an end before the start; changes nothing', async () => {
    const course = await createPaidCourse({
      price: 800,
      discountPrice: 800,
      discountCode: 'KEEP-ME',
    });
    const badCode = await update(String(course._id), { discountCode: '!!' });
    expect(badCode.status).toBe(400);
    const badDates = await update(String(course._id), {
      discountStartsAt: hoursFromNow(10).toISOString(),
      discountEndsAt: hoursFromNow(2).toISOString(),
    });
    expect(badDates.status).toBe(400);
    expect((await Course.findById(course._id))?.discountCode).toBe('KEEP-ME');
  });

  it('clears the discount end date with an empty value', async () => {
    const course = await createPaidCourse({
      price: 800,
      discountPrice: 800,
      discountCode: 'DATES-1',
      discountEndsAt: hoursFromNow(10),
    });
    const res = await update(String(course._id), { discountEndsAt: '' });
    expect(res.status).toBe(200);
    expect((await Course.findById(course._id))?.discountEndsAt ?? null).toBeNull();
  });
});

describe('GET /api/courses/batch-number/suggest', () => {
  it.each(ADMIN_ROLES)('gives %s a free 4-digit batch number', async (role) => {
    const user = await createUser(role);
    const res = await request(app)
      .get('/api/courses/batch-number/suggest')
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const batchNumber = res.body.data.batchNumber as string;
    expect(batchNumber).toMatch(/^\d{4}$/);
    expect(await Course.exists({ batchNumber })).toBeNull();
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .get('/api/courses/batch-number/suggest')
      .set('Authorization', bearer(admin));
    expect(res.status).toBe(200);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).get('/api/courses/batch-number/suggest');
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s', async (role) => {
    const user = await createUser(role);
    const res = await request(app)
      .get('/api/courses/batch-number/suggest')
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/courses: nothing is uploaded when the new fields are refused', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not upload the cover image for a taken batch number or a bad discount code', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    await createPaidCourse({ batchNumber: '9191' });
    const base = await validBody();
    for (const extra of [{ batchNumber: '9191' }, { ...PAID, discountCode: '!!' }]) {
      const req = request(app).post('/api/courses').set('Cookie', authCookie(admin));
      for (const [key, value] of Object.entries({ ...base, ...extra }))
        req.field(key, String(value));
      const res = await req.attach('coverImage', PNG_BYTES, {
        filename: 'cover.png',
        contentType: 'image/png',
      });
      expect([400, 409]).toContain(res.status);
    }
    expect(cloud.upload).not.toHaveBeenCalled();
  });
});
