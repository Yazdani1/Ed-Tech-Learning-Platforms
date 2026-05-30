import request from 'supertest';
import app from '../../../src/app';
import { Announcement } from '../../../src/models/Announcement.model';
import { StudyCurriculum } from '../../../src/models/StudyCurriculum.model';
import { StudyMaterial } from '../../../src/models/StudyMaterial.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createTeacherProfile, makeObjectId } from '../../helpers/data.helper';

const validLecture = { title: 'Intro', description: 'Welcome', day: 'Monday', time: '10:00 AM' };

describe('Announcements API', () => {
  it('creates, lists, updates, and deletes course announcements', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin);

    const create = await request(app).post(`/api/announcements/course/${course._id}`).set(authHeaderFor(admin)).send({
      title: 'Welcome',
      description: 'Class starts soon',
    });
    expectSuccess(create, 201);

    const list = await request(app).get(`/api/announcements/course/${course._id}`).set(authHeaderFor(admin));
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const update = await request(app).put(`/api/announcements/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      title: 'Updated',
      description: 'New details',
    });
    expectSuccess(update);
    expect(update.body.data.title).toBe('Updated');

    const remove = await request(app).delete(`/api/announcements/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('validates announcements and teacher assignment authorization', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const otherTeacher = await createTestUser({ role: 'Teacher', email: 'other.teacher@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin, { teachers: [teacher._id] });
    const announcement = await Announcement.create({ course: course._id, title: 'A', description: 'B', postedBy: admin._id });

    const missingTitle = await request(app).post(`/api/announcements/course/${course._id}`).set(authHeaderFor(admin)).send({ description: 'Body' });
    expectError(missingTitle, 400, /Title is required/);

    const missingCourse = await request(app).post(`/api/announcements/course/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'T', description: 'D' });
    expectError(missingCourse, 404, /Course not found/);

    const assignedTeacher = await request(app).post(`/api/announcements/course/${course._id}`).set(authHeaderFor(teacherUser)).send({ title: 'Teacher', description: 'Allowed' });
    expectSuccess(assignedTeacher, 201);

    const unlinkedTeacher = await request(app).post(`/api/announcements/course/${course._id}`).set(authHeaderFor(otherTeacher)).send({ title: 'Teacher', description: 'Blocked' });
    expectError(unlinkedTeacher, 403, /No teacher profile/);

    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const updateBlocked = await request(app).put(`/api/announcements/${announcement._id}`).set(authHeaderFor(student)).send({ title: 'X', description: 'Y' });
    expectError(updateBlocked, 403, /not authorized/i);

    const missing = await request(app).delete(`/api/announcements/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missing, 404, /Announcement not found/);
  });

  it('rejects announcement description gaps, unassigned teachers, and non-owner deletes', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin);
    const announcement = await Announcement.create({ course: course._id, title: 'A', description: 'B', postedBy: admin._id });

    const missingDescription = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'Only title' });
    expectError(missingDescription, 400, /Description is required/);

    const unassignedTeacher = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set(authHeaderFor(teacherUser))
      .send({ title: 'Teacher', description: 'Blocked' });
    expectError(unassignedTeacher, 403, /not assigned/i);

    const missingUpdate = await request(app)
      .put(`/api/announcements/${makeObjectId()}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D' });
    expectError(missingUpdate, 404, /Announcement not found/);

    const updateMissingTitle = await request(app)
      .put(`/api/announcements/${announcement._id}`)
      .set(authHeaderFor(admin))
      .send({ description: 'D' });
    expectError(updateMissingTitle, 400, /Title is required/);

    const updateMissingDescription = await request(app)
      .put(`/api/announcements/${announcement._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T' });
    expectError(updateMissingDescription, 400, /Description is required/);

    const deleteBlocked = await request(app).delete(`/api/announcements/${announcement._id}`).set(authHeaderFor(teacherUser));
    expectError(deleteBlocked, 403, /not authorized/i);
  });
});

