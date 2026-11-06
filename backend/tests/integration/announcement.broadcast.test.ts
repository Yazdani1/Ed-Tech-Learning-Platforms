import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Announcement } from '../../src/models/Announcement.model';
import { AnnouncementBroadcast } from '../../src/models/AnnouncementBroadcast.model';
import { AnnouncementView } from '../../src/models/AnnouncementView.model';
import {
  PNG_BYTES,
  authCookie,
  bearer,
  createCourse,
  createUser,
  enrol,
  missingId,
} from '../factories';
import { mockCloudinary } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';

// The broadcast tables are global (lists, counts): every test starts without any
beforeEach(async () => {
  await Promise.all([
    AnnouncementBroadcast.deleteMany({}),
    Announcement.deleteMany({}),
    AnnouncementView.deleteMany({}),
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const STAFF = ['Super Admin', 'Admin', 'Moderator'] as const;
const OTHERS = ['Teacher', 'Student'] as const;

const as = (user: IUser) => ({ Cookie: authCookie(user) });

interface Fields {
  title?: string;
  description?: string;
  courseIds?: unknown;
}

const send = (
  user: IUser,
  fields: Fields,
  image?: { bytes: Buffer; name: string; type: string },
) => {
  const req = request(app).post('/api/announcements/broadcasts').set(as(user));
  if (fields.title !== undefined) req.field('title', fields.title);
  if (fields.description !== undefined) req.field('description', fields.description);
  if (fields.courseIds !== undefined)
    req.field(
      'courseIds',
      typeof fields.courseIds === 'string' ? fields.courseIds : JSON.stringify(fields.courseIds),
    );
  if (image) req.attach('image', image.bytes, { filename: image.name, contentType: image.type });
  return req;
};

const ids = (...courses: { _id: unknown }[]): string[] => courses.map((c) => String(c._id));

const valid = (courses: { _id: unknown }[]): Fields => ({
  title: ' Class moved ',
  description: ' <p>Tomorrow at 9</p> ',
  courseIds: ids(...courses),
});

describe('POST /api/announcements/broadcasts', () => {
  it.each(STAFF)('lets %s send one announcement to several courses', async (role) => {
    const user = await createUser(role);
    const a = await createCourse();
    const b = await createCourse();
    const res = await send(user, valid([a, b]));
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Announcement sent to 2 courses');
    expect(res.body.data).toMatchObject({ title: 'Class moved', courseCount: 2, seenCount: 0 });

    const broadcast = await AnnouncementBroadcast.findById(res.body.data._id);
    expect(broadcast).toMatchObject({ title: 'Class moved', description: '<p>Tomorrow at 9</p>' });
    expect(String(broadcast?.postedBy)).toBe(String(user._id));
    for (const course of [a, b]) {
      const posts = await Announcement.find({ course: course._id });
      expect(posts).toHaveLength(1);
      expect(posts[0]).toMatchObject({ title: 'Class moved', description: '<p>Tomorrow at 9</p>' });
      expect(String(posts[0].broadcast)).toBe(String(broadcast?._id));
      expect(String(posts[0].postedBy)).toBe(String(user._id));
    }
  });

  it('uses the singular message for one course and ignores a repeated course id', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await send(admin, { ...valid([course]), courseIds: ids(course, course) });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Announcement sent to 1 course');
    expect(await Announcement.countDocuments({ course: course._id })).toBe(1);
  });

  it('uploads an image to Cloudinary and stores its URL on the broadcast and each announcement', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const a = await createCourse();
    const b = await createCourse();
    const res = await send(admin, valid([a, b]), {
      bytes: PNG_BYTES,
      name: 'banner.png',
      type: 'image/png',
    });
    expect(res.status).toBe(201);
    expect(cloud.upload).toHaveBeenCalledTimes(1);
    expect(cloud.upload.mock.calls[0][0]).toMatchObject({ folder: 'medhabee/announcements' });
    const url = res.body.data.image.url as string;
    expect(url).toContain('medhabee/announcements');
    const posts = await Announcement.find({ broadcast: res.body.data._id });
    expect(posts).toHaveLength(2);
    expect(posts.every((post) => post.image?.url === url)).toBe(true);
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post('/api/announcements/broadcasts')
      .set('Authorization', bearer(admin))
      .field('title', 'T')
      .field('description', 'D')
      .field('courseIds', JSON.stringify(ids(course)));
    expect(res.status).toBe(201);
  });

  it('accepts the same data as a JSON body', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post('/api/announcements/broadcasts')
      .set(as(admin))
      .send({ title: 'T', description: 'D', courseIds: ids(course) });
    expect(res.status).toBe(201);
  });

  it.each([
    ['no title', { title: undefined }],
    ['blank title', { title: '   ' }],
    ['a title over 200 characters', { title: 'x'.repeat(201) }],
  ])('400 for %s', async (_label, extra) => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await send(admin, { ...valid([course]), ...extra });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title is required (at most 200 characters)');
    expect(await AnnouncementBroadcast.countDocuments()).toBe(0);
  });

  it.each([
    ['no description', { description: undefined }],
    ['a blank description', { description: '  ' }],
    ['a description over 20000 characters', { description: 'x'.repeat(20001) }],
  ])('400 for %s', async (_label, extra) => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await send(admin, { ...valid([course]), ...extra });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Description is required');
  });

  it('400 for a missing, empty or malformed course list', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const base = valid([course]);
    expect((await send(admin, { ...base, courseIds: undefined })).body.message).toBe(
      'Select at least one course',
    );
    expect((await send(admin, { ...base, courseIds: [] })).body.message).toBe(
      'Select at least one course',
    );
    expect((await send(admin, { ...base, courseIds: '{"a":1}' })).body.message).toBe(
      'Select at least one course',
    );
    expect((await send(admin, { ...base, courseIds: 'not json' })).body.message).toBe(
      'Invalid course list',
    );
    expect((await send(admin, { ...base, courseIds: ['nope'] })).body.message).toBe(
      'Invalid course id',
    );
    expect((await send(admin, { ...base, courseIds: [{ $ne: null }] })).body.message).toBe(
      'Invalid course id',
    );
    expect(await AnnouncementBroadcast.countDocuments()).toBe(0);
  });

  it('400 when a course is a Draft or does not exist (published courses only); nothing is sent', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const published = await createCourse();
    const draft = await createCourse({ status: 'Draft' });
    for (const bad of [{ _id: draft._id }, { _id: missingId() }]) {
      const res = await send(admin, valid([published, bad]), {
        bytes: PNG_BYTES,
        name: 'a.png',
        type: 'image/png',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Announcements can only be sent to published courses');
    }
    expect(await Announcement.countDocuments()).toBe(0);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('can reach a Private published course (it has students)', async () => {
    const admin = await createUser('Admin');
    const hidden = await createCourse({ visibility: 'Private' });
    expect((await send(admin, valid([hidden]))).status).toBe(201);
  });

  it('400 for a file that is not an image (by type and by content); nothing is saved', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    const course = await createCourse();
    const text = await send(admin, valid([course]), {
      bytes: Buffer.from('hello'),
      name: 'a.txt',
      type: 'text/plain',
    });
    expect(text.status).toBe(400);
    const lying = await send(admin, valid([course]), {
      bytes: Buffer.from('<script>alert(1)</script>'),
      name: 'a.png',
      type: 'image/png',
    });
    expect(lying.status).toBe(400);
    expect(lying.body.message).toBe('Only image files are allowed');
    expect(await AnnouncementBroadcast.countDocuments()).toBe(0);
    expect(await Announcement.countDocuments()).toBe(0);
  });

  it('401 without a token and 403 for a Teacher or Student (nothing sent)', async () => {
    const course = await createCourse();
    const anonymous = await request(app)
      .post('/api/announcements/broadcasts')
      .field('title', 'T')
      .field('description', 'D')
      .field('courseIds', JSON.stringify(ids(course)));
    expect(anonymous.status).toBe(401);
    for (const role of OTHERS) {
      const res = await send(await createUser(role), valid([course]));
      expect(res.status, role).toBe(403);
    }
    expect(await Announcement.countDocuments({ course: course._id })).toBe(0);
  });
});

