import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { HomeHeroPost } from '../../src/models/HomeHeroPost.model';
import { SiteLogo } from '../../src/models/SiteLogo.model';
import { createUser } from '../factories';
import { createHeroPost, daysAgo, daysFromNow } from '../factories/admin-messaging';

import type { IUser } from '../../src/models/User.model';

const PUBLIC_URL = '/api/home-hero-posts/public';
const LOGO_URL = '/api/home-hero-posts/logo/public';

let admin: IUser;

beforeAll(async () => {
  admin = await createUser('Admin');
});

const publicIds = async () => {
  const res = await request(app).get(PUBLIC_URL);
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  return (res.body.data as Array<{ _id: string }>).map((post) => post._id);
};

describe('GET /api/home-hero-posts/public', () => {
  beforeEach(async () => {
    await HomeHeroPost.deleteMany({});
  });

  it('needs no sign-in and is empty when there are no posts', async () => {
    const res = await request(app).get(PUBLIC_URL);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });

  it('shows Public posts only and hides Private ones', async () => {
    const pub = await createHeroPost(admin, { visibility: 'Public' });
    const priv = await createHeroPost(admin, { visibility: 'Private' });
    const ids = await publicIds();
    expect(ids).toContain(String(pub._id));
    expect(ids).not.toContain(String(priv._id));
  });

  it('returns only the public fields (no storage id, no creator)', async () => {
    await createHeroPost(admin, {
      visibility: 'Public',
      imageWidth: 800,
      imageHeight: 400,
      order: 3,
    });
    const res = await request(app).get(PUBLIC_URL);
    expect(Object.keys(res.body.data[0]).sort()).toEqual(
      ['_id', 'imageHeight', 'imageUrl', 'imageWidth', 'order'].sort(),
    );
  });

  it('sorts by order, then newest first', async () => {
    const second = await createHeroPost(admin, { order: 2 });
    const firstOld = await createHeroPost(admin, { order: 1, createdAt: daysAgo(2) });
    const firstNew = await createHeroPost(admin, { order: 1, createdAt: daysAgo(1) });
    expect(await publicIds()).toEqual([
      String(firstNew._id),
      String(firstOld._id),
      String(second._id),
    ]);
  });

  it('a Private post scheduled to go Public in the future stays hidden', async () => {
    const post = await createHeroPost(admin, {
      visibility: 'Private',
      scheduledVisibility: 'Public',
      publishAt: daysFromNow(1),
    });
    expect(await publicIds()).not.toContain(String(post._id));
  });

  it('a Public post scheduled to go Private in the future stays visible until then', async () => {
    const post = await createHeroPost(admin, {
      visibility: 'Public',
      scheduledVisibility: 'Private',
      publishAt: daysFromNow(1),
    });
    expect(await publicIds()).toContain(String(post._id));
  });

  it('a due schedule is applied: Private to Public becomes visible and the schedule is cleared', async () => {
    const post = await createHeroPost(admin, {
      visibility: 'Private',
      scheduledVisibility: 'Public',
      publishAt: daysAgo(1),
    });
    expect(await publicIds()).toContain(String(post._id));
    const saved = await HomeHeroPost.findById(post._id);
    expect(saved?.visibility).toBe('Public');
    expect(saved?.scheduledVisibility).toBeUndefined();
    expect(saved?.publishAt).toBeUndefined();
  });

  it('a due schedule is applied: Public to Private becomes hidden', async () => {
    const post = await createHeroPost(admin, {
      visibility: 'Public',
      scheduledVisibility: 'Private',
      publishAt: daysAgo(1),
    });
    expect(await publicIds()).not.toContain(String(post._id));
    expect((await HomeHeroPost.findById(post._id))?.visibility).toBe('Private');
  });
});

describe('GET /api/home-hero-posts/logo/public', () => {
  beforeEach(async () => {
    await SiteLogo.deleteMany({});
  });

  it('answers data null when no logo was uploaded (no sign-in needed)', async () => {
    const res = await request(app).get(LOGO_URL);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
  });

  it('returns the newest logo with the public fields only', async () => {
    await SiteLogo.create({
      imageUrl: 'https://res.cloudinary.com/test-cloud/old.png',
      imagePublicId: 'logo/old',
      updatedBy: admin._id,
      updatedAt: daysAgo(3),
    });
    await SiteLogo.create({
      imageUrl: 'https://res.cloudinary.com/test-cloud/new.png',
      imagePublicId: 'logo/new',
      imageWidth: 120,
      imageHeight: 40,
      updatedBy: admin._id,
    });
    const res = await request(app).get(LOGO_URL);
    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toBe('https://res.cloudinary.com/test-cloud/new.png');
    expect(Object.keys(res.body.data).sort()).toEqual(
      ['_id', 'imageHeight', 'imageUrl', 'imageWidth', 'updatedAt'].sort(),
    );
  });
});
