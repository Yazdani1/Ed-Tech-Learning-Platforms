// Pure helpers of the course player. No React.
import { courseSections, youTubeId } from '@/components/browse/course-utils';

import type { Course, CourseLecture } from '@/schemas/browse.schema';

export const allLectures = (course: Course): CourseLecture[] =>
  courseSections(course).flatMap((section) => section.lectures);

/** Only YouTube videos play in the player (the server only sends addresses the viewer may watch). */
export const isPlayable = (lecture: CourseLecture): boolean => youTubeId(lecture.videoUrl) !== null;

/** The chosen lecture, or the first one that has a video. */
export const findActiveLecture = (
  course: Course,
  lectureId: string | null,
): CourseLecture | null => {
  const lectures = allLectures(course);
  return lectures.find((lecture) => lecture._id === lectureId) ?? lectures.find(isPlayable) ?? null;
};

export const totalSeconds = (course: Course): number =>
  allLectures(course).reduce((sum, lecture) => sum + (lecture.duration ?? 0), 0);
