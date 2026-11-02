'use client';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';

import { DetailItem } from '@/components/people/common/DetailItem';
import { formatDate } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import { StudentCourseList } from './StudentCourseList';
import { StudentDetailSection } from './StudentDetailSection';
import { StudentSubscriptionList } from './StudentSubscriptionList';

import type { StudentDetails } from '@/schemas/students.schema';
import type { FC } from 'react';

const NO_VALUE = '–';
const TWO_COLUMNS = { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } as const;

interface StudentDetailsContentProps {
  details: StudentDetails;
}

/** Contact details, money spent, every course bought and every subscription of one student. */
export const StudentDetailsContent: FC<StudentDetailsContentProps> = ({ details }) => {
  const { t, i18n } = useTranslation();
  const { student, totals } = details;
  const s = (key: string, options?: Record<string, unknown>): string =>
    t(`people.students.${key}`, options);
  return (
    <>
      <StudentDetailSection title={s('contact')}>
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: TWO_COLUMNS }}>
          <DetailItem
            label={s('email')}
            value={<Link href={`mailto:${student.email}`}>{student.email}</Link>}
          />
          <DetailItem
            label={s('phone')}
            value={
              student.phone ? (
                <Link href={`tel:${student.phone.replace(/[\s-]/g, '')}`}>{student.phone}</Link>
              ) : (
                NO_VALUE
              )
            }
          />
          <DetailItem label={s('studentNumber')} value={student.studentNumber ?? NO_VALUE} />
          <DetailItem label={s('joined')} value={formatDate(student.createdAt, i18n.language)} />
        </Box>
      </StudentDetailSection>
      <StudentDetailSection title={s('spending')}>
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: TWO_COLUMNS }}>
          <DetailItem label={s('totalSpent')} value={formatBdt(totals.totalSpent)} />
          <DetailItem
            label={s('courseCount')}
            value={s('courseCountValue', {
              count: totals.enrolledCourses,
              paid: totals.paidCourses,
            })}
          />
          <DetailItem label={s('courseSpent')} value={formatBdt(totals.courseSpent)} />
          <DetailItem label={s('subscriptionSpent')} value={formatBdt(totals.subscriptionSpent)} />
        </Box>
      </StudentDetailSection>
      <StudentDetailSection title={s('coursesTitle', { count: details.enrollments.length })}>
        <StudentCourseList enrollments={details.enrollments} />
      </StudentDetailSection>
      <StudentDetailSection
        title={s('subscriptionsTitle', { count: details.subscriptions.length })}
      >
        <StudentSubscriptionList subscriptions={details.subscriptions} />
      </StudentDetailSection>
    </>
  );
};
