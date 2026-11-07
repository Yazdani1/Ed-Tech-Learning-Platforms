import { formatDate, formatDateTime } from '@/utils/dateTime';
import { formatDuration } from '@/utils/duration';
import { datedFileName, downloadCsv, toCsv } from '@/utils/export-file';

import type { StudentRow } from '@/schemas/students.schema';
import type { TFunction } from 'i18next';

/** The students CSV (Super Admin): contact details, courses, money spent, time on the portal and status. */
export const exportStudentsCsv = (
  t: TFunction,
  students: readonly StudentRow[],
  language: string,
  includeContact: boolean,
): void => {
  const c = (key: string): string => t(`people.students.csv.${key}`);
  const headers = [
    c('name'),
    c('studentNumber'),
    ...(includeContact ? [c('email'), c('phone')] : []),
    c('courses'),
    c('spent'),
    c('timeSpent'),
    c('status'),
    c('joined'),
    c('lastActive'),
  ];
  const rows = students.map((student) => [
    student.name,
    student.studentNumber,
    ...(includeContact ? [student.email, student.phone] : []),
    student.enrolledCourses,
    student.totalSpent,
    formatDuration(t, student.timeSpentSeconds),
    t(student.isBlocked ? 'people.accountStatus.blocked' : 'people.accountStatus.active'),
    formatDate(student.createdAt, language),
    student.lastActiveAt ? formatDateTime(student.lastActiveAt, language) : '',
  ]);
  downloadCsv(toCsv(headers, rows), datedFileName('students', 'csv'));
};
