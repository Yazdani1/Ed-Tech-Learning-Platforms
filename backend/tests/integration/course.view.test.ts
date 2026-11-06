import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { CourseView } from '../../src/models/CourseView.model';
import { authCookie, bearer, createCourse, createUser, missingId } from '../factories';

afterEach(() => {
  vi.useRealTimers();
});

const view = (id: string) => request(app).post(`/api/courses/${id}/view`);
const viewsOf = async (id: unknown): Promise<number> =>
  (await Course.findById(id))?.viewCount ?? -1;

const vidCookie = (res: request.Response): string => {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const found = cookies?.find((cookie) => cookie.startsWith('vid='));
  return found ? found.split(';')[0] : '';
};

describe('POST /api/courses/:id/view', () => {
  it('counts a signed-in visitor once per day', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    const first = await view(String(course._id)).set('Cookie', authCookie(student));
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ success: true, data: { counted: true } });
    const again = await view(String(course._id)).set('Cookie', authCookie(student));
    expect(again.status).toBe(200);
    expect(again.body.data.counted).toBe(false);
    expect(await viewsOf(course._id)).toBe(1);
    expect(await CourseView.countDocuments({ course: course._id })).toBe(1);
  });

  it('counts different signed-in users separately (also with the Bearer header)', async () => {
    const course = await createCourse();
    const a = await createUser('Student');
    const b = await createUser('Teacher');
    await view(String(course._id)).set('Cookie', authCookie(a));
    await view(String(course._id)).set('Authorization', bearer(b));
    expect(await viewsOf(course._id)).toBe(2);
  });

  it('gives a guest the vid cookie with GET /api/courses/:id; the view then counts once per day', async () => {
    const course = await createCourse();
    const page = await request(app).get(`/api/courses/${String(course._id)}`);
    const vid = vidCookie(page);
    expect(vid).toMatch(/^vid=[0-9a-f-]{36}$/);
    const flags = (page.headers['set-cookie'] as unknown as string[]).join(';');
    expect(flags).toContain('HttpOnly');

    const first = await view(String(course._id)).set('Cookie', vid);
    expect(first.status).toBe(200);
    expect(first.body.data.counted).toBe(true);
    const again = await view(String(course._id)).set('Cookie', vid);
    expect(again.body.data.counted).toBe(false);
    expect(await viewsOf(course._id)).toBe(1);
  });

  it('does not count a guest request without the cookie (it only sets one): no inflation by cookie-less scripts', async () => {
    const course = await createCourse();
    const res = await view(String(course._id));
    expect(res.body.data.counted).toBe(false);
    expect(vidCookie(res)).toMatch(/^vid=[0-9a-f-]{36}$/);
    await view(String(course._id));
    expect(await viewsOf(course._id)).toBe(0);
  });

  it('ignores a malformed vid cookie and issues a new one (not counted)', async () => {
    const course = await createCourse();
    const res = await view(String(course._id)).set('Cookie', 'vid=not-a-uuid');
    expect(res.body.data.counted).toBe(false);
    expect(vidCookie(res)).toMatch(/^vid=[0-9a-f-]{36}$/);
  });

  it('counts the same visitor again on the next UTC day', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2030-03-01T23:59:00Z') });
    const day1 = await view(String(course._id)).set('Cookie', authCookie(student));
    expect(day1.body.data.counted).toBe(true);
    vi.setSystemTime(new Date('2030-03-02T00:01:00Z'));
    const day2 = await view(String(course._id)).set('Cookie', authCookie(student));
    expect(day2.body.data.counted).toBe(true);
    vi.setSystemTime(new Date('2030-03-02T10:00:00Z'));
    const sameDay = await view(String(course._id)).set('Cookie', authCookie(student));
    expect(sameDay.body.data.counted).toBe(false);
    vi.useRealTimers();
    expect(await viewsOf(course._id)).toBe(2);
  });

  it('counts a visit once even when two requests arrive together', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    const results = await Promise.all(
      [1, 2, 3].map(() => view(String(course._id)).set('Cookie', authCookie(student))),
    );
    expect(results.every((res) => res.status === 200)).toBe(true);
    expect(results.filter((res) => res.body.data.counted)).toHaveLength(1);
    expect(await viewsOf(course._id)).toBe(1);
  });

  it('404 for a Draft or Private course (and counts nothing), even for staff', async () => {
    const draft = await createCourse({ status: 'Draft' });
    const hidden = await createCourse({ visibility: 'Private' });
    const admin = await createUser('Admin');
    for (const course of [draft, hidden]) {
      const res = await view(String(course._id)).set('Cookie', authCookie(admin));
      expect(res.status).toBe(404);
      expect(await viewsOf(course._id)).toBe(0);
    }
  });

  it('404 for an unknown course and 400 for a malformed id', async () => {
    expect((await view(missingId())).status).toBe(404);
    expect((await view('nope')).status).toBe(400);
  });
});
