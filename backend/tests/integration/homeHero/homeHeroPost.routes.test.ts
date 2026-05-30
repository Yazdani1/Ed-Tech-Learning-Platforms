import request from 'supertest';
import app from '../../../src/app';
import { HomeHeroPost } from '../../../src/models/HomeHeroPost.model';
import { SiteLogo } from '../../../src/models/SiteLogo.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Home Hero Posts and Site Logo API', () => {
  it('uploads, reads, updates, reorders, and deletes site hero posts', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const create = await request(app)
      .post('/api/home-hero-posts')
      .set(authHeaderFor(admin))
      .field('visibility', 'Public')
      .attach('images', Buffer.from('image'), { filename: 'hero.png', contentType: 'image/png' });
    expectSuccess(create, 201);
    expect(create.body.data).toHaveLength(1);

    const adminList = await request(app).get('/api/home-hero-posts').set(authHeaderFor(admin));
    expectSuccess(adminList);
    expect(adminList.body.data).toHaveLength(1);

    const publicList = await request(app).get('/api/home-hero-posts/public');
    expectSuccess(publicList);
    expect(publicList.body.data).toHaveLength(1);

    const update = await request(app)
      .put(`/api/home-hero-posts/${create.body.data[0]._id}`)
      .set(authHeaderFor(admin))
      .field('visibility', 'Private')
      .field('order', '7')
      .attach('image', Buffer.from('image2'), { filename: 'hero2.png', contentType: 'image/png' });
    expectSuccess(update);
    expect(update.body.data).toMatchObject({ visibility: 'Private', order: 7 });

    const reorder = await request(app).patch('/api/home-hero-posts/reorder').set(authHeaderFor(admin)).send({ orderedIds: [create.body.data[0]._id] });
    expectSuccess(reorder);

    const remove = await request(app).delete(`/api/home-hero-posts/${create.body.data[0]._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
    expect(await HomeHeroPost.findById(create.body.data[0]._id)).toBeNull();
  });

  it('handles scheduled visibility and validation errors for hero posts', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const post = await HomeHeroPost.create({
      imageUrl: 'https://example.com/hero.jpg',
      imagePublicId: 'hero/1',
      visibility: 'Private',
      scheduledVisibility: 'Public',
      publishAt: new Date('2020-01-01T00:00:00.000Z'),
      order: 0,
      createdBy: admin._id,
    });

    const publicList = await request(app).get('/api/home-hero-posts/public');
    expectSuccess(publicList);
    expect(publicList.body.data).toHaveLength(1);

    const missingImage = await request(app).post('/api/home-hero-posts').set(authHeaderFor(admin)).send({ visibility: 'Public' });
    expectError(missingImage, 400, /At least one image is required/);

    const invalidDate = await request(app)
      .put(`/api/home-hero-posts/${post._id}`)
      .set(authHeaderFor(admin))
      .send({ publishAt: 'not-a-date' });
    expectError(invalidDate, 400, /Invalid publish date/);

    const missingReorder = await request(app).patch('/api/home-hero-posts/reorder').set(authHeaderFor(admin)).send({ orderedIds: [] });
    expectError(missingReorder, 400, /orderedIds is required/);

    const missingPost = await request(app).delete(`/api/home-hero-posts/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingPost, 404, /Hero post not found/);
  });

  it('uploads, updates, and reads site logo', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const emptyPublic = await request(app).get('/api/home-hero-posts/logo/public');
    expectSuccess(emptyPublic);
    expect(emptyPublic.body.data).toBeNull();

    const missing = await request(app).put('/api/home-hero-posts/logo').set(authHeaderFor(admin)).send({});
    expectError(missing, 400, /Logo image is required/);

    const create = await request(app)
      .put('/api/home-hero-posts/logo')
      .set(authHeaderFor(admin))
      .attach('logo', Buffer.from('logo'), { filename: 'logo.png', contentType: 'image/png' });
    expectSuccess(create, 201);

    const update = await request(app)
      .put('/api/home-hero-posts/logo')
      .set(authHeaderFor(admin))
      .attach('logo', Buffer.from('logo2'), { filename: 'logo2.png', contentType: 'image/png' });
    expectSuccess(update);
    expect(await SiteLogo.countDocuments()).toBe(1);

    const adminLogo = await request(app).get('/api/home-hero-posts/logo').set(authHeaderFor(admin));
    expectSuccess(adminLogo);
    expect(adminLogo.body.data.imageUrl).toContain('cloudinary.com');
  });
});
