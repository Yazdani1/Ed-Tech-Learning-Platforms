import { isSafeHttpUrl } from '@/utils/urls';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { TeacherForm } from '@/schemas/people.schema';
import type { AdminTeacher } from '@/schemas/public.schema';

/** Same limit as the backend's image upload (5 MB). */
export const TEACHER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const TEACHER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
/** Teacher accounts offered in the "link to account" list (the backend's page size limit). */
export const TEACHER_ACCOUNTS_LIMIT = 100;
export const BIO_PREVIEW_LENGTH = 130;
export const CARD_EXPERTISE_COUNT = 3;

/** Courses of each teacher id (one request for every card instead of one per teacher). */
export const groupCoursesByTeacher = (courses: AdminCourse[]): Map<string, AdminCourse[]> => {
  const map = new Map<string, AdminCourse[]>();
  courses.forEach((course) => {
    course.teachers.forEach((teacher) => {
      if (!teacher) return;
      map.set(teacher._id, [...(map.get(teacher._id) ?? []), course]);
    });
  });
  return map;
};

export const toTeacherForm = (teacher: AdminTeacher | undefined): TeacherForm => ({
  name: teacher?.name ?? '',
  bio: teacher?.bio ?? '',
  expertise: teacher?.expertise.join(', ') ?? '',
  socialLinks: teacher?.socialLinks ? JSON.stringify(teacher.socialLinks, null, 2) : '',
  userId: teacher?.userId ?? '',
});

/** Multipart body of POST/PUT /api/teachers (an empty userId unlinks on update). */
export const toTeacherFormData = (values: TeacherForm, image: File | null): FormData => {
  const body = new FormData();
  body.append('name', values.name.trim());
  body.append('bio', values.bio.trim());
  body.append('expertise', values.expertise);
  if (values.socialLinks.trim()) body.append('socialLinks', values.socialLinks.trim());
  body.append('userId', values.userId);
  if (image) body.append('profileImage', image);
  return body;
};

/** The teacher's social links that are real http(s) links. */
export const safeSocialLinks = (teacher: AdminTeacher): [string, string][] =>
  Object.entries(teacher.socialLinks ?? {}).filter((entry): entry is [string, string] =>
    isSafeHttpUrl(entry[1]),
  );

export const shortBio = (bio: string): string =>
  bio.length > BIO_PREVIEW_LENGTH ? `${bio.substring(0, BIO_PREVIEW_LENGTH)}...` : bio;