const sendOne = async (user: IUser, courses: { _id: unknown }[], title = 'News') =>
  (await send(user, { title, description: 'Body', courseIds: ids(...courses) })).body.data as {
    _id: string;
  };

describe('GET /api/announcements/broadcasts', () => {
  it.each(STAFF)('lets %s list sent announcements, newest first, with counts', async (role) => {
    const poster = await createUser('Admin');
    const a = await createCourse();
    const b = await createCourse();
    await AnnouncementBroadcast.deleteMany({});
    const first = await sendOne(poster, [a], 'First');
    const second = await sendOne(poster, [a, b], 'Second');
    const student = await createUser('Student');
    await enrol(student, a);
    await request(app)
      .get(`/api/announcements/course/${String(a._id)}`)
      .set(as(student));

    const res = await request(app)
      .get('/api/announcements/broadcasts')
      .set(as(await createUser(role)));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 10 });
    const rows = res.body.data as {
      _id: string;
      title: string;
      courseCount: number;
      seenCount: number;
      postedBy: { name: string };
    }[];
    expect(rows.map((row) => row.title)).toEqual(['Second', 'First']);
    expect(rows[0]).toMatchObject({ _id: second._id, courseCount: 2, seenCount: 1 });
    expect(rows[1]).toMatchObject({ _id: first._id, courseCount: 1, seenCount: 1 });
    expect(rows[0].postedBy.name).toBe(poster.name);
  });

  it('paginates and caps the page size', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await AnnouncementBroadcast.deleteMany({});
    for (const title of ['A', 'B', 'C']) await sendOne(admin, [course], title);
    const page = await request(app)
      .get('/api/announcements/broadcasts?page=2&limit=2')
      .set(as(admin));
    expect(page.body.data).toHaveLength(1);
    expect(page.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    const capped = await request(app)
      .get('/api/announcements/broadcasts?limit=9999')
      .set(as(admin));
    expect(capped.body.limit).toBe(100);
  });

  it('401 without a token and 403 for a Teacher or Student', async () => {
    expect((await request(app).get('/api/announcements/broadcasts')).status).toBe(401);
    for (const role of OTHERS) {
      const res = await request(app)
        .get('/api/announcements/broadcasts')
        .set(as(await createUser(role)));
      expect(res.status, role).toBe(403);
    }
  });
});

