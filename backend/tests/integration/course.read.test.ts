import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { Enrollment } from '../../src/models/Enrollment.model';
import {
  authCookie,
  createCategory,
  createCourse,
  createCourseType,
  createTeacherProfile,
  createUser,
  enrol,
  missingId,
  nextId,
} from '../factories';
import { createLecture, createSection } from '../factories/catalog';

interface CourseRow {
  _id: string;
  title: string;
  status: string;
  visibility: string;
  enrollmentStats?: Record<string, number>;
}

const ids = (rows: CourseRow[]): string[] => rows.map((c) => String(c._id));
const HOUR_MS = 60 * 60 * 1000;

describe('GET /api/courses/browse (public catalog)', () => {
  it('returns only Published + Public courses, newest first, with filter counts', async () => {
    const category = await createCategory();
    const type = await createCourseType();
    const older = await createCourse({ category: category._id, courseType: type._id });
    const newer = await createCourse({ category: category._id, courseType: type._id });
    const draft = await createCourse({ category: category._id, status: 'Draft' });
    const hidden = await createCourse({ category: category._id, visibility: 'Private' });

    const res = await request(app).get(`/api/courses/browse?categories=${category._id}`);

    expect(res.status).toBe(200);
    expect(ids(res.body.data)).toEqual([String(newer._id), String(older._id)]);
    expect(ids(res.body.data)).not.toContain(String(draft._id));
    expect(ids(res.body.data)).not.toContain(String(hidden._id));
    expect(res.body.total).toBe(2);
    expect(res.body.pagination).toBeUndefined();
    expect(res.body.filterCounts.categories[String(category._id)]).toBe(2);
    expect(res.body.filterCounts.courseTypes[String(type._id)]).toBe(2);
    expect(res.body.filterCounts.pricing.Free).toBeGreaterThanOrEqual(2);
  });

  it('cannot be tricked into showing drafts or private courses through the query', async () => {
    const draft = await createCourse({ status: 'Draft' });
    const res = await request(app).get('/api/courses/browse?status=Draft&visibility=Private');
    expect(res.status).toBe(200);
    expect(ids(res.body.data)).not.toContain(String(draft._id));
  });

  it('filters by search (case-insensitive), course type, pricing and subscription plan', async () => {
    const tag = `Zebra${nextId()}`;
    const type = await createCourseType();
    const paid = await createCourse({
      title: `Learn ${tag} paid`,
      courseType: type._id,
      pricing: 'Paid',
      price: 50,
      listPrice: 50,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'] as never,
    });
    await createCourse({ title: `Learn ${tag} free`, courseType: type._id });
    await createCourse({ title: 'Other thing' });

    const search = await request(app).get(`/api/courses/browse?search=${tag.toLowerCase()}`);
    expect(search.body.total).toBe(2);

    const byType = await request(app).get(`/api/courses/browse?courseTypes=${type._id},not-an-id`);
    expect(byType.body.total).toBe(2);

    const byPricing = await request(app).get(
      `/api/courses/browse?search=${tag}&pricing=Paid,Bogus`,
    );
    expect(ids(byPricing.body.data)).toEqual([String(paid._id)]);

    const byPlan = await request(app).get(
      `/api/courses/browse?search=${tag}&subscriptionPlans=Premium`,
    );
    expect(ids(byPlan.body.data)).toEqual([String(paid._id)]);
  });

  it('does not fail on a search text that is an invalid regular expression', async () => {
    const res = await request(app).get('/api/courses/browse?search=[');
    expect(res.status).toBe(200);
  });

  it('paginates: page, limit, clamping and the pagination block', async () => {
    const category = await createCategory();
    for (let i = 0; i < 3; i += 1) await createCourse({ category: category._id });

    const first = await request(app).get(
      `/api/courses/browse?categories=${category._id}&page=1&limit=2`,
    );
    expect(first.body.data).toHaveLength(2);
    expect(first.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
      hasPrevPage: false,
    });

    const beyond = await request(app).get(
      `/api/courses/browse?categories=${category._id}&page=99&limit=2`,
    );
    expect(beyond.body.pagination.page).toBe(2);
    expect(beyond.body.data).toHaveLength(1);
    expect(beyond.body.pagination.hasNextPage).toBe(false);

    const huge = await request(app).get(
      `/api/courses/browse?categories=${category._id}&limit=5000`,
    );
    expect(huge.body.pagination.limit).toBe(100);
  });

  it('does not reveal the video address of lectures that are not free previews', async () => {
    const course = await createCourse();
    const section = await createSection(course);
    const locked = await createLecture(section, {
      isPreview: false,
      videoUrl: 'https://v.example.com/secret',
    });
    const preview = await createLecture(section, {
      isPreview: true,
      videoUrl: 'https://v.example.com/free',
    });

    const res = await request(app).get(`/api/courses/browse?search=${course.title}`);
    const body = JSON.stringify(res.body);
    expect(body).toContain(String(preview._id));
    expect(body).not.toContain('https://v.example.com/secret');
    expect(body).toContain(String(locked._id));
  });

  it('resets an expired discount before answering', async () => {
    const course = await createCourse({
      pricing: 'Paid',
      listPrice: 100,
      price: 80,
      discountPrice: 80,
      discountPercent: 20,
      discountEndsAt: new Date(Date.now() - HOUR_MS),
    });
    const res = await request(app).get(`/api/courses/browse?search=${course.title}`);
    expect(res.body.data[0]).toMatchObject({ price: 100, discountPrice: 100, discountPercent: 0 });
    const saved = await Course.findById(course._id);
    expect(saved?.discountEndsAt).toBeUndefined();
  });
});

