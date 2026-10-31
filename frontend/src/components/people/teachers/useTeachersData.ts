'use client';

import { useMemo } from 'react';

import { useAdminCourses } from '@/api/admin-courses.api';
import { useUsers } from '@/api/people.api';
import { useTeachers } from '@/api/public.api';

import { TEACHER_ACCOUNTS_LIMIT, groupCoursesByTeacher } from './teacher-utils';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { ManagedUser } from '@/schemas/people.schema';
import type { AdminTeacher } from '@/schemas/public.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';

export interface TeachersData {
  teachers: UseQueryResult<AdminTeacher[], ApiError>;
  courses: UseQueryResult<AdminCourse[], ApiError>;
  /** The login account linked to a profile */
  findAccount: (userId: string | null | undefined) => ManagedUser | undefined;
  /** Courses of this teacher; undefined while the courses load */
  coursesOf: (teacherId: string) => AdminCourse[] | undefined;
  /** Accounts not linked to another profile (plus the one linked to `ownUserId`) */
  linkableUsers: (ownUserId: string | null | undefined) => ManagedUser[];
}

const TEACHER_ACCOUNTS_QUERY = { role: 'Teacher', limit: TEACHER_ACCOUNTS_LIMIT };
/** Every course (no filters): the same request and cache entry as the staff course list. */
const ALL_COURSES = {};

/** Teacher profiles, every course grouped by teacher, and the Teacher login accounts. */
export const useTeachersData = (): TeachersData => {
  const teachers = useTeachers();
  const courses = useAdminCourses(ALL_COURSES);
  const accounts = useUsers(TEACHER_ACCOUNTS_QUERY);

  const coursesByTeacher = useMemo(() => groupCoursesByTeacher(courses.data ?? []), [courses.data]);
  const accountList = useMemo(() => accounts.data?.data ?? [], [accounts.data]);

  const findAccount = (userId: string | null | undefined): ManagedUser | undefined =>
    userId ? accountList.find((user) => user._id === userId) : undefined;

  /** Courses of this teacher; undefined while the courses load. */
  const coursesOf = (teacherId: string): AdminCourse[] | undefined =>
    courses.isSuccess ? (coursesByTeacher.get(teacherId) ?? []) : undefined;

  /** Accounts not linked to another profile (plus the one linked to `ownUserId`). */
  const linkableUsers = (ownUserId: string | null | undefined): ManagedUser[] => {
    const taken = new Set((teachers.data ?? []).map((teacher) => teacher.userId).filter(Boolean));
    return accountList.filter((user) => !taken.has(user._id) || user._id === ownUserId);
  };

  return { teachers, courses, findAccount, coursesOf, linkableUsers };
};
