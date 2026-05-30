import request from 'supertest';
import app from '../../../src/app';
import { CommunityAnswerReply } from '../../../src/models/CommunityAnswerReply.model';
import { CommunityBadge } from '../../../src/models/CommunityBadge.model';
import { CommunityChannel } from '../../../src/models/CommunityChannel.model';
import { CommunityPost } from '../../../src/models/CommunityPost.model';
import { CommunityReply } from '../../../src/models/CommunityReply.model';
import { GroupChatChannel } from '../../../src/models/GroupChatChannel.model';
import { QuizBank } from '../../../src/models/QuizBank.model';
import { QuizSection } from '../../../src/models/QuizSection.model';
import { Teacher } from '../../../src/models/Teacher.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createTeacherProfile, makeObjectId } from '../../helpers/data.helper';

const quizOptions = [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }];

describe('Teacher edge coverage', () => {
  it('covers empty my-courses and update linked-user validation branches', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const secondTeacherUser = await createTestUser({ role: 'Teacher', email: 'teacher2@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const profile = await createTeacherProfile({ profileImagePublicId: 'old/teacher' });
    await createTeacherProfile({ userId: secondTeacherUser._id });

    const empty = await request(app).get('/api/teachers/my-courses').set(authHeaderFor(teacherUser));
    expectSuccess(empty);
    expect(empty.body.total).toBe(0);

    const missingUser = await request(app).put(`/api/teachers/${profile._id}`).set(authHeaderFor(admin)).send({ userId: makeObjectId() });
    expectError(missingUser, 404, /User not found/);

    const studentLink = await request(app).put(`/api/teachers/${profile._id}`).set(authHeaderFor(admin)).send({ userId: String(student._id) });
    expectError(studentLink, 400, /Teacher role/);

    const duplicateLink = await request(app).put(`/api/teachers/${profile._id}`).set(authHeaderFor(admin)).send({ userId: String(secondTeacherUser._id) });
    expectError(duplicateLink, 400, /already linked/);

    const linked = await request(app)
      .put(`/api/teachers/${profile._id}`)
      .set(authHeaderFor(admin))
      .field('userId', String(teacherUser._id))
      .field('socialLinks', JSON.stringify({ linkedin: 'https://example.com' }))
      .attach('profileImage', Buffer.from('image'), { filename: 'teacher.png', contentType: 'image/png' });
    expectSuccess(linked);
    expect(linked.body.data.userId).toBe(String(teacherUser._id));
  });
});

describe('Group chat edge coverage', () => {
  it('covers repeated joins, cancel join request, admin archived listing, unauthorized admin actions, and attachment last-message fallback', async () => {
    const creator = await createTestUser({ role: 'Student', email: 'creator@example.com' });
    const requester = await createTestUser({ role: 'Student', email: 'requester@example.com' });
    const outsider = await createTestUser({ role: 'Student', email: 'outsider@example.com' });
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const publicChannel = await GroupChatChannel.create({
      name: 'Public Edge',
      type: 'Public',
      creator: creator._id,
      members: [{ user: creator._id, role: 'Admin', unreadCount: 0, joinedAt: new Date() }],
    });
    const already = await request(app).post(`/api/group-chat/channels/${publicChannel._id}/join`).set(authHeaderFor(creator));
    expectSuccess(already);
    expect(already.body.message).toBe('Already a member');

    const filesOnly = await request(app)
      .post(`/api/group-chat/channels/${publicChannel._id}/messages`)
      .set(authHeaderFor(creator))
      .attach('files', Buffer.from('a'), { filename: 'a.txt', contentType: 'text/plain' })
      .attach('files', Buffer.from('b'), { filename: 'b.txt', contentType: 'text/plain' });
    expectSuccess(filesOnly, 201);
    const refreshed = await GroupChatChannel.findById(publicChannel._id);
    expect(refreshed?.lastMessage).toBe('2 files');

    const privateChannel = await GroupChatChannel.create({
      name: 'Private Edge',
      type: 'Private',
      creator: creator._id,
      members: [{ user: creator._id, role: 'Admin', unreadCount: 0, joinedAt: new Date() }],
    });
    await request(app).post(`/api/group-chat/channels/${privateChannel._id}/join`).set(authHeaderFor(requester));
    const cancel = await request(app).delete(`/api/group-chat/channels/${privateChannel._id}/join`).set(authHeaderFor(requester));
    expectSuccess(cancel);

    const cancelMissing = await request(app).delete(`/api/group-chat/channels/${privateChannel._id}/join`).set(authHeaderFor(requester));
    expectError(cancelMissing, 404, /Pending join request not found/);

    const approveMissing = await request(app).post(`/api/group-chat/channels/${privateChannel._id}/approve/${requester._id}`).set(authHeaderFor(creator));
    expectError(approveMissing, 404, /Join request not found/);

    const outsiderApprove = await request(app).post(`/api/group-chat/channels/${privateChannel._id}/approve/${requester._id}`).set(authHeaderFor(outsider));
    expectError(outsiderApprove, 403, /Only channel admins/);

    const removeCreator = await request(app).delete(`/api/group-chat/channels/${privateChannel._id}/members/${creator._id}`).set(authHeaderFor(creator));
    expectError(removeCreator, 400, /creator cannot be removed/);

    const blockedArchive = await request(app).patch(`/api/group-chat/channels/${privateChannel._id}/archive`).set(authHeaderFor(outsider));
    expectError(blockedArchive, 403, /Not authorized/);

    privateChannel.isArchived = true;
    await privateChannel.save();
    const archived = await request(app).get('/api/group-chat/channels?archived=true&search=Private').set(authHeaderFor(admin));
    expectSuccess(archived);
    expect(archived.body.data).toHaveLength(1);

    const emptySearch = await request(app).get('/api/group-chat/users/search').set(authHeaderFor(creator));
    expectSuccess(emptySearch);
    expect(emptySearch.body.data).toEqual([]);
  });
});

describe('Quiz edge coverage', () => {
  it('covers quiz section teacher authorization and quiz bank question/attempt/public locked branches', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin, { teachers: [teacher._id], status: 'Published', visibility: 'Public' });

    const teacherSection = await request(app).post('/api/quiz-sections').set(authHeaderFor(teacherUser)).send({
      course: String(course._id),
      title: 'Teacher Section',
    });
    expectSuccess(teacherSection, 201);

    const section = await QuizSection.create({ course: course._id, title: 'Locked Section', isFreePreview: false, createdBy: admin._id, order: 1 });
    const bank = await QuizBank.create({
      course: course._id,
      quizSection: section._id,
      title: 'Locked Bank',
      isFreePreview: false,
      createdBy: admin._id,
      questions: [{ question: 'Q', options: quizOptions, correctOptionIndices: [0], order: 0 }],
    });
    const questionId = bank.questions[0]._id;

    const badUpdateCorrect = await request(app).put(`/api/quiz-bank/${bank._id}/questions/${questionId}`).set(authHeaderFor(admin)).send({ correctOptionIndices: [] });
    expectError(badUpdateCorrect, 400, /correctOptionIndices/);

    const missingQuestion = await request(app).put(`/api/quiz-bank/${bank._id}/questions/${makeObjectId()}`).set(authHeaderFor(admin)).send({ question: 'Missing' });
    expectError(missingQuestion, 404, /Question not found/);

    const badSelected = await request(app).post(`/api/quiz-bank/${bank._id}/attempt/answer`).set(authHeaderFor(student)).send({ questionId, selectedOptionIndices: 'bad' });
    expectError(badSelected, 400, /selectedOptionIndices/);

    const missingAttemptQuestion = await request(app).post(`/api/quiz-bank/${bank._id}/attempt/answer`).set(authHeaderFor(student)).send({ questionId: makeObjectId(), selectedOptionIndices: [] });
    expectError(missingAttemptQuestion, 404, /Question not found/);

    const wrongAnswer = await request(app).post(`/api/quiz-bank/${bank._id}/attempt/answer`).set(authHeaderFor(student)).send({ questionId, selectedOptionIndices: [] });
    expectSuccess(wrongAnswer);
    expect(wrongAnswer.body.data.answers[0].isCorrect).toBe(false);

    const publicData = await request(app).get(`/api/quiz-bank/public/course/${course._id}`);
    expectSuccess(publicData);
    expect(publicData.body.data.lockedBankCount).toBe(1);
    expect(publicData.body.data.lockedQuestionCount).toBe(1);

    const missingDeleteQuestion = await request(app).delete(`/api/quiz-bank/${bank._id}/questions/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingDeleteQuestion, 404, /Question not found/);

    const missingSectionDelete = await request(app).delete(`/api/quiz-sections/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingSectionDelete, 404, /Quiz section not found/);
  });
});

