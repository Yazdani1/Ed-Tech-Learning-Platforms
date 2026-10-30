// Pure helpers of the public catalog (durations, YouTube previews). No React, easy to unit test.
// Prices: utils/price.ts; image hosts: utils/urls.ts.
import type { Course, CourseLecture, CourseSection } from '@/schemas/browse.schema';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const TWO_DIGITS = 2;

const pad = (value: number): string => value.toString().padStart(TWO_DIGITS, '0');

/** Seconds as "m:ss" or "h:mm:ss" (empty for 0 or less). */
export const formatLectureDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return '';
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const rest = Math.floor(seconds % SECONDS_PER_MINUTE);
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
};

/** Whole hours and minutes of a section, for "{{hours}}hr {{minutes}}min" labels. */
export const splitDuration = (totalSeconds: number): { hours: number; minutes: number } => ({
  hours: Math.floor(totalSeconds / SECONDS_PER_HOUR),
  minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
});

export const sectionSeconds = (section: CourseSection): number =>
  section.lectures.reduce((total, lecture) => total + (lecture.duration ?? 0), 0);

/** The sections that exist (a deleted section comes back as null). */
export const courseSections = (course: Course): CourseSection[] =>
  course.sections.filter((section): section is CourseSection => section !== null);

export const countLectures = (course: Course): number =>
  courseSections(course).reduce((total, section) => total + section.lectures.length, 0);

const YOUTUBE_ID = /(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/;

/** The 11-character YouTube id of a video address, or null (only YouTube previews are embedded). */
export const youTubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const match = YOUTUBE_ID.exec(url);
  return match?.[1] ?? null;
};

export const youTubeEmbedUrl = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

/** Lectures that anyone may watch: free previews whose video is on YouTube. */
export const previewLectures = (course: Course): CourseLecture[] =>
  courseSections(course).flatMap((section) =>
    section.lectures.filter((lecture) => lecture.isPreview && youTubeId(lecture.videoUrl) !== null),
  );

const INTRO_TITLE = 'course introduction';

/** The video of the enrolment card: a "Course introduction" lecture, otherwise the first free preview. */
export const findIntroVideoId = (course: Course): string | null => {
  const lectures = courseSections(course).flatMap((section) => section.lectures);
  const intro = lectures.find(
    (lecture) =>
      lecture.title.toLowerCase().includes(INTRO_TITLE) && youTubeId(lecture.videoUrl) !== null,
  );
  return youTubeId(intro?.videoUrl) ?? youTubeId(previewLectures(course)[0]?.videoUrl);
};

/** Rich text as plain text for short previews (rendered as text, never as HTML). */
export const toPlainText = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
