'use client';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';

import { useLiveClasses, usePublicQuizSections } from '@/api/browse.api';
import { useModal } from '@/hooks/useModal';

import { countLectures, previewLectures } from '../course-utils';

import { CourseDetailHero } from './CourseDetailHero';
import { CourseDetailWideSections } from './CourseDetailWideSections';
import { CourseIncludesList } from './CourseIncludesList';
import { CourseLearnList } from './CourseLearnList';
import { CoursePreviewModal } from './CoursePreviewModal';
import { CourseTypeScheduleCard } from './CourseTypeScheduleCard';
import { BUY_BAR_SPACE, CourseBuyBar } from './enrollment/CourseBuyBar';
import { CourseEnrollmentCard } from './enrollment/CourseEnrollmentCard';
import { CourseBenefitsSection } from './extras/CourseBenefitsSection';
import { CourseToolsSection } from './extras/CourseToolsSection';

import type { Course, CourseLecture } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseDetailContentProps {
  course: Course;
}

const ENROLMENT_CARD_ID = 'course-enrollment-card';

/**
 * The loaded course page: hero; course type / dates, what you learn, includes, tools and what you get on the
 * left with the enrolment card on the right (first on phones); then, full width, the curriculum, projects,
 * audience, description, instructors, success stories and FAQ; the buy bar.
 */
export const CourseDetailContent: FC<CourseDetailContentProps> = ({ course }) => {
  const weeks = useLiveClasses(course._id).data ?? [];
  const quizSections = usePublicQuizSections(course._id).data ?? [];
  const preview = useModal<CourseLecture>();
  const lectureCount = countLectures(course);

  return (
    <>
      <CourseDetailHero course={course} />
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 6 }, pb: BUY_BAR_SPACE }}>
        <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
            <CourseTypeScheduleCard course={course} />
            <CourseLearnList items={course.whatYouWillLearn} />
            <CourseIncludesList lectureCount={lectureCount} liveClassPlanCount={weeks.length} />
            <CourseToolsSection section={course.toolsSection} />
            <CourseBenefitsSection section={course.benefitsSection} />
          </Grid>
          <Grid
            size={{ xs: 12, md: 4 }}
            component="aside"
            id={ENROLMENT_CARD_ID}
            tabIndex={-1}
            sx={{ order: { xs: 1, md: 2 }, mt: { md: -32 }, zIndex: 1, outline: 'none' }}
          >
            <CourseEnrollmentCard course={course} lectureCount={lectureCount} />
          </Grid>
        </Grid>
        <CourseDetailWideSections
          course={course}
          weeks={weeks}
          quizSections={quizSections}
          onPreview={preview.openModal}
        />
      </Container>
      <CourseBuyBar course={course} targetId={ENROLMENT_CARD_ID} />
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
