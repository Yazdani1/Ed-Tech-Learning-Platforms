import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Announcement } from '../../src/models/Announcement.model';
import { Enrollment } from '../../src/models/Enrollment.model';
import { Course } from '../../src/models/Course.model';
import { Lecture } from '../../src/models/Lecture.model';
import { Section } from '../../src/models/Section.model';
import { StudyCurriculum } from '../../src/models/StudyCurriculum.model';
import {
  PNG_BYTES,
  authCookie,
  bearer,
  createCategory,
  createCourse,
  createCourseType,
  createTeacherProfile,
  createUser,
  enrol,
  missingId,
  nextId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES, createLecture, createSection } from '../factories/catalog';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => {
  vi.restoreAllMocks();
});

const validBody = async () => ({
  title: `New course ${nextId()}`,
  category: String((await createCategory())._id),
  courseType: String((await createCourseType())._id),
});

describe('PUT /api/courses/:id', () => {
  it.each(ADMIN_ROLES)('lets %s update the basic fields and lists', async (role) => {
    const admin = await createUser(role);
    const course = await createCourse();
    const category = await createCategory();
    const type = await createCourseType();
    const teacher = await createTeacherProfile();

    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({
        title: 'Updated title',
        subtitle: 'Updated sub',
        description: 'Updated description',
        category: String(category._id),
        courseType: String(type._id),
        visibility: 'Private',
        teachers: JSON.stringify([String(teacher._id)]),
        whatYouWillLearn: JSON.stringify(['a', 'b']),
        whatYouWillGet: JSON.stringify(['c']),
        requirements: JSON.stringify(['d']),
        startDate: '2031-02-03',
        includedInSubscription: 'true',
        allowedSubscriptionPlans: JSON.stringify(['Gold']),
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Course updated');
    const saved = await Course.findById(course._id);
    expect(saved).toMatchObject({
      title: 'Updated title',
      subtitle: 'Updated sub',
      description: 'Updated description',
      visibility: 'Private',
      includedInSubscription: true,
    });
    expect(String(saved?.category)).toBe(String(category._id));
    expect(String(saved?.courseType)).toBe(String(type._id));
    expect(saved?.teachers.map(String)).toEqual([String(teacher._id)]);
    expect(saved?.whatYouWillLearn).toEqual(['a', 'b']);
    expect(saved?.requirements).toEqual(['d']);
    expect(saved?.allowedSubscriptionPlans).toEqual(['Gold']);
    expect(saved?.startDate?.toISOString()).toBe('2031-02-03T00:00:00.000Z');
  });

  it('clears the start date when an empty value is sent and keeps untouched fields', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ startDate: new Date('2030-05-05') });
    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ startDate: '' });
    expect(res.status).toBe(200);
    const saved = await Course.findById(course._id);
    expect(saved?.startDate ?? null).toBeNull();
    expect(saved?.title).toBe(course.title);
  });

  it('recalculates prices on the server when pricing changes', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const paid = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ pricing: 'Paid', listPrice: '200', discountPrice: '150' });
    expect(paid.body.data).toMatchObject({
      pricing: 'Paid',
      listPrice: 200,
      discountPrice: 150,
      price: 150,
    });

    const free = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ pricing: 'Free' });
    expect(free.body.data).toMatchObject({
      pricing: 'Free',
      listPrice: 0,
      discountPrice: 0,
      price: 0,
    });
  });

  it('replaces the cover image and deletes the old one from Cloudinary', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const course = await createCourse({ coverImagePublicId: 'old/cover' });
    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .field('title', 'With new cover')
      .attach('coverImage', PNG_BYTES, { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(cloud.destroy).toHaveBeenCalledWith('old/cover');
    expect(res.body.data.coverImage).toContain('https://res.cloudinary.com/');
  });

  it('does not let the client change status, owner or sections through update', async () => {
    const admin = await createUser('Admin');
    const intruder = await createUser('Student');
    const course = await createCourse({ status: 'Draft' });
    await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ status: 'Published', createdBy: String(intruder._id), sections: [missingId()] });
    const saved = await Course.findById(course._id);
    expect(saved?.status).toBe('Draft');
    expect(String(saved?.createdBy)).toBe(String(course.createdBy));
    expect(saved?.sections).toHaveLength(0);
  });

  it('answers 400 (not 500) for malformed ids, bad JSON and bad enum values', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const put = (body: Record<string, unknown>) =>
      request(app).put(`/api/courses/${course._id}`).set('Cookie', authCookie(admin)).send(body);
    expect((await put({ category: 'nope' })).status).toBe(400);
    expect((await put({ courseType: 'nope' })).status).toBe(400);
    expect((await put({ teachers: '{broken' })).status).toBe(400);
    expect((await put({ whatYouWillLearn: 'broken' })).status).toBe(400);
    expect((await put({ visibility: 'Secret' })).status).toBe(400);
    expect((await put({ pricing: 'Gold' })).status).toBe(400);
    expect((await put({ title: '' })).status).toBe(400);
  });

  it('answers 404 for an unknown category or course type and does not upload the cover', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const course = await createCourse();
    const category = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .field('category', missingId())
      .attach('coverImage', PNG_BYTES, { filename: 'c.png', contentType: 'image/png' });
    expect(category.status).toBe(404);
    expect(category.body.message).toBe('Category not found');
    expect(cloud.upload).not.toHaveBeenCalled();
    const type = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ courseType: missingId() });
    expect(type.status).toBe(404);
    expect(type.body.message).toBe('Course type not found');
    const teachers = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ teachers: JSON.stringify([missingId()]) });
    expect(teachers.status).toBe(400);
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .put(`/api/courses/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('Course not found');
    const bad = await request(app)
      .put('/api/courses/nope')
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const course = await createCourse();
    expect((await request(app).put(`/api/courses/${course._id}`).send({ title: 'x' })).status).toBe(
      401,
    );
  });

  it.each(NON_ADMIN_ROLES)(
    'answers 403 for %s (a teacher cannot edit even their own course)',
    async (role) => {
      const user = await createUser(role);
      const profile = role === 'Teacher' ? await createTeacherProfile(user) : undefined;
      const course = await createCourse(profile ? { teachers: [profile._id] } : {});
      const res = await request(app)
        .put(`/api/courses/${course._id}`)
        .set('Cookie', authCookie(user))
        .send({ title: 'Hacked' });
      expect(res.status).toBe(403);
      expect((await Course.findById(course._id))?.title).toBe(course.title);
    },
  );
});

describe('PATCH /api/courses/:id/status', () => {
  it.each(ADMIN_ROLES)('lets %s publish and unpublish, setting publishedAt', async (role) => {
    const admin = await createUser(role);
    const course = await createCourse({ status: 'Draft' });

    const publish = await request(app)
      .patch(`/api/courses/${course._id}/status`)
      .set('Cookie', authCookie(admin))
      .send({ status: 'Published' });
    expect(publish.status).toBe(200);
    expect(publish.body).toMatchObject({ success: true, message: 'Course published' });
    expect(publish.body.data.status).toBe('Published');
    expect((await Course.findById(course._id))?.publishedAt).toBeInstanceOf(Date);

    const draft = await request(app)
      .patch(`/api/courses/${course._id}/status`)
      .set('Cookie', authCookie(admin))
      .send({ status: 'Draft' });
    expect(draft.body.message).toBe('Course draft');
    const saved = await Course.findById(course._id);
    expect(saved?.status).toBe('Draft');
    expect(saved?.publishedAt ?? null).toBeNull();
  });

  it('answers 400 for a missing or invalid status', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    for (const status of [undefined, 'Archived', '', { $ne: 'x' }]) {
      const res = await request(app)
        .patch(`/api/courses/${course._id}/status`)
        .set('Cookie', authCookie(admin))
        .send({ status });
      expect(res.status).toBe(400);
    }
    expect((await Course.findById(course._id))?.status).toBe('Published');
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .patch(`/api/courses/${missingId()}/status`)
      .set('Cookie', authCookie(admin))
      .send({ status: 'Draft' });
    expect(missing.status).toBe(404);
    const bad = await request(app)
      .patch('/api/courses/nope/status')
      .set('Cookie', authCookie(admin))
      .send({ status: 'Draft' });
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const course = await createCourse();
    const res = await request(app)
      .patch(`/api/courses/${course._id}/status`)
      .send({ status: 'Draft' });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s', async (role) => {
    const user = await createUser(role);
    const course = await createCourse();
    const res = await request(app)
      .patch(`/api/courses/${course._id}/status`)
      .set('Cookie', authCookie(user))
      .send({ status: 'Draft' });
    expect(res.status).toBe(403);
    expect((await Course.findById(course._id))?.status).toBe('Published');
  });
});

describe('DELETE /api/courses/:id', () => {
  it.each(ADMIN_ROLES)(
    'lets %s delete a course with its sections, lectures, curricula and cover',
    async (role) => {
      const cloud = mockCloudinary();
      const admin = await createUser(role);
      const course = await createCourse({ coverImagePublicId: 'cover/to-delete' });
      const section = await createSection(course);
      const lecture = await createLecture(section);
      await StudyCurriculum.create({
        course: course._id,
        title: 'Plan',
        description: 'd',
        weekName: 'Week 1',
        postedBy: admin._id,
      });

      const res = await request(app)
        .delete(`/api/courses/${course._id}`)
        .set('Cookie', authCookie(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Course deleted' });
      expect(cloud.destroy).toHaveBeenCalledWith('cover/to-delete');
      expect(await Course.findById(course._id)).toBeNull();
      expect(await Section.findById(section._id)).toBeNull();
      expect(await Lecture.findById(lecture._id)).toBeNull();
      expect(await StudyCurriculum.countDocuments({ course: course._id })).toBe(0);
    },
  );

  it('also removes the course announcements when nobody is enrolled (no orphans)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await Announcement.create({
      course: course._id,
      title: 't',
      description: 'd',
      postedBy: admin._id,
    });
    const res = await request(app)
      .delete(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(await Announcement.countDocuments({ course: course._id })).toBe(0);
  });

  it('400 when the course has enrolments: nothing is deleted (enrolments are revenue/history)', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const course = await createCourse({ coverImagePublicId: 'cover/keep' });
    const section = await createSection(course);
    await Announcement.create({
      course: course._id,
      title: 't',
      description: 'd',
      postedBy: admin._id,
    });
    await enrol(await createUser('Student'), course);
    await enrol(await createUser('Student'), course);
    const res = await request(app)
      .delete(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: 'This course has 2 enrolment(s); unpublish it instead of deleting',
    });
    expect(await Course.findById(course._id)).not.toBeNull();
    expect(await Section.findById(section._id)).not.toBeNull();
    expect(await Announcement.countDocuments({ course: course._id })).toBe(1);
    expect(await Enrollment.countDocuments({ course: course._id })).toBe(2);
    expect(cloud.destroy).not.toHaveBeenCalled();
  });

  it('also removes study materials, quizzes, quiz attempts and Q&A of the course, not of others', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const other = await createCourse();
    const { connection, Types } = await import('mongoose');
    const db = connection.db;
    if (!db) throw new Error('not connected');
    const names = ['studymaterials', 'quizsections', 'quizbanks', 'quizattempts', 'questions'];
    // student + quizBank keep the quiz attempt unique index (student, quizBank) satisfied.
    const doc = (courseId: unknown) => ({
      course: courseId,
      student: new Types.ObjectId(),
      quizBank: new Types.ObjectId(),
    });
    for (const name of names) {
      await db.collection(name).insertMany([doc(course._id), doc(other._id)]);
    }
    const question = await db.collection('questions').findOne({ course: course._id });
    const otherQuestion = await db.collection('questions').findOne({ course: other._id });
    await db
      .collection('answers')
      .insertMany([{ question: question?._id }, { question: otherQuestion?._id }]);

    const res = await request(app)
      .delete(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(admin));

    expect(res.status).toBe(200);
    for (const name of names) {
      expect(await db.collection(name).countDocuments({ course: course._id }), name).toBe(0);
      expect(await db.collection(name).countDocuments({ course: other._id }), name).toBe(1);
    }
    expect(await db.collection('answers').countDocuments({ question: question?._id })).toBe(0);
    expect(await db.collection('answers').countDocuments({ question: otherQuestion?._id })).toBe(1);
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    expect(
      (await request(app).delete(`/api/courses/${missingId()}`).set('Cookie', authCookie(admin)))
        .status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/courses/nope').set('Cookie', authCookie(admin))).status,
    ).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const course = await createCourse();
    expect((await request(app).delete(`/api/courses/${course._id}`)).status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and keeps the course', async (role) => {
    const user = await createUser(role);
    const course = await createCourse();
    const res = await request(app)
      .delete(`/api/courses/${course._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
    expect(await Course.findById(course._id)).not.toBeNull();
  });
});
