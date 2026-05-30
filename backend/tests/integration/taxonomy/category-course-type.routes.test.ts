import request from 'supertest';
import app from '../../../src/app';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCategory, createCourseType, makeObjectId } from '../../helpers/data.helper';

describe('Category API', () => {
  it('lists categories publicly and creates, updates, deletes as admin', async () => {
    await createCategory('Backend');
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const list = await request(app).get('/api/categories');
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const create = await request(app).post('/api/categories').set(authHeaderFor(admin)).send({
      name: 'Data Science',
      description: 'Analytics and ML',
    });
    expectSuccess(create, 201);
    expect(create.body.data.slug).toBe('data-science');

    const update = await request(app).put(`/api/categories/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      name: 'Machine Learning',
      description: 'Updated',
    });
    expectSuccess(update);
    expect(update.body.data.slug).toBe('machine-learning');

    const remove = await request(app).delete(`/api/categories/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('rejects invalid category data, duplicates, bad ids, and missing records', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    await createCategory('Backend');

    const missingName = await request(app).post('/api/categories').set(authHeaderFor(admin)).send({});
    expectError(missingName, 400, /Category name is required/);

    const duplicate = await request(app).post('/api/categories').set(authHeaderFor(admin)).send({ name: 'Backend' });
    expectError(duplicate, 400, /Category already exists/);

    const invalidId = await request(app).put('/api/categories/not-an-id').set(authHeaderFor(admin)).send({ name: 'X' });
    expectError(invalidId, 400, /Invalid _id/);

    const missing = await request(app).delete(`/api/categories/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missing, 404, /Category not found/);
  });
});

describe('Course Type API', () => {
  it('lists course types publicly and creates, updates, deletes as admin', async () => {
    await createCourseType('Bootcamp');
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const list = await request(app).get('/api/course-types');
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const create = await request(app).post('/api/course-types').set(authHeaderFor(admin)).send({
      name: 'Workshop',
      description: 'Short live class',
    });
    expectSuccess(create, 201);
    expect(create.body.data.slug).toBe('workshop');

    const update = await request(app).put(`/api/course-types/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      name: 'Cohort',
      description: 'Updated',
    });
    expectSuccess(update);
    expect(update.body.data.slug).toBe('cohort');

    const remove = await request(app).delete(`/api/course-types/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('rejects invalid course type data, duplicates, bad ids, and missing records', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    await createCourseType('Bootcamp');

    const missingName = await request(app).post('/api/course-types').set(authHeaderFor(admin)).send({ name: '   ' });
    expectError(missingName, 400, /Course type name is required/);

    const duplicate = await request(app).post('/api/course-types').set(authHeaderFor(admin)).send({ name: 'Bootcamp' });
    expectError(duplicate, 400, /already exists/);

    const invalidDuplicate = await request(app).put('/api/course-types/not-an-id').set(authHeaderFor(admin)).send({ name: 'Bootcamp' });
    expectError(invalidDuplicate, 400, /already exists|Invalid _id/);

    const missing = await request(app).delete(`/api/course-types/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missing, 404, /Course type not found/);
  });

  it('rejects invalid generated slugs and update edge cases', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const existing = await createCourseType('Bootcamp');
    const target = await createCourseType('Workshop');

    const invalidSlug = await request(app).post('/api/course-types').set(authHeaderFor(admin)).send({ name: '!!!' });
    expectError(invalidSlug, 400, /valid characters/);

    const emptyUpdate = await request(app).put(`/api/course-types/${target._id}`).set(authHeaderFor(admin)).send({ name: '   ' });
    expectError(emptyUpdate, 400, /cannot be empty/);

    const duplicateUpdate = await request(app).put(`/api/course-types/${target._id}`).set(authHeaderFor(admin)).send({ name: existing.name });
    expectError(duplicateUpdate, 400, /already exists/);

    const descriptionOnly = await request(app).put(`/api/course-types/${target._id}`).set(authHeaderFor(admin)).send({ description: 'Only description' });
    expectSuccess(descriptionOnly);
    expect(descriptionOnly.body.data.description).toBe('Only description');

    const missingUpdate = await request(app).put(`/api/course-types/${makeObjectId()}`).set(authHeaderFor(admin)).send({ description: 'No record' });
    expectError(missingUpdate, 404, /Course type not found/);
  });
});
