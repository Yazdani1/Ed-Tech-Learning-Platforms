'use client';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { Suspense, useEffect } from 'react';

import { useLiveClasses, usePublicQuizSections, useRecordCourseView } from '@/api/browse.api';
import { PromoPopup } from '@/components/promos/PromoPopup';
import { useModal } from '@/hooks/useModal';

import { countLectures, previewLectures } from '../course-utils';

import { CourseAboutCard } from './CourseAboutCard';
import { CourseDetailHero } from './CourseDetailHero';
import { CourseDetailWideSections } from './CourseDetailWideSections';
import { CoursePreviewModal } from './CoursePreviewModal';
import { CourseScheduleCards } from './CourseScheduleCards';
import { CourseBuyBar } from './enrollment/CourseBuyBar';
import { CourseEnrollmentCard } from './enrollment/CourseEnrollmentCard';

import type { Course, CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseDetailContentProps {
  course: Course;
}

const ENROLMENT_CARD_ID = 'course-enrollment-card';

/**
 * The loaded course page: hero; schedule and "About this course" on the left with the enrolment card on the
 * right (first on phones, overlapping the hero on wider screens); then every other section at full width;
 * the buy bar and the running promo's pop-up. Each open of a public course page counts as a view.
 */
export const CourseDetailContent: FC<CourseDetailContentProps> = ({ course }) => {
  const weeks = useLiveClasses(course._id).data ?? [];
  const quizSections = usePublicQuizSections(course._id).data ?? [];
  const preview = useModal<CourseLecture>();
  const lectureCount = countLectures(course);
  const isPublic = course.status === 'Published' && course.visibility === 'Public';

  const { mutate: recordView } = useRecordCourseView();

  useEffect(() => {
    if (isPublic) recordView(course._id);
  }, [course._id, isPublic, recordView]);

  return (
    <>
      <CourseDetailHero course={course} enrollTargetId={ENROLMENT_CARD_ID} />
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
            <CourseScheduleCards course={course} weeks={weeks} />
            <CourseAboutCard description={course.description} />
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            component="aside"
            id={ENROLMENT_CARD_ID}
            tabIndex={-1}
            sx={{
              order: { xs: 1, md: 2 },
              mt: { md: -20 },
              mb: { xs: 0, md: 4 },
              zIndex: 1,
              outline: 'none',
            }}
          >
            <CourseEnrollmentCard course={course} lectureCount={lectureCount} />
          </Grid>
        </Grid>
      </Container>
      <CourseDetailWideSections
        course={course}
        weeks={weeks}
        quizSections={quizSections}
        onPreview={preview.openModal}
      />
      <CourseBuyBar course={course} targetId={ENROLMENT_CARD_ID} />
      <Suspense fallback={null}>
        <PromoPopup />
      </Suspense>
      <CoursePreviewModal
        open={preview.open}
        lecture={preview.data}
        lectures={previewLectures(course)}
        courseTitle={course.title}
        onSelect={preview.openModal}
        onClose={preview.closeModal}
      />
    </>
  );
};