describe('Community edge coverage', () => {
  it('covers community image replacement, reaction toggles, archived admin reads, missing nested records, and badge image update', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const author = await createTestUser({ role: 'Student', email: 'author@example.com' });
    const helper = await createTestUser({ role: 'Student', email: 'helper@example.com' });
    const channel = await CommunityChannel.create({ name: 'Edge', slug: 'edge', createdBy: admin._id, imagePublicId: 'old/channel' });
    const post = await CommunityPost.create({
      channel: channel._id,
      title: 'Edge post',
      description: 'Body',
      author: author._id,
      imagePublicId: 'old/post',
      images: [{ url: 'https://example.com/old.png', publicId: 'old/post-image' }],
    });
    const reply = await CommunityReply.create({ post: post._id, body: 'Reply', author: helper._id });
    const child = await CommunityAnswerReply.create({ reply: reply._id, body: 'Child', author: author._id });
    const badge = await CommunityBadge.create({ name: 'Edge Badge', requiredPoints: 0, createdBy: admin._id, imagePublicId: 'old/badge' });

    const updateSettingsAgain = await request(app)
      .put('/api/community/settings')
      .set(authHeaderFor(admin))
      .field('title', 'First')
      .attach('image', Buffer.from('image'), { filename: 'first.png', contentType: 'image/png' });
    expectSuccess(updateSettingsAgain);
    const updateSettingsReplace = await request(app)
      .put('/api/community/settings')
      .set(authHeaderFor(admin))
      .field('description', 'Second')
      .attach('image', Buffer.from('image'), { filename: 'second.png', contentType: 'image/png' });
    expectSuccess(updateSettingsReplace);

    const updateChannel = await request(app)
      .put(`/api/community/channels/${channel._id}`)
      .set(authHeaderFor(admin))
      .field('name', 'Edge Updated')
      .attach('image', Buffer.from('image'), { filename: 'channel.png', contentType: 'image/png' });
    expectSuccess(updateChannel);

    const updatePost = await request(app)
      .put(`/api/community/posts/${post._id}`)
      .set(authHeaderFor(author))
      .field('channel', String(channel._id))
      .field('title', 'Edge post updated')
      .field('description', 'Updated')
      .attach('images', Buffer.from('image'), { filename: 'post.png', contentType: 'image/png' });
    expectSuccess(updatePost);

    const react = await request(app).patch(`/api/community/posts/${post._id}/reactions`).set(authHeaderFor(helper)).send({ type: 'Like' });
    expectSuccess(react);
    const changeReact = await request(app).patch(`/api/community/posts/${post._id}/reactions`).set(authHeaderFor(helper)).send({ type: 'Love' });
    expectSuccess(changeReact);
    const removeReact = await request(app).patch(`/api/community/posts/${post._id}/reactions`).set(authHeaderFor(helper)).send({ type: 'Love' });
    expectSuccess(removeReact);

    const replyReact = await request(app).patch(`/api/community/replies/${reply._id}/reactions`).set(authHeaderFor(author)).send({ type: 'Like' });
    expectSuccess(replyReact);
    const replyReactChange = await request(app).patch(`/api/community/replies/${reply._id}/reactions`).set(authHeaderFor(author)).send({ type: 'Helpful' });
    expectSuccess(replyReactChange);
    const replyReactRemove = await request(app).patch(`/api/community/replies/${reply._id}/reactions`).set(authHeaderFor(author)).send({ type: 'Helpful' });
    expectSuccess(replyReactRemove);

    const accept = await request(app).patch(`/api/community/replies/${reply._id}/accepted`).set(authHeaderFor(author));
    expectSuccess(accept);
    const unaccept = await request(app).patch(`/api/community/replies/${reply._id}/accepted`).set(authHeaderFor(author));
    expectSuccess(unaccept);

    post.isArchived = true;
    await post.save();
    const archivedPost = await request(app).get(`/api/community/posts/${post._id}?archived=true`).set(authHeaderFor(admin));
    expectSuccess(archivedPost);

    const missingPostReply = await request(app).get(`/api/community/posts/${makeObjectId()}/replies`).set(authHeaderFor(author));
    expectError(missingPostReply, 404, /Discussion not found/);

    reply.isArchived = true;
    await reply.save();
    const missingAnswerReplies = await request(app).get(`/api/community/replies/${reply._id}/replies`).set(authHeaderFor(author));
    expectError(missingAnswerReplies, 404, /Answer not found/);

    const missingChildArchive = await request(app).patch(`/api/community/answer-replies/${makeObjectId()}/archive`).set(authHeaderFor(admin));
    expectError(missingChildArchive, 404, /Reply not found/);

    child.isArchived = true;
    await child.save();
    expect(child.isArchived).toBe(true);

    const updateBadge = await request(app)
      .put(`/api/community/badges/${badge._id}`)
      .set(authHeaderFor(admin))
      .field('name', 'Edge Badge Updated')
      .field('requiredPoints', '12')
      .attach('image', Buffer.from('image'), { filename: 'badge.png', contentType: 'image/png' });
    expectSuccess(updateBadge);

    const missingBadgeName = await request(app).post('/api/community/badges').set(authHeaderFor(admin)).send({});
    expectError(missingBadgeName, 400, /Badge name is required/);
  });
});
