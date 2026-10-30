import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Category } from '../../src/models/Category.model';
import {
  authCookie,
  bearer,
  createCategory,
  createCourse,
  createUser,
  missingId,
  nextId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';

describe('GET /api/categories', () => {
  it('is public and returns every category sorted by name with a total', async () => {
    const tag = nextId();
    await createCategory({ name: `Zeta ${tag}`, slug: `zeta-${tag}` });
    await createCategory({ name: `Alpha ${tag}`, slug: `alpha-${tag}` });

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = (res.body.data as { name: string }[]).map((c) => c.name);
    expect(res.body.total).toBe(names.length);
    expect(names.indexOf(`Alpha ${tag}`)).toBeLessThan(names.indexOf(`Zeta ${tag}`));
  });
});

describe('POST /api/categories', () => {
  it.each(ADMIN_ROLES)('lets %s create a category (slug built from the name)', async (role) => {
    const user = await createUser(role);
    const n = nextId();

    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(user))
      .send({ name: `Web Dev ${n}!`, description: 'All about the web' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Category created' });
    expect(res.body.data).toMatchObject({
      name: `Web Dev ${n}!`,
      slug: `web-dev-${n}`,
      description: 'All about the web',
    });
    const saved = await Category.findById(res.body.data._id);
    expect(saved?.slug).toBe(`web-dev-${n}`);
  });

  it('accepts the Bearer header too', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', bearer(admin))
      .send({ name: `Bearer ${nextId()}` });
    expect(res.status).toBe(201);
  });

  it('answers 400 when the name is missing', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Category name is required' });
  });

  it('answers 400 when the name has no letters or digits (empty slug)', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin))
      .send({ name: '!!!' });
    expect(res.status).toBe(400);
  });

  it('answers 400 (not 500) when the name is not a string', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin))
      .send({ name: { $ne: 'x' } });
    expect(res.status).toBe(400);
  });

  it('answers 400 when another category already has the same slug', async () => {
    const admin = await createUser('Admin');
    const n = nextId();
    await createCategory({ name: `Maths ${n}`, slug: `maths-${n}` });
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin))
      .send({ name: `MATHS ${n}` });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Category already exists' });
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and saves nothing', async (role) => {
    const user = await createUser(role);
    const name = `Blocked ${role} ${nextId()}`;
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(user))
      .send({ name });
    expect(res.status).toBe(403);
    expect(await Category.countDocuments({ name })).toBe(0);
  });
});

describe('PUT /api/categories/:id', () => {
  it.each(ADMIN_ROLES)('lets %s rename a category and refreshes the slug', async (role) => {
    const user = await createUser(role);
    const category = await createCategory();
    const n = nextId();

    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(user))
      .send({ name: `Renamed ${n}`, description: 'new text' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Category updated');
    expect(res.body.data).toMatchObject({
      name: `Renamed ${n}`,
      slug: `renamed-${n}`,
      description: 'new text',
    });
    const saved = await Category.findById(category._id);
    expect(saved?.slug).toBe(`renamed-${n}`);
  });

  it('changes only the description when no name is sent', async () => {
    const admin = await createUser('Admin');
    const category = await createCategory();
    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(admin))
      .send({ description: 'only this' });
    expect(res.status).toBe(200);
    const saved = await Category.findById(category._id);
    expect(saved?.name).toBe(category.name);
    expect(saved?.slug).toBe(category.slug);
    expect(saved?.description).toBe('only this');
  });

  it('answers 400 when the new name collides with another category slug', async () => {
    const admin = await createUser('Admin');
    const other = await createCategory();
    const category = await createCategory();
    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: other.name });
    expect(res.status).toBe(400);
  });

  it('answers 400 and keeps the old slug when the new name has no letters or digits', async () => {
    const admin = await createUser('Admin');
    const category = await createCategory();
    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: '!!!' });
    expect(res.status).toBe(400);
    const saved = await Category.findById(category._id);
    expect(saved?.slug).toBe(category.slug);
  });

  it('answers 404 for an unknown id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .put(`/api/categories/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  it('answers 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .put('/api/categories/not-an-id')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    expect(res.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const category = await createCategory();
    const res = await request(app).put(`/api/categories/${category._id}`).send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and changes nothing', async (role) => {
    const user = await createUser(role);
    const category = await createCategory();
    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(user))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
    expect((await Category.findById(category._id))?.name).toBe(category.name);
  });
});

describe('DELETE /api/categories/:id', () => {
  it.each(ADMIN_ROLES)('lets %s delete an unused category', async (role) => {
    const user = await createUser(role);
    const category = await createCategory();
    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Category deleted' });
    expect(await Category.findById(category._id)).toBeNull();
  });

  it('refuses to delete a category that courses still use (courses would lose their category)', async () => {
    const admin = await createUser('Admin');
    const category = await createCategory();
    await createCourse({ category: category._id });
    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Category is used by 1 course(s)');
    expect(await Category.findById(category._id)).not.toBeNull();
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .delete(`/api/categories/${missingId()}`)
      .set('Cookie', authCookie(admin));
    expect(missing.status).toBe(404);
    const bad = await request(app).delete('/api/categories/nope').set('Cookie', authCookie(admin));
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const category = await createCategory();
    const res = await request(app).delete(`/api/categories/${category._id}`);
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and keeps the category', async (role) => {
    const user = await createUser(role);
    const category = await createCategory();
    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
    expect(await Category.findById(category._id)).not.toBeNull();
  });
});