describe('GET /api/courses (admin list)', () => {
  it('does not show draft or private courses to the public', async () => {
    const draft = await createCourse({ status: 'Draft' });
    const hidden = await createCourse({ visibility: 'Private' });
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(ids(res.body.data)).not.toContain(String(draft._id));
    expect(ids(res.body.data)).not.toContain(String(hidden._id));
  });

  it('does not show enrolment counts and earnings to the public', async () => {
    const course = await createCourse();
    await enrol(await createUser('Student'), course);
    const res = await request(app).get('/api/courses');
    const row = (res.body.data as CourseRow[]).find((c) => String(c._id) === String(course._id));
    expect(row?.enrollmentStats).toBeUndefined();
  });

  it('shows every course with populated refs and per-course enrolment statistics to staff', async () => {
    const admin = await createUser('Admin');
    const teacher = await createTeacherProfile();
    const course = await createCourse({
      status: 'Draft',
      visibility: 'Private',
      pricing: 'Paid',
      price: 40,
      listPrice: 40,
      teachers: [teacher._id],
    });
    await Enrollment.create({
      student: (await createUser('Student'))._id,
      course: course._id,
      enrollmentType: 'paid',
      paidPrice: 30,
    });
    await Enrollment.create({
      student: (await createUser('Student'))._id,
      course: course._id,
      enrollmentType: 'paid',
    });
    await enrol(await createUser('Student'), course);

    const res = await request(app).get('/api/courses').set('Cookie', authCookie(admin));

    expect(res.status).toBe(200);
    const row = (res.body.data as CourseRow[]).find((c) => String(c._id) === String(course._id));
    expect(row).toBeDefined();
    expect(row?.enrollmentStats).toMatchObject({ totalEnrollments: 3, thisMonthCount: 3 });
    expect(row?.enrollmentStats?.lifetimeEarned).toBe(30);
    expect(
      res.body.data.find((c: { _id: string }) => c._id === String(course._id)).teachers[0],
    ).toMatchObject({
      name: teacher.name,
    });
    expect(res.body.total).toBe(res.body.data.length);
  });

  it('filters by category, type, teacher, status, pricing, visibility, search and plans', async () => {
    const admin = await createUser('Admin');
    const category = await createCategory();
    const type = await createCourseType();
    const teacher = await createTeacherProfile();
    const tag = `Quokka${nextId()}`;
    const target = await createCourse({
      title: `${tag} target`,
      category: category._id,
      courseType: type._id,
      teachers: [teacher._id],
      status: 'Draft',
      pricing: 'Paid',
      price: 10,
      visibility: 'Private',
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Gold'] as never,
    });
    await createCourse({ title: `${tag} other`, category: category._id });

    const get = async (qs: string) =>
      ids(
        (await request(app).get(`/api/courses?${qs}`).set('Cookie', authCookie(admin))).body.data,
      );

    expect(await get(`category=${category._id}&search=${tag.toLowerCase()}`)).toHaveLength(2);
    expect(await get(`courseType=${type._id}`)).toEqual([String(target._id)]);
    expect(await get(`teacher=${teacher._id}`)).toEqual([String(target._id)]);
    expect(await get(`search=${tag}&status=Draft`)).toEqual([String(target._id)]);
    expect(await get(`search=${tag}&pricing=Paid&visibility=Private`)).toEqual([
      String(target._id),
    ]);
    expect(await get(`search=${tag}&subscriptionPlans=Gold`)).toEqual([String(target._id)]);
  });

  it('applies the enrolment filters', async () => {
    const admin = await createUser('Admin');
    const category = await createCategory();
    const withStudent = await createCourse({ category: category._id });
    const without = await createCourse({ category: category._id });
    await enrol(await createUser('Student'), withStudent);

    const has = await request(app)
      .get(`/api/courses?category=${category._id}&enrollmentFilter=has_lifetime`)
      .set('Cookie', authCookie(admin));
    expect(ids(has.body.data)).toEqual([String(withStudent._id)]);
    const none = await request(app)
      .get(`/api/courses?category=${category._id}&enrollmentFilter=none_lifetime`)
      .set('Cookie', authCookie(admin));
    expect(ids(none.body.data)).toEqual([String(without._id)]);
  });

  it('does not fail on a search text that is an invalid regular expression', async () => {
    const res = await request(app).get('/api/courses?search=(');
    expect(res.status).toBe(200);
  });

  it('matches the search text literally (regex characters are escaped)', async () => {
    const admin = await createUser('Admin');
    const tag = `Lit${nextId()}`;
    const exact = await createCourse({ title: `${tag} a.b` });
    await createCourse({ title: `${tag} axb` });
    const res = await request(app)
      .get(`/api/courses?search=${encodeURIComponent(`${tag} a.b`)}`)
      .set('Cookie', authCookie(admin));
    expect(ids(res.body.data)).toEqual([String(exact._id)]);
  });

  it.each(['Teacher', 'Student'] as const)(
    'shows a signed-in %s only Published + Public courses without statistics',
    async (role) => {
      const user = await createUser(role);
      const draft = await createCourse({ status: 'Draft' });
      const visible = await createCourse();
      await enrol(await createUser('Student'), visible);
      const res = await request(app).get('/api/courses').set('Cookie', authCookie(user));
      expect(ids(res.body.data)).not.toContain(String(draft._id));
      const row = (res.body.data as CourseRow[]).find((c) => String(c._id) === String(visible._id));
      expect(row).toBeDefined();
      expect(row?.enrollmentStats).toBeUndefined();
    },
  );

  it('shows drafts and statistics to a Moderator', async () => {
    const moderator = await createUser('Moderator');
    const draft = await createCourse({ status: 'Draft' });
    const res = await request(app).get('/api/courses').set('Cookie', authCookie(moderator));
    const row = (res.body.data as CourseRow[]).find((c) => String(c._id) === String(draft._id));
    expect(row?.enrollmentStats).toMatchObject({ totalEnrollments: 0 });
  });

  it('answers 400 (not 500) for a malformed category id filter', async () => {
    const res = await request(app).get('/api/courses?category=nope');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/courses/:id', () => {
  it('returns a published public course with category, type, teachers and curriculum', async () => {
    const teacher = await createTeacherProfile();
    const course = await createCourse({ teachers: [teacher._id] });
    const section = await createSection(course);
    const lecture = await createLecture(section, { isPreview: true });

    const res = await request(app).get(`/api/courses/${course._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe(course.title);
    expect(res.body.data.category).toHaveProperty('slug');
    expect(res.body.data.teachers[0].name).toBe(teacher.name);
    expect(res.body.data.sections[0].lectures[0]._id).toBe(String(lecture._id));
  });

  it('SECURITY: teachers come without their login account id (except for Super Admin/Admin); no cover public id', async () => {
    const teacherUser = await createUser('Teacher');
    const teacher = await createTeacherProfile(teacherUser);
    const course = await createCourse({
      teachers: [teacher._id],
      coverImagePublicId: 'secret/cover',
    });
    const viewers = [
      undefined,
      await createUser('Student'),
      await createUser('Moderator'),
      teacherUser,
    ];
    for (const viewer of viewers) {
      const req = request(app).get(`/api/courses/${course._id}`);
      const res = viewer ? await req.set('Cookie', authCookie(viewer)) : await req;
      expect(res.status).toBe(200);
      expect(res.body.data.teachers[0]).not.toHaveProperty('userId');
      expect(JSON.stringify(res.body)).not.toContain('secret/cover');
    }
    for (const role of ['Super Admin', 'Admin'] as const) {
      const res = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.body.data.teachers[0].userId).toBe(String(teacherUser._id));
    }
    const browse = await request(app).get('/api/courses/browse');
    expect(JSON.stringify(browse.body)).not.toContain(String(teacherUser._id));
    expect(JSON.stringify(browse.body)).not.toContain('secret/cover');
  });

  it('does not reveal the video address of locked lectures to a visitor who has not enrolled', async () => {
    const course = await createCourse({ pricing: 'Paid', price: 10, listPrice: 10 });
    const section = await createSection(course);
    await createLecture(section, {
      isPreview: false,
      videoUrl: 'https://v.example.com/paid-secret',
    });
    const res = await request(app).get(`/api/courses/${course._id}`);
    expect(JSON.stringify(res.body)).not.toContain('https://v.example.com/paid-secret');
  });

  it('shows locked lecture videos to an enrolled student', async () => {
    const course = await createCourse({ pricing: 'Paid', price: 10, listPrice: 10 });
    const section = await createSection(course);
    await createLecture(section, {
      isPreview: false,
      videoUrl: 'https://v.example.com/for-students',
    });
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(JSON.stringify(res.body)).toContain('https://v.example.com/for-students');
  });

  it('hides a Draft course from the public (404) but shows it to an admin', async () => {
    const course = await createCourse({ status: 'Draft' });
    const admin = await createUser('Admin');
    expect((await request(app).get(`/api/courses/${course._id}`)).status).toBe(404);
    expect(
      (await request(app).get(`/api/courses/${course._id}`).set('Cookie', authCookie(admin)))
        .status,
    ).toBe(200);
  });

  it('hides a Private course from students (404) but shows it, with videos, to its own teacher', async () => {
    const teacherUser = await createUser('Teacher');
    const profile = await createTeacherProfile(teacherUser);
    const course = await createCourse({ visibility: 'Private', teachers: [profile._id] });
    const section = await createSection(course);
    await createLecture(section, { videoUrl: 'https://v.example.com/teacher-only' });
    const student = await createUser('Student');
    const otherTeacher = await createUser('Teacher');
    await createTeacherProfile(otherTeacher);

    const asStudent = await request(app)
      .get(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(asStudent.status).toBe(404);
    const asOther = await request(app)
      .get(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(otherTeacher));
    expect(asOther.status).toBe(404);
    const asOwner = await request(app)
      .get(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(teacherUser));
    expect(asOwner.status).toBe(200);
    expect(JSON.stringify(asOwner.body)).toContain('https://v.example.com/teacher-only');
  });

  it('keeps the video address of free preview lectures for visitors', async () => {
    const course = await createCourse();
    const section = await createSection(course);
    await createLecture(section, { isPreview: true, videoUrl: 'https://v.example.com/preview' });
    const res = await request(app).get(`/api/courses/${course._id}`);
    expect(JSON.stringify(res.body)).toContain('https://v.example.com/preview');
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    expect((await request(app).get(`/api/courses/${missingId()}`)).status).toBe(404);
    expect((await request(app).get('/api/courses/nope')).status).toBe(400);
  });

  it('resets an expired discount before answering', async () => {
    const course = await createCourse({
      pricing: 'Paid',
      listPrice: 200,
      price: 150,
      discountPrice: 150,
      discountPercent: 25,
      discountEndsAt: new Date(Date.now() - HOUR_MS),
    });
    const res = await request(app).get(`/api/courses/${course._id}`);
    expect(res.body.data).toMatchObject({ price: 200, discountPercent: 0 });
  });
});

describe('GET /api/courses/discounts/active', () => {
  it('summarises active discounts of published public paid courses only', async () => {
    await Course.deleteMany({});
    const endsSoon = new Date(Date.now() + HOUR_MS);
    const endsLater = new Date(Date.now() + 5 * HOUR_MS);
    const paid = { pricing: 'Paid' as const, discountPercent: 10 };
    await createCourse({
      ...paid,
      listPrice: 100,
      discountPrice: 90,
      price: 90,
      discountEndsAt: endsLater,
    });
    await createCourse({
      ...paid,
      discountPercent: 30,
      listPrice: 300,
      discountPrice: 210,
      price: 210,
      discountEndsAt: endsSoon,
    });
    await createCourse({
      ...paid,
      status: 'Draft',
      listPrice: 999,
      discountPrice: 1,
      discountEndsAt: endsSoon,
    });
    await createCourse({
      ...paid,
      visibility: 'Private',
      listPrice: 999,
      discountPrice: 1,
      discountEndsAt: endsSoon,
    });

    const res = await request(app).get('/api/courses/discounts/active');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      courseCount: 2,
      discountPercent: 30,
      maxListPrice: 300,
      minDiscountPrice: 90,
    });
    expect(new Date(res.body.data.discountEndsAt).getTime()).toBe(endsSoon.getTime());
  });

  it('answers data null when no discount is running', async () => {
    await Course.deleteMany({});
    await createCourse({ pricing: 'Paid', listPrice: 10, price: 10 });
    const res = await request(app).get('/api/courses/discounts/active');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
  });

  it('ignores expired discounts (and resets them)', async () => {
    await Course.deleteMany({});
    const course = await createCourse({
      pricing: 'Paid',
      listPrice: 100,
      discountPrice: 50,
      price: 50,
      discountPercent: 50,
      discountEndsAt: new Date(Date.now() - HOUR_MS),
    });
    const res = await request(app).get('/api/courses/discounts/active');
    expect(res.body.data).toBeNull();
    expect((await Course.findById(course._id))?.price).toBe(100);
  });
});