describe('GET /api/announcements/broadcasts/:id', () => {
  it('gives details, each course with its student and seen counts, and who posted', async () => {
    const poster = await createUser('Moderator');
    const a = await createCourse();
    const b = await createCourse();
    const broadcast = await sendOne(poster, [a, b]);
    const s1 = await createUser('Student');
    const s2 = await createUser('Student');
    const s3 = await createUser('Student');
    await enrol(s1, a);
    await enrol(s2, a);
    await enrol(s1, b);
    await enrol(s3, b);
    for (const student of [s1, s2]) {
      await request(app)
        .get(`/api/announcements/course/${String(a._id)}`)
        .set(as(student));
    }
    await request(app)
      .get(`/api/announcements/course/${String(b._id)}`)
      .set(as(s1));

    const res = await request(app)
      .get(`/api/announcements/broadcasts/${broadcast._id}`)
      .set(as(await createUser('Admin')));
    expect(res.status).toBe(200);
    const data = res.body.data as {
      title: string;
      courseCount: number;
      seenCount: number;
      postedBy: { name: string };
      courses: { _id: string; studentCount: number; seenCount: number }[];
    };
    expect(data).toMatchObject({ title: 'News', courseCount: 2, seenCount: 2 });
    expect(data.postedBy.name).toBe(poster.name);
    const byId = new Map(data.courses.map((course) => [course._id, course]));
    expect(byId.get(String(a._id))).toMatchObject({ studentCount: 2, seenCount: 2 });
    expect(byId.get(String(b._id))).toMatchObject({ studentCount: 2, seenCount: 1 });
  });

  it('400 for a malformed id and 404 for an unknown announcement', async () => {
    const admin = await createUser('Admin');
    expect(
      (await request(app).get('/api/announcements/broadcasts/nope').set(as(admin))).status,
    ).toBe(400);
    expect(
      (await request(app).get(`/api/announcements/broadcasts/${missingId()}`).set(as(admin)))
        .status,
    ).toBe(404);
  });

  it('401 without a token and 403 for a Teacher or Student', async () => {
    const admin = await createUser('Admin');
    const broadcast = await sendOne(admin, [await createCourse()]);
    expect((await request(app).get(`/api/announcements/broadcasts/${broadcast._id}`)).status).toBe(
      401,
    );
    for (const role of OTHERS) {
      const res = await request(app)
        .get(`/api/announcements/broadcasts/${broadcast._id}`)
        .set(as(await createUser(role)));
      expect(res.status, role).toBe(403);
    }
  });
});

