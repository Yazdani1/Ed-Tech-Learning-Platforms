import request from 'supertest';
import app from '../../../src/app';
import { CommunityAnswerReply } from '../../../src/models/CommunityAnswerReply.model';
import { CommunityBadge } from '../../../src/models/CommunityBadge.model';
import { CommunityChannel } from '../../../src/models/CommunityChannel.model';
import { CommunityPost } from '../../../src/models/CommunityPost.model';
import { CommunityReply } from '../../../src/models/CommunityReply.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Community API', () => {
  it('manages settings, channels, badges, and point rules as admin', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const settings = await request(app)
      .put('/api/community/settings')
      .set(authHeaderFor(admin))
      .field('title', 'Learning Hub')
      .field('description', 'Discuss and help')
      .attach('image', Buffer.from('image'), { filename: 'header.png', contentType: 'image/png' });
    expectSuccess(settings);
    expect(settings.body.data.title).toBe('Learning Hub');

    const settingsRead = await request(app).get('/api/community/settings').set(authHeaderFor(admin));
    expectSuccess(settingsRead);

    const channel = await request(app)
      .post('/api/community/channels')
      .set(authHeaderFor(admin))
      .field('name', 'General Help')
      .field('description', 'General questions')
      .attach('image', Buffer.from('image'), { filename: 'channel.png', contentType: 'image/png' });
    expectSuccess(channel, 201);

    const adminChannels = await request(app).get('/api/community/admin/channels').set(authHeaderFor(admin));
    expectSuccess(adminChannels);
    expect(adminChannels.body.data).toHaveLength(1);

    const updateChannel = await request(app).put(`/api/community/channels/${channel.body.data._id}`).set(authHeaderFor(admin)).send({
      name: 'Updated Help',
      description: 'Updated',
    });
    expectSuccess(updateChannel);

    const badge = await request(app)
      .post('/api/community/badges')
      .set(authHeaderFor(admin))
      .field('name', 'Helper')
      .field('requiredPoints', '5')
      .attach('image', Buffer.from('image'), { filename: 'badge.png', contentType: 'image/png' });
    expectSuccess(badge, 201);

    const badges = await request(app).get('/api/community/badges').set(authHeaderFor(admin));
    expectSuccess(badges);
    expect(badges.body.data).toHaveLength(1);

    const updateBadge = await request(app).put(`/api/community/badges/${badge.body.data._id}`).set(authHeaderFor(admin)).send({ name: 'Super Helper', requiredPoints: 10 });
    expectSuccess(updateBadge);

    const rules = await request(app).get('/api/community/point-rules').set(authHeaderFor(admin));
    expectSuccess(rules);
    expect(rules.body.data.length).toBeGreaterThan(0);

    const updateRules = await request(app).put('/api/community/point-rules').set(authHeaderFor(admin)).send({
      rules: [{ key: 'createPost', points: 2 }],
    });
    expectSuccess(updateRules);

    const archiveBadge = await request(app).patch(`/api/community/badges/${badge.body.data._id}/archive`).set(authHeaderFor(admin));
    expectSuccess(archiveBadge);

    const archiveChannel = await request(app).patch(`/api/community/channels/${channel.body.data._id}/archive`).set(authHeaderFor(admin));
    expectSuccess(archiveChannel);
  });

  it('creates community discussions, replies, child replies, reactions, accepted answers, pins, and archives', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const author = await createTestUser({ role: 'Student', email: 'author@example.com' });
    const helper = await createTestUser({ role: 'Student', email: 'helper@example.com' });
    const channel = await CommunityChannel.create({ name: 'General', slug: 'general', createdBy: admin._id });

    const post = await request(app)
      .post('/api/community/posts')
      .set(authHeaderFor(author))
      .field('channel', String(channel._id))
      .field('title', 'How do tests work?')
      .field('description', 'Explain API tests')
      .attach('images', Buffer.from('image'), { filename: 'post.png', contentType: 'image/png' });
    expectSuccess(post, 201);

    const overview = await request(app).get('/api/community?search=tests&limit=20').set(authHeaderFor(author));
    expectSuccess(overview);
    expect(overview.body.data.posts).toHaveLength(1);

    const getPost = await request(app).get(`/api/community/posts/${post.body.data._id}`).set(authHeaderFor(author));
    expectSuccess(getPost);

    const updatePost = await request(app).put(`/api/community/posts/${post.body.data._id}`).set(authHeaderFor(author)).send({
      title: 'Updated discussion',
      description: 'Updated body',
    });
    expectSuccess(updatePost);

    const reactPost = await request(app).patch(`/api/community/posts/${post.body.data._id}/reactions`).set(authHeaderFor(helper)).send({ type: 'Helpful' });
    expectSuccess(reactPost);

    const reply = await request(app)
      .post(`/api/community/posts/${post.body.data._id}/replies`)
      .set(authHeaderFor(helper))
      .field('body', 'Use Jest and Supertest')
      .attach('images', Buffer.from('image'), { filename: 'reply.png', contentType: 'image/png' });
    expectSuccess(reply, 201);

    const replies = await request(app).get(`/api/community/posts/${post.body.data._id}/replies?skip=0&limit=5`).set(authHeaderFor(author));
    expectSuccess(replies);
    expect(replies.body.data.total).toBe(1);

    const child = await request(app).post(`/api/community/replies/${reply.body.data._id}/replies`).set(authHeaderFor(author)).send({ body: 'Thanks' });
    expectSuccess(child, 201);

    const childReplies = await request(app).get(`/api/community/replies/${reply.body.data._id}/replies`).set(authHeaderFor(author));
    expectSuccess(childReplies);
    expect(childReplies.body.data.total).toBe(1);

    const reactReply = await request(app).patch(`/api/community/replies/${reply.body.data._id}/reactions`).set(authHeaderFor(author)).send({ type: 'Like' });
    expectSuccess(reactReply);

    const accept = await request(app).patch(`/api/community/replies/${reply.body.data._id}/accepted`).set(authHeaderFor(author));
    expectSuccess(accept);
    expect(accept.body.data.isAccepted).toBe(true);

    const pin = await request(app).patch(`/api/community/posts/${post.body.data._id}/pin`).set(authHeaderFor(admin));
    expectSuccess(pin);
    expect(pin.body.data.isPinned).toBe(true);

    const archiveChild = await request(app).patch(`/api/community/answer-replies/${child.body.data._id}/archive`).set(authHeaderFor(author));
    expectSuccess(archiveChild);

    const archiveReply = await request(app).patch(`/api/community/replies/${reply.body.data._id}/archive`).set(authHeaderFor(helper));
    expectSuccess(archiveReply);

    const archivePost = await request(app).patch(`/api/community/posts/${post.body.data._id}/archive`).set(authHeaderFor(author));
    expectSuccess(archivePost);
  });

  it('returns community user profiles and respects private profiles', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const privateUser = await createTestUser({ role: 'Student', email: 'private@example.com' });
    privateUser.isCommunityProfilePrivate = true;
    await privateUser.save();

    const guestPrivate = await request(app).get(`/api/community/users/${privateUser._id}`);
    expectSuccess(guestPrivate);
    expect(guestPrivate.body.data.isPrivate).toBe(true);

    const adminView = await request(app).get(`/api/community/users/${privateUser._id}`).set(authHeaderFor(admin));
    expectSuccess(adminView);
    expect(adminView.body.data.isPrivate).toBe(false);
  });

  it('validates community payloads, permissions, and missing records', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const other = await createTestUser({ role: 'Student', email: 'other@example.com' });
    const channel = await CommunityChannel.create({ name: 'General', slug: 'general', createdBy: admin._id });
    const post = await CommunityPost.create({ channel: channel._id, title: 'Post', description: 'Body', author: student._id });
    const reply = await CommunityReply.create({ post: post._id, body: 'Reply', author: student._id });
    const childReply = await CommunityAnswerReply.create({ reply: reply._id, body: 'Child', author: student._id });
    const badge = await CommunityBadge.create({ name: 'Badge', requiredPoints: 0, createdBy: admin._id });

    const badOverview = await request(app).get('/api/community?dateFrom=bad-date').set(authHeaderFor(student));
    expectError(badOverview, 400, /Invalid start date/);

    const archivedAsGuest = await request(app).get('/api/community?archived=true');
    expectError(archivedAsGuest, 403, /Only admins/);

    const missingChannelName = await request(app).post('/api/community/channels').set(authHeaderFor(admin)).send({});
    expectError(missingChannelName, 400, /Channel name is required/);

    const duplicateChannel = await request(app).post('/api/community/channels').set(authHeaderFor(admin)).send({ name: 'General' });
    expectError(duplicateChannel, 400, /Channel already exists/);

    const missingPostFields = await request(app).post('/api/community/posts').set(authHeaderFor(student)).send({ channel: String(channel._id) });
    expectError(missingPostFields, 400, /Channel, title, and description/);

    const invalidReaction = await request(app).patch(`/api/community/posts/${post._id}/reactions`).set(authHeaderFor(other)).send({ type: 'Bad' });
    expectError(invalidReaction, 400, /Invalid reaction type/);

    const blockedEdit = await request(app).put(`/api/community/posts/${post._id}`).set(authHeaderFor(other)).send({ title: 'Nope' });
    expectError(blockedEdit, 403, /own discussions/);

    const missingReplyBody = await request(app).post(`/api/community/posts/${post._id}/replies`).set(authHeaderFor(other)).send({});
    expectError(missingReplyBody, 400, /Reply body is required/);

    const blockedAccept = await request(app).patch(`/api/community/replies/${reply._id}/accepted`).set(authHeaderFor(other));
    expectError(blockedAccept, 403, /Only the discussion creator/);

    const blockedArchiveChild = await request(app).patch(`/api/community/answer-replies/${childReply._id}/archive`).set(authHeaderFor(other));
    expectError(blockedArchiveChild, 403, /own replies/);

    const noRules = await request(app).put('/api/community/point-rules').set(authHeaderFor(admin)).send({ rules: [] });
    expectError(noRules, 400, /Point rules are required/);

    const missingBadge = await request(app).put(`/api/community/badges/${makeObjectId()}`).set(authHeaderFor(admin)).send({ name: 'X' });
    expectError(missingBadge, 404, /Badge not found/);

    const archiveBadge = await request(app).patch(`/api/community/badges/${badge._id}/archive`).set(authHeaderFor(admin));
    expectSuccess(archiveBadge);

    const missingUser = await request(app).get(`/api/community/users/${makeObjectId()}`);
    expectError(missingUser, 404, /User not found/);
  });
});
