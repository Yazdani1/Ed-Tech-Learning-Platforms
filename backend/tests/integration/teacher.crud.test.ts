import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Teacher } from '../../src/models/Teacher.model';
import {
  PNG_BYTES,
  authCookie,
  bearer,
  createCourse,
  createTeacherProfile,
  createUser,
  missingId,
  nextId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/teachers and GET /api/teachers/:id', () => {
  it('lists teachers publicly, sorted by name, with a total', async () => {
    const tag = nextId();
    await createTeacherProfile(undefined, { name: `Zed ${tag}` });
    await createTeacherProfile(undefined, { name: `Abe ${tag}` });

    const res = await request(app).get('/api/teachers');

    expect(res.status).toBe(200);
    const names = (res.body.data as { name: string }[]).map((t) => t.name);
    expect(res.body.total).toBe(names.length);
    expect(names.indexOf(`Abe ${tag}`)).toBeLessThan(names.indexOf(`Zed ${tag}`));
  });

  it('returns one teacher publicly', async () => {
    const teacher = await createTeacherProfile(undefined, { expertise: ['math'] });
    const res = await request(app).get(`/api/teachers/${teacher._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: teacher.name,
      bio: teacher.bio,
      expertise: ['math'],
    });
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    expect((await request(app).get(`/api/teachers/${missingId()}`)).status).toBe(404);
    expect((await request(app).get('/api/teachers/nope')).status).toBe(400);
  });

  it('does not expose the linked login account id to the public', async () => {
    const user = await createUser('Teacher');
    const teacher = await createTeacherProfile(user);
    const res = await request(app).get(`/api/teachers/${teacher._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBeUndefined();
  });

  it('never sends the Cloudinary public id of the profile image', async () => {
    await createTeacherProfile(undefined, { profileImagePublicId: 'secret/teacher-img' });
    const list = await request(app).get('/api/teachers');
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toContain('secret/teacher-img');
  });

  it('shows the linked login account id to Super Admin and Admin only', async () => {
    const user = await createUser('Teacher');
    const teacher = await createTeacherProfile(user);
    for (const role of ADMIN_ROLES) {
      const res = await request(app)
        .get(`/api/teachers/${teacher._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.body.data.userId, role).toBe(String(user._id));
    }
    for (const role of NON_ADMIN_ROLES) {
      const list = await request(app)
        .get('/api/teachers')
        .set('Cookie', authCookie(await createUser(role)));
      const row = (list.body.data as { _id: string; userId?: string }[]).find(
        (t) => t._id === String(teacher._id),
      );
      expect(row?.userId, role).toBeUndefined();
    }
  });
});

describe('GET /api/teachers/my-courses', () => {
  it('returns only the courses of the signed-in teacher, newest first, with populated refs', async () => {
    const user = await createUser('Teacher');
    const profile = await createTeacherProfile(user);
    const other = await createTeacherProfile(await createUser('Teacher'));
    const first = await createCourse({ teachers: [profile._id] });
    const second = await createCourse({ teachers: [profile._id], status: 'Draft' });
    await createCourse({ teachers: [other._id] });

    const res = await request(app).get('/api/teachers/my-courses').set('Cookie', authCookie(user));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const ids = (res.body.data as { _id: string }[]).map((c) => c._id);
    expect(ids).toEqual([String(second._id), String(first._id)]);
    expect(res.body.data[0].category).toHaveProperty('name');
    expect(res.body.data[0].teachers[0]).toMatchObject({ name: profile.name });
  });

  it('returns an empty list when the teacher has no profile', async () => {
    const user = await createUser('Teacher');
    const res = await request(app).get('/api/teachers/my-courses').set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [], total: 0 });
  });

  it('accepts the Bearer header', async () => {
    const user = await createUser('Teacher');
    const res = await request(app)
      .get('/api/teachers/my-courses')
      .set('Authorization', bearer(user));
    expect(res.status).toBe(200);
  });

  it('answers 401 without a token', async () => {
    expect((await request(app).get('/api/teachers/my-courses')).status).toBe(401);
  });

  it.each(['Super Admin', 'Admin', 'Moderator', 'Student'] as const)(
    'answers 403 for %s',
    async (role) => {
      const user = await createUser(role);
      const res = await request(app)
        .get('/api/teachers/my-courses')
        .set('Cookie', authCookie(user));
      expect(res.status).toBe(403);
    },
  );
});

describe('POST /api/teachers', () => {
  it.each(ADMIN_ROLES)(
    'lets %s create a teacher with an image, expertise and links',
    async (role) => {
      const cloud = mockCloudinary();
      const admin = await createUser(role);
      const linked = await createUser('Teacher');
      const name = `New Teacher ${nextId()}`;

      const res = await request(app)
        .post('/api/teachers')
        .set('Cookie', authCookie(admin))
        .field('name', name)
        .field('bio', 'Great teacher')
        .field('expertise', 'math, physics')
        .field('socialLinks', JSON.stringify({ website: 'https://t.example.com' }))
        .field('userId', String(linked._id))
        .attach('profileImage', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Teacher created');
      expect(cloud.upload).toHaveBeenCalledTimes(1);
      const saved = await Teacher.findById(res.body.data._id).select('+profileImagePublicId');
      expect(saved).toMatchObject({ name, bio: 'Great teacher' });
      expect(saved?.expertise).toEqual(['math', 'physics']);
      expect(saved?.socialLinks?.website).toBe('https://t.example.com');
      expect(String(saved?.userId)).toBe(String(linked._id));
      expect(saved?.profileImage).toContain('https://res.cloudinary.com/');
      expect(saved?.profileImagePublicId).toBeTruthy();
    },
  );

  it('creates a teacher without image and user link', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'Plain', bio: 'bio' });
    expect(res.status).toBe(201);
    expect(res.body.data.expertise).toEqual([]);
  });

  it('answers 400 when name or bio is missing', async () => {
    const admin = await createUser('Admin');
    const before = await Teacher.countDocuments();
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'No bio' });
    expect(res.status).toBe(400);
    expect(await Teacher.countDocuments()).toBe(before);
  });

  it('answers 400 (not 500) when socialLinks is not valid JSON', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x', bio: 'y', socialLinks: '{broken' });
    expect(res.status).toBe(400);
  });

  it('rejects a non-image upload by its content type', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .field('name', 'x')
      .field('bio', 'y')
      .attach('profileImage', Buffer.from('plain text'), {
        filename: 'a.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
  });

  it('rejects a file that claims to be an image but is not (magic bytes check)', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .field('name', 'x')
      .field('bio', 'y')
      .attach('profileImage', Buffer.from('<script>alert(1)</script>'), {
        filename: 'a.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(400);
  });

  it('answers 400 for a malformed userId, 404 for an unknown user', async () => {
    const admin = await createUser('Admin');
    const bad = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x', bio: 'y', userId: 'nope' });
    expect(bad.status).toBe(400);
    const missing = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x', bio: 'y', userId: missingId() });
    expect(missing.status).toBe(404);
  });

  it('answers 400 when the linked user is not a Teacher', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x', bio: 'y', userId: String(student._id) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Linked user must have the Teacher role');
  });

  it('answers 400 when the user already has a teacher profile', async () => {
    const admin = await createUser('Admin');
    const user = await createUser('Teacher');
    await createTeacherProfile(user);
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x', bio: 'y', userId: String(user._id) });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This user is already linked to another teacher profile');
  });

  it('does not leave an uploaded image behind when the user link is refused', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(admin))
      .field('name', 'x')
      .field('bio', 'y')
      .field('userId', String(student._id))
      .attach('profileImage', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).post('/api/teachers').send({ name: 'x', bio: 'y' });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s', async (role) => {
    const user = await createUser(role);
    const name = `Blocked ${nextId()}`;
    const res = await request(app)
      .post('/api/teachers')
      .set('Cookie', authCookie(user))
      .send({ name, bio: 'y' });
    expect(res.status).toBe(403);
    expect(await Teacher.countDocuments({ name })).toBe(0);
  });
});

describe('PUT /api/teachers/:id', () => {
  it.each(ADMIN_ROLES)('lets %s update fields and replaces the image', async (role) => {
    const cloud = mockCloudinary();
    const admin = await createUser(role);
    const teacher = await createTeacherProfile(undefined, {
      profileImagePublicId: 'old/public-id',
    });

    const res = await request(app)
      .put(`/api/teachers/${teacher._id}`)
      .set('Cookie', authCookie(admin))
      .field('name', 'Changed')
      .field('bio', 'New bio')
      .field('expertise', 'a, b')
      .field('socialLinks', JSON.stringify({ youtube: 'https://y.example.com' }))
      .attach('profileImage', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Teacher updated');
    expect(cloud.destroy).toHaveBeenCalledWith('old/public-id');
    const saved = await Teacher.findById(teacher._id);
    expect(saved).toMatchObject({ name: 'Changed', bio: 'New bio' });
    expect(saved?.expertise).toEqual(['a', 'b']);
    expect(saved?.socialLinks?.youtube).toBe('https://y.example.com');
    expect(saved?.profileImage).toContain('https://res.cloudinary.com/');
  });

  it('links a Teacher user, then unlinks with an empty userId', async () => {
    const admin = await createUser('Admin');
    const user = await createUser('Teacher');
    const teacher = await createTeacherProfile();

    const link = await request(app)
      .put(`/api/teachers/${teacher._id}`)
      .set('Cookie', authCookie(admin))
      .send({ userId: String(user._id) });
    expect(link.status).toBe(200);
    expect(String((await Teacher.findById(teacher._id))?.userId)).toBe(String(user._id));

    const unlink = await request(app)
      .put(`/api/teachers/${teacher._id}`)
      .set('Cookie', authCookie(admin))
      .send({ userId: '' });
    expect(unlink.status).toBe(200);
    expect((await Teacher.findById(teacher._id))?.userId).toBeUndefined();
  });

  it('answers 400 for a bad userId: malformed, wrong role, already linked; 404 unknown user', async () => {
    const admin = await createUser('Admin');
    const teacher = await createTeacherProfile();
    const put = (userId: string) =>
      request(app)
        .put(`/api/teachers/${teacher._id}`)
        .set('Cookie', authCookie(admin))
        .send({ userId });

    expect((await put('nope')).status).toBe(400);
    expect((await put(String((await createUser('Student'))._id))).status).toBe(400);
    const taken = await createUser('Teacher');
    await createTeacherProfile(taken);
    expect((await put(String(taken._id))).status).toBe(400);
    expect((await put(missingId())).status).toBe(404);
  });

  it('answers 400 (not 500) when socialLinks is not valid JSON', async () => {
    const admin = await createUser('Admin');
    const teacher = await createTeacherProfile();
    const res = await request(app)
      .put(`/api/teachers/${teacher._id}`)
      .set('Cookie', authCookie(admin))
      .send({ socialLinks: '{broken' });
    expect(res.status).toBe(400);
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .put(`/api/teachers/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    expect(missing.status).toBe(404);
    const bad = await request(app)
      .put('/api/teachers/nope')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const teacher = await createTeacherProfile();
    expect(
      (await request(app).put(`/api/teachers/${teacher._id}`).send({ name: 'x' })).status,
    ).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)(
    'answers 403 for %s (a teacher cannot edit any profile, even their own)',
    async (role) => {
      const user = await createUser(role);
      const teacher = await createTeacherProfile(role === 'Teacher' ? user : undefined);
      const res = await request(app)
        .put(`/api/teachers/${teacher._id}`)
        .set('Cookie', authCookie(user))
        .send({ name: 'Hacked' });
      expect(res.status).toBe(403);
      expect((await Teacher.findById(teacher._id))?.name).toBe(teacher.name);
    },
  );
});

describe('DELETE /api/teachers/:id', () => {
  it.each(ADMIN_ROLES)(
    'lets %s delete a teacher and removes the image from Cloudinary',
    async (role) => {
      const cloud = mockCloudinary();
      const admin = await createUser(role);
      const teacher = await createTeacherProfile(undefined, {
        profileImagePublicId: 'img/to-delete',
      });

      const res = await request(app)
        .delete(`/api/teachers/${teacher._id}`)
        .set('Cookie', authCookie(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Teacher deleted' });
      expect(cloud.destroy).toHaveBeenCalledWith('img/to-delete');
      expect(await Teacher.findById(teacher._id)).toBeNull();
    },
  );

  it('removes the deleted teacher from the courses that listed them', async () => {
    const admin = await createUser('Admin');
    const teacher = await createTeacherProfile();
    const course = await createCourse({ teachers: [teacher._id] });
    await request(app).delete(`/api/teachers/${teacher._id}`).set('Cookie', authCookie(admin));
    const { Course } = await import('../../src/models/Course.model');
    const saved = await Course.findById(course._id);
    expect(saved?.teachers.map(String)).not.toContain(String(teacher._id));
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    expect(
      (await request(app).delete(`/api/teachers/${missingId()}`).set('Cookie', authCookie(admin)))
        .status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/teachers/nope').set('Cookie', authCookie(admin))).status,
    ).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const teacher = await createTeacherProfile();
    expect((await request(app).delete(`/api/teachers/${teacher._id}`)).status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and keeps the teacher', async (role) => {
    const user = await createUser(role);
    const teacher = await createTeacherProfile();
    const res = await request(app)
      .delete(`/api/teachers/${teacher._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
    expect(await Teacher.findById(teacher._id)).not.toBeNull();
  });
});