describe('seen tracking: GET /api/announcements/course/:courseId', () => {
  const open = (user: IUser, course: { _id: unknown }) =>
    request(app)
      .get(`/api/announcements/course/${String(course._id)}`)
      .set(as(user));

  it('records one view per student per announcement, however often the list is opened', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const broadcast = await sendOne(admin, [course]);
    const plain = await Announcement.create({
      course: course._id,
      title: 'Plain',
      description: 'd',
      postedBy: admin._id,
    });
    const student = await createUser('Student');
    await enrol(student, course);

    for (let i = 0; i < 3; i += 1) expect((await open(student, course)).status).toBe(200);

    expect(await AnnouncementView.countDocuments({ student: student._id })).toBe(2);
    const plainView = await AnnouncementView.findOne({ announcement: plain._id });
    expect(plainView?.broadcast).toBeUndefined();
    const broadcastView = await AnnouncementView.findOne({ broadcast: broadcast._id });
    expect(String(broadcastView?.student)).toBe(String(student._id));
  });

  it('counts a student once per broadcast even when two of its courses are opened', async () => {
    const admin = await createUser('Admin');
    const a = await createCourse();
    const b = await createCourse();
    const broadcast = await sendOne(admin, [a, b]);
    const student = await createUser('Student');
    await enrol(student, a);
    await enrol(student, b);
    await open(student, a);
    await open(student, b);
    const res = await request(app)
      .get(`/api/announcements/broadcasts/${broadcast._id}`)
      .set(as(admin));
    expect(res.body.data.seenCount).toBe(1);
  });

  it('records nothing for staff or for a course without announcements', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const empty = await createCourse();
    await sendOne(admin, [course]);
    const student = await createUser('Student');
    await enrol(student, empty);
    expect((await open(student, empty)).body.data).toEqual([]);
    expect((await open(admin, course)).status).toBe(200);
    expect(await AnnouncementView.countDocuments()).toBe(0);
  });

  it('records nothing for a student who is not enrolled (403)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await sendOne(admin, [course]);
    const outsider = await createUser('Student');
    expect((await open(outsider, course)).status).toBe(403);
    expect(await AnnouncementView.countDocuments()).toBe(0);
  });

  it('answers 401 without a token', async () => {
    const course = await createCourse();
    expect((await request(app).get(`/api/announcements/course/${String(course._id)}`)).status).toBe(
      401,
    );
  });
});
