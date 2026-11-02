import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { User } from '../../src/models/User.model';
import { assignMissingStudentNumbers } from '../../src/utils/studentNumber';
import { authCookie, createUser, nextId, TEST_PASSWORD } from '../factories';

const PATTERN = /^\d{3}-\d{3}-\d{3}$/;

/** Removes the number straight in the database (an account from before student numbers existed). */
const stripNumber = (id: unknown) =>
  User.collection.updateOne({ _id: id as never }, { $unset: { studentNumber: '' } });

describe('student number', () => {
  it('is given to a student on register', async () => {
    const email = `reg${nextId()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New Student', email, password: TEST_PASSWORD });
    expect(res.status).toBe(201);
    const saved = await User.findOne({ email });
    expect(saved?.studentNumber).toMatch(PATTERN);
  });

  it('is given to a student created by an admin, and numbers are unique', async () => {
    const admin = await createUser('Admin');
    const numbers: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const email = `made${nextId()}@example.com`;
      const res = await request(app)
        .post('/api/users')
        .set('Cookie', authCookie(admin))
        .send({ name: 'Made', email, password: TEST_PASSWORD, role: 'Student' });
      expect(res.status).toBe(201);
      numbers.push((await User.findOne({ email }))?.studentNumber ?? '');
    }
    numbers.forEach((n) => expect(n).toMatch(PATTERN));
    expect(new Set(numbers).size).toBe(3);
  });

  it.each(['Super Admin', 'Admin', 'Moderator', 'Teacher'] as const)(
    'is not given to a %s',
    async (role) => {
      const user = await createUser(role);
      expect((await User.findById(user._id))?.studentNumber).toBeUndefined();
    },
  );

  it('never changes on later saves', async () => {
    const student = await createUser('Student');
    const first = (await User.findById(student._id))?.studentNumber;
    expect(first).toMatch(PATTERN);
    const doc = await User.findById(student._id);
    doc!.name = 'Renamed'; // non-null: the user was just created
    await doc!.save();
    expect((await User.findById(student._id))?.studentNumber).toBe(first);
  });

  it('is assigned when PUT /api/users/:id/role makes a user a Student', async () => {
    const admin = await createUser('Admin');
    const teacher = await createUser('Teacher');
    const res = await request(app)
      .put(`/api/users/${teacher._id}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Student' });
    expect(res.status).toBe(200);
    expect(res.body.data.studentNumber).toMatch(PATTERN);
    expect((await User.findById(teacher._id))?.studentNumber).toBe(res.body.data.studentNumber);
  });

  it('is kept when a student changes role and comes back', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const original = (await User.findById(student._id))?.studentNumber;
    await request(app)
      .put(`/api/users/${student._id}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Teacher' });
    const back = await request(app)
      .put(`/api/users/${student._id}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Student' });
    expect(back.body.data.studentNumber).toBe(original);
  });

  it('is assigned when PUT /api/users/:id changes the role to Student', async () => {
    const admin = await createUser('Admin');
    const mod = await createUser('Moderator');
    const res = await request(app)
      .put(`/api/users/${mod._id}`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Student' });
    expect(res.status).toBe(200);
    expect(res.body.data.studentNumber).toMatch(PATTERN);
  });

  it('is not assigned when the role changes to a non-student role', async () => {
    const admin = await createUser('Admin');
    const mod = await createUser('Moderator');
    const res = await request(app)
      .put(`/api/users/${mod._id}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Teacher' });
    expect(res.status).toBe(200);
    expect(res.body.data.studentNumber).toBeUndefined();
  });

  it('GET /api/auth/me gives an older student without a number one', async () => {
    const student = await createUser('Student');
    await stripNumber(student._id);
    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.data.studentNumber).toMatch(PATTERN);
    expect((await User.findById(student._id))?.studentNumber).toBe(res.body.data.studentNumber);
  });

  it('GET /api/auth/me shows no number for a non-student', async () => {
    const teacher = await createUser('Teacher');
    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie(teacher));
    expect(res.body.data.studentNumber).toBeUndefined();
  });

  it('assignMissingStudentNumbers backfills only students and returns the count', async () => {
    const a = await createUser('Student');
    const b = await createUser('Student');
    const keep = await createUser('Student');
    const teacher = await createUser('Teacher');
    const keepNumber = (await User.findById(keep._id))?.studentNumber;
    await stripNumber(a._id);
    await stripNumber(b._id);

    expect(await assignMissingStudentNumbers()).toBe(2);

    expect((await User.findById(a._id))?.studentNumber).toMatch(PATTERN);
    expect((await User.findById(b._id))?.studentNumber).toMatch(PATTERN);
    expect((await User.findById(keep._id))?.studentNumber).toBe(keepNumber);
    expect((await User.findById(teacher._id))?.studentNumber).toBeUndefined();
    expect(await assignMissingStudentNumbers()).toBe(0);
  });

  it('the user list search finds a student by number', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student', { name: 'Zed Findable' });
    await createUser('Student');
    const number = (await User.findById(student._id))?.studentNumber ?? '';

    const res = await request(app)
      .get(`/api/users?search=${encodeURIComponent(number)}`)
      .set('Cookie', authCookie(admin));

    expect(res.status).toBe(200);
    expect(res.body.data.map((u: { _id: string }) => u._id)).toEqual([String(student._id)]);
    expect(res.body.data[0].studentNumber).toBe(number);
  });
});
