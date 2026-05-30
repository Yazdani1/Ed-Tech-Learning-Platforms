import request from 'supertest';
import app from '../../../src/app';
import { Teacher } from '../../../src/models/Teacher.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createTeacherProfile, makeObjectId } from '../../helpers/data.helper';

describe('Teachers API', () => {
  it('lists teachers publicly and gets one teacher by id', async () => {
    const teacher = await createTeacherProfile({ name: 'Public Teacher' });

    const list = await request(app).get('/api/teachers');
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const get = await request(app).get(`/api/teachers/${teacher._id}`);
    expectSuccess(get);
    expect(get.body.data.name).toBe('Public Teacher');
  });

  it('creates, updates, and deletes teachers as admin with image upload and linked teacher user', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher.user@example.com' });

    const create = await request(app)
      .post('/api/teachers')
      .set(authHeaderFor(admin))
      .field('name', 'Jane Instructor')
      .field('bio', 'Senior educator')
      .field('expertise', 'Node.js, API Testing')
      .field('socialLinks', JSON.stringify({ website: 'https://example.com' }))
      .field('userId', String(teacherUser._id))
      .attach('profileImage', Buffer.from('fake image'), { filename: 'profile.png', contentType: 'image/png' });

    expectSuccess(create, 201);
    expect(create.body.data).toMatchObject({
      name: 'Jane Instructor',
      bio: 'Senior educator',
      expertise: ['Node.js', 'API Testing'],
      profileImage: expect.stringContaining('cloudinary.com'),
    });

    const update = await request(app)
      .put(`/api/teachers/${create.body.data._id}`)
      .set(authHeaderFor(admin))
      .field('name', 'Jane Updated')
      .field('bio', 'Updated bio')
      .field('expertise', 'Testing')
      .field('userId', '');

    expectSuccess(update);
    expect(update.body.data).toMatchObject({ name: 'Jane Updated', expertise: ['Testing'] });
    expect(update.body.data.userId).toBeUndefined();

    const remove = await request(app).delete(`/api/teachers/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
    expect(await Teacher.findById(create.body.data._id)).toBeNull();
  });

  it('returns linked teacher courses for a teacher account', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    await createCourse(admin, { teachers: [teacher._id], title: 'Assigned Course' });

    const res = await request(app).get('/api/teachers/my-courses').set(authHeaderFor(teacherUser));

    expectSuccess(res);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toBe('Assigned Course');
  });

  it('validates teacher ids, linked users, duplicates, and file types', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    await createTeacherProfile({ userId: teacherUser._id });

    const missing = await request(app).get(`/api/teachers/${makeObjectId()}`);
    expectError(missing, 404, /Teacher not found/);

    const invalidUser = await request(app).post('/api/teachers').set(authHeaderFor(admin)).send({
      name: 'Bad',
      bio: 'Bad',
      userId: 'not-an-id',
    });
    expectError(invalidUser, 400, /Invalid user ID/);

    const studentLink = await request(app).post('/api/teachers').set(authHeaderFor(admin)).send({
      name: 'Bad',
      bio: 'Bad',
      userId: String(student._id),
    });
    expectError(studentLink, 400, /Teacher role/);

    const duplicate = await request(app).post('/api/teachers').set(authHeaderFor(admin)).send({
      name: 'Bad',
      bio: 'Bad',
      userId: String(teacherUser._id),
    });
    expectError(duplicate, 400, /already linked/);

    const invalidFile = await request(app)
      .post('/api/teachers')
      .set(authHeaderFor(admin))
      .attach('profileImage', Buffer.from('text'), { filename: 'bad.txt', contentType: 'text/plain' });
    expectError(invalidFile, 400, /Only image files are allowed/);
  });
});