describe('Study Curriculum API', () => {
  it('creates, lists, updates, and deletes live class curriculum entries', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin);

    const create = await request(app).post(`/api/study-curricula/course/${course._id}`).set(authHeaderFor(admin)).send({
      title: 'Week 1 Live Class',
      description: 'Basics',
      weekName: 'Week 1',
      lectures: [validLecture],
    });
    expectSuccess(create, 201);
    expect(create.body.data.lectures).toHaveLength(1);

    const list = await request(app).get(`/api/study-curricula/course/${course._id}`);
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const update = await request(app).put(`/api/study-curricula/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      title: 'Week 1 Updated',
      description: 'Advanced basics',
      weekName: 'Week 1',
      lectures: [{ ...validLecture, title: 'Updated lecture' }],
    });
    expectSuccess(update);
    expect(update.body.data.title).toBe('Week 1 Updated');

    const remove = await request(app).delete(`/api/study-curricula/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('validates curriculum payloads, lecture fields, ownership, and teacher assignment', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const stranger = await createTestUser({ role: 'Teacher', email: 'stranger@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin, { teachers: [teacher._id] });
    const curriculum = await StudyCurriculum.create({
      course: course._id,
      title: 'Owner item',
      description: 'Body',
      weekName: 'Week',
      lectures: [validLecture],
      postedBy: admin._id,
    });

    const missing = await request(app).post(`/api/study-curricula/course/${course._id}`).set(authHeaderFor(admin)).send({ description: 'D', weekName: 'W' });
    expectError(missing, 400, /Title is required/);

    const badLecture = await request(app).post(`/api/study-curricula/course/${course._id}`).set(authHeaderFor(admin)).send({
      title: 'T',
      description: 'D',
      weekName: 'W',
      lectures: [{ day: 'Monday', time: '10' }],
    });
    expectError(badLecture, 400, /Lecture title is required/);

    const assignedTeacher = await request(app).post(`/api/study-curricula/course/${course._id}`).set(authHeaderFor(teacherUser)).send({
      title: 'Teacher class',
      description: 'D',
      weekName: 'W',
      lectures: [validLecture],
    });
    expectSuccess(assignedTeacher, 201);

    const unlinked = await request(app).post(`/api/study-curricula/course/${course._id}`).set(authHeaderFor(stranger)).send({
      title: 'No profile',
      description: 'D',
      weekName: 'W',
      lectures: [validLecture],
    });
    expectError(unlinked, 403, /No teacher profile/);

    const blockedUpdate = await request(app).put(`/api/study-curricula/${curriculum._id}`).set(authHeaderFor(stranger)).send({
      title: 'X',
      description: 'Y',
      weekName: 'Z',
      lectures: [validLecture],
    });
    expectError(blockedUpdate, 403, /Not authorized/);

    const missingRecord = await request(app).delete(`/api/study-curricula/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingRecord, 404, /Live class not found/);
  });

  it('rejects missing curriculum fields, unassigned teachers, and non-owner deletes', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin);
    const curriculum = await StudyCurriculum.create({
      course: course._id,
      title: 'Owned',
      description: 'Body',
      weekName: 'Week',
      lectures: [validLecture],
      postedBy: admin._id,
    });

    const missingDescription = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', weekName: 'W' });
    expectError(missingDescription, 400, /Description is required/);

    const missingWeek = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D' });
    expectError(missingWeek, 400, /Week name is required/);

    const badLectureDay = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D', weekName: 'W', lectures: [{ title: 'L', time: '10' }] });
    expectError(badLectureDay, 400, /Lecture day is required/);

    const badLectureTime = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D', weekName: 'W', lectures: [{ title: 'L', day: 'Monday' }] });
    expectError(badLectureTime, 400, /Lecture time is required/);

    const missingCourse = await request(app)
      .post(`/api/study-curricula/course/${makeObjectId()}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D', weekName: 'W' });
    expectError(missingCourse, 404, /Course not found/);

    const unassignedTeacher = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set(authHeaderFor(teacherUser))
      .send({ title: 'T', description: 'D', weekName: 'W', lectures: [validLecture] });
    expectError(unassignedTeacher, 403, /not assigned/i);

    const updateMissing = await request(app)
      .put(`/api/study-curricula/${makeObjectId()}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D', weekName: 'W', lectures: [validLecture] });
    expectError(updateMissing, 404, /Live class not found/);

    const updateMissingDescription = await request(app)
      .put(`/api/study-curricula/${curriculum._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', weekName: 'W', lectures: [validLecture] });
    expectError(updateMissingDescription, 400, /Description is required/);

    const updateMissingWeek = await request(app)
      .put(`/api/study-curricula/${curriculum._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D', lectures: [validLecture] });
    expectError(updateMissingWeek, 400, /Week name is required/);

    const deleteBlocked = await request(app).delete(`/api/study-curricula/${curriculum._id}`).set(authHeaderFor(teacherUser));
    expectError(deleteBlocked, 403, /Not authorized/);
  });
});

describe('Study Materials API', () => {
  it('creates, lists, updates, and deletes study materials', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin);

    const create = await request(app).post(`/api/study-materials/course/${course._id}`).set(authHeaderFor(admin)).send({
      title: 'Slides',
      description: 'Lecture slides',
      fileUrl: 'https://example.com/slides.pdf',
    });
    expectSuccess(create, 201);

    const list = await request(app).get(`/api/study-materials/course/${course._id}`).set(authHeaderFor(admin));
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const update = await request(app).put(`/api/study-materials/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      title: 'Updated Slides',
      description: 'Updated file',
      fileUrl: '',
    });
    expectSuccess(update);
    expect(update.body.data.fileUrl).toBeUndefined();

    const remove = await request(app).delete(`/api/study-materials/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('validates study material payloads, course existence, ownership, and teacher assignment', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const stranger = await createTestUser({ role: 'Teacher', email: 'stranger@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin, { teachers: [teacher._id] });
    const material = await StudyMaterial.create({
      course: course._id,
      title: 'Owned',
      description: 'Body',
      postedBy: admin._id,
    });

    const missingTitle = await request(app).post(`/api/study-materials/course/${course._id}`).set(authHeaderFor(admin)).send({ description: 'D' });
    expectError(missingTitle, 400, /Title is required/);

    const missingCourse = await request(app).post(`/api/study-materials/course/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'T', description: 'D' });
    expectError(missingCourse, 404, /Course not found/);

    const assignedTeacher = await request(app).post(`/api/study-materials/course/${course._id}`).set(authHeaderFor(teacherUser)).send({ title: 'Teacher material', description: 'D' });
    expectSuccess(assignedTeacher, 201);

    const unlinked = await request(app).post(`/api/study-materials/course/${course._id}`).set(authHeaderFor(stranger)).send({ title: 'Bad', description: 'D' });
    expectError(unlinked, 403, /No teacher profile/);

    const blocked = await request(app).put(`/api/study-materials/${material._id}`).set(authHeaderFor(stranger)).send({ title: 'X', description: 'Y' });
    expectError(blocked, 403, /Not authorized/);

    const missing = await request(app).delete(`/api/study-materials/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missing, 404, /Study material not found/);
  });

  it('rejects study material description gaps, unassigned teachers, and non-owner deletes', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin);
    const material = await StudyMaterial.create({
      course: course._id,
      title: 'Owned',
      description: 'Body',
      postedBy: admin._id,
    });

    const missingDescription = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T' });
    expectError(missingDescription, 400, /Description is required/);

    const unassignedTeacher = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set(authHeaderFor(teacherUser))
      .send({ title: 'Teacher material', description: 'D' });
    expectError(unassignedTeacher, 403, /not assigned/i);

    const missingUpdate = await request(app)
      .put(`/api/study-materials/${makeObjectId()}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T', description: 'D' });
    expectError(missingUpdate, 404, /Study material not found/);

    const updateMissingTitle = await request(app)
      .put(`/api/study-materials/${material._id}`)
      .set(authHeaderFor(admin))
      .send({ description: 'D' });
    expectError(updateMissingTitle, 400, /Title is required/);

    const updateMissingDescription = await request(app)
      .put(`/api/study-materials/${material._id}`)
      .set(authHeaderFor(admin))
      .send({ title: 'T' });
    expectError(updateMissingDescription, 400, /Description is required/);

    const deleteBlocked = await request(app).delete(`/api/study-materials/${material._id}`).set(authHeaderFor(teacherUser));
    expectError(deleteBlocked, 403, /Not authorized/);
  });
});
