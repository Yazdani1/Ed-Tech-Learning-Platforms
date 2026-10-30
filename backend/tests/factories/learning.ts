// Extra factories for the learning modules (enrollments, announcements, study curricula, study materials, Q&A).
import { Answer } from '../../src/models/Answer.model';
import { Announcement } from '../../src/models/Announcement.model';
import { Question } from '../../src/models/Question.model';
import { StudyCurriculum } from '../../src/models/StudyCurriculum.model';
import { StudyMaterial } from '../../src/models/StudyMaterial.model';
import { createCourse, createTeacherProfile, createUser, nextId } from './index';

import type { Types } from 'mongoose';
import type { ICourse } from '../../src/models/Course.model';
import type { ITeacher } from '../../src/models/Teacher.model';
import type { IUser } from '../../src/models/User.model';

export interface TeacherWithCourse {
  user: IUser;
  profile: ITeacher;
  course: ICourse;
}

/** A Teacher user + profile and a published course this teacher is assigned to. */
export const createTeacherWithCourse = async (): Promise<TeacherWithCourse> => {
  const user = await createUser('Teacher');
  const profile = await createTeacherProfile(user);
  const course = await createCourse({ teachers: [profile._id] });
  return { user, profile, course };
};

export const createAnnouncement = async (course: ICourse, postedBy: IUser) =>
  Announcement.create({
    course: course._id,
    title: `Announcement ${nextId()}`,
    description: 'Class moved',
    postedBy: postedBy._id,
  });

export const createMaterial = async (course: ICourse, postedBy: IUser) =>
  StudyMaterial.create({
    course: course._id,
    title: `Material ${nextId()}`,
    description: 'Read chapter 1',
    fileUrl: 'https://example.com/file.pdf',
    postedBy: postedBy._id,
  });

export const createCurriculum = async (course: ICourse, postedBy: IUser) =>
  StudyCurriculum.create({
    course: course._id,
    title: `Live class ${nextId()}`,
    description: 'Weekly live class',
    weekName: 'Week 1',
    lectures: [{ title: 'Intro', description: 'Hello', day: 'Monday', time: '10:00' }],
    postedBy: postedBy._id,
  });

export const createQuestionDoc = async (course: ICourse, postedBy: IUser) =>
  Question.create({
    course: course._id,
    title: `Question ${nextId()}`,
    description: 'How does this work?',
    postedBy: postedBy._id,
  });

export const createAnswerDoc = async (questionId: unknown, postedBy: IUser, body = 'Like this') =>
  Answer.create({ question: questionId as Types.ObjectId, body, postedBy: postedBy._id });
