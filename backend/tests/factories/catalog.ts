// Extra factories for the catalog tests (categories, course types, teachers, courses, curriculum).
import { Lecture } from '../../src/models/Lecture.model';
import { Section } from '../../src/models/Section.model';
import { nextId } from './index';

import type { ICourse } from '../../src/models/Course.model';
import type { ISection } from '../../src/models/Section.model';
import type { UserRole } from '../../src/types/index';

/** Roles the routes allow (Super Admin, Admin). */
export const ADMIN_ROLES: readonly UserRole[] = ['Super Admin', 'Admin'];
/** Roles the admin-only routes must refuse with 403. */
export const NON_ADMIN_ROLES: readonly UserRole[] = ['Moderator', 'Teacher', 'Student'];

/** A section saved and linked into the course's `sections` array. */
export const createSection = async (
  course: ICourse,
  overrides: Record<string, unknown> = {},
): Promise<ISection> => {
  const n = nextId();
  const section = await Section.create({
    course: course._id,
    title: `Section ${n}`,
    order: course.sections.length,
    ...overrides,
  });
  course.sections.push(section._id);
  await course.save();
  return section;
};

/** A lecture saved and linked into the section's `lectures` array. */
export const createLecture = async (section: ISection, overrides: Record<string, unknown> = {}) => {
  const n = nextId();
  const lecture = await Lecture.create({
    section: section._id,
    title: `Lecture ${n}`,
    order: section.lectures.length,
    videoUrl: `https://videos.example.com/${n}`,
    ...overrides,
  });
  section.lectures.push(lecture._id);
  await section.save();
  return lecture;
};
