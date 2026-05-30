import request from 'supertest';
import app from '../../../src/app';
import { Lecture } from '../../../src/models/Lecture.model';
import { Section } from '../../../src/models/Section.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, makeObjectId } from '../../helpers/data.helper';

describe('Course Curriculum API', () => {
  it('creates, updates, reorders, and deletes sections and lectures', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin);

    const section = await request(app).post(`/api/courses/${course._id}/sections`).set(authHeaderFor(admin)).send({ title: 'Section 1' });
    expectSuccess(section, 201);

    const updateSection = await request(app).put(`/api/courses/${course._id}/sections/${section.body.data._id}`).set(authHeaderFor(admin)).send({ title: 'Updated Section' });
    expectSuccess(updateSection);
    expect(updateSection.body.data.title).toBe('Updated Section');

    const reorderSections = await request(app).put(`/api/courses/${course._id}/sections/reorder`).set(authHeaderFor(admin)).send({ orderedIds: [section.body.data._id] });
    expectSuccess(reorderSections);

    const lecture = await request(app).post(`/api/courses/${course._id}/sections/${section.body.data._id}/lectures`).set(authHeaderFor(admin)).send({
      title: 'Lecture 1',
      description: 'Intro',
      videoUrl: 'https://example.com/video',
      isPreview: true,
      duration: 300,
    });
    expectSuccess(lecture, 201);

    const updateLecture = await request(app).put(`/api/courses/${course._id}/sections/${section.body.data._id}/lectures/${lecture.body.data._id}`).set(authHeaderFor(admin)).send({
      title: 'Updated Lecture',
      isPreview: false,
      duration: 600,
    });
    expectSuccess(updateLecture);
    expect(updateLecture.body.data).toMatchObject({ title: 'Updated Lecture', isPreview: false, duration: 600 });

    const reorderLectures = await request(app).put(`/api/courses/${course._id}/sections/${section.body.data._id}/lectures/reorder`).set(authHeaderFor(admin)).send({
      orderedIds: [lecture.body.data._id],
    });
    expectSuccess(reorderLectures);

    const deleteLecture = await request(app).delete(`/api/courses/${course._id}/sections/${section.body.data._id}/lectures/${lecture.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(deleteLecture);
    expect(await Lecture.findById(lecture.body.data._id)).toBeNull();

    const deleteSection = await request(app).delete(`/api/courses/${course._id}/sections/${section.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(deleteSection);
    expect(await Section.findById(section.body.data._id)).toBeNull();
  });

  it('validates curriculum route payloads, ids, and role authorization', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin);
    const section = await Section.create({ course: course._id, title: 'S', order: 0 });

    const unauthorized = await request(app).post(`/api/courses/${course._id}/sections`).set(authHeaderFor(student)).send({ title: 'Nope' });
    expectError(unauthorized, 403, /not authorized/);

    const missingCourse = await request(app).post(`/api/courses/${makeObjectId()}/sections`).set(authHeaderFor(admin)).send({ title: 'S' });
    expectError(missingCourse, 404, /Course not found/);

    const missingTitle = await request(app).post(`/api/courses/${course._id}/sections`).set(authHeaderFor(admin)).send({});
    expectError(missingTitle, 400, /Section title is required/);

    const missingSection = await request(app).put(`/api/courses/${course._id}/sections/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'X' });
    expectError(missingSection, 404, /Section not found/);

    const badReorderSections = await request(app).put(`/api/courses/${course._id}/sections/reorder`).set(authHeaderFor(admin)).send({ orderedIds: 'bad' });
    expectError(badReorderSections, 400, /orderedIds array is required/);

    const missingLectureTitle = await request(app).post(`/api/courses/${course._id}/sections/${section._id}/lectures`).set(authHeaderFor(admin)).send({});
    expectError(missingLectureTitle, 400, /Lecture title is required/);

    const missingLecture = await request(app).put(`/api/courses/${course._id}/sections/${section._id}/lectures/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'X' });
    expectError(missingLecture, 404, /Lecture not found/);

    const badReorderLectures = await request(app).put(`/api/courses/${course._id}/sections/${section._id}/lectures/reorder`).set(authHeaderFor(admin)).send({ orderedIds: 'bad' });
    expectError(badReorderLectures, 400, /orderedIds array is required/);
  });
});
