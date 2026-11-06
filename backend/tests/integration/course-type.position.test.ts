import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { CourseType } from '../../src/models/CourseType.model';
import { authCookie, createCourseType, createUser, nextId } from '../factories';

describe('course type position (home page order)', () => {
  it('lists numbered types first by position, then the others by name', async () => {
    const tag = nextId();
    await createCourseType({ name: `A none ${tag}`, slug: `a-none-${tag}` });
    await createCourseType({ name: `B second ${tag}`, slug: `b-second-${tag}`, position: 2 });
    await createCourseType({ name: `C first ${tag}`, slug: `c-first-${tag}`, position: 1 });

    const res = await request(app).get('/api/course-types');

    const names = (res.body.data as { name: string }[])
      .map((c) => c.name)
      .filter((name) => name.endsWith(String(tag)));
    expect(names).toEqual([`C first ${tag}`, `B second ${tag}`, `A none ${tag}`]);
  });

  it('saves a position on create and changes or clears it on update', async () => {
    const admin = await createUser('Admin');
    const created = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(admin))
      .send({ name: `Pos ${nextId()}`, position: 3 });
    expect(created.status).toBe(201);
    expect(created.body.data.position).toBe(3);

    const id = created.body.data._id as string;
    const changed = await request(app)
      .put(`/api/course-types/${id}`)
      .set('Cookie', authCookie(admin))
      .send({ position: '5' });
    expect(changed.status).toBe(200);
    expect(changed.body.data.position).toBe(5);

    const cleared = await request(app)
      .put(`/api/course-types/${id}`)
      .set('Cookie', authCookie(admin))
      .send({ position: '' });
    expect(cleared.status).toBe(200);
    expect((await CourseType.findById(id))?.position).toBeNull();
  });

  it.each([0, -1, 1.5, 1000, 'abc', true])('400 for position %s', async (position) => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(admin))
      .send({ name: `Bad ${nextId()}`, position });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Position must be a whole number from 1 to 999');
  });
});
