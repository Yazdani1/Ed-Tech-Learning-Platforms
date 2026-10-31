'use client';

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { type Course, type CourseSection, type CourseStatus } from '@/schemas/browse.schema';
import {
  createdItemSchema,
  savedCourseSchema,
  type SavedCourse,
} from '@/schemas/course-editor.schema';
import { quizBankSchema, quizSectionSchema } from '@/schemas/quiz.schema';
import { http, type ApiError } from '@/services/http.service';

import { refreshCourseLists } from './course-cache';
import { queryKeys } from './query-keys';

// Course editor: course details (multipart create/update + status), curriculum and quiz bank management.
// The course is read with browse.api useCourse (one request and cache entry for the course page, the player
// and the editor); quiz sections and banks with quiz.api; live classes are saved with live-class.api.

const enc = encodeURIComponent;
const courseUrl = (id: string): string => `/api/courses/${enc(id)}`;
const sectionUrl = (courseId: string, sectionId: string): string =>
  `${courseUrl(courseId)}/sections/${enc(sectionId)}`;
const lectureUrl = (courseId: string, sectionId: string, lectureId: string): string =>
  `${sectionUrl(courseId, sectionId)}/lectures/${enc(lectureId)}`;

/** A course editor change: the variables it takes; the result is not used (lists are read again). */
export type EditorMutation<V> = UseMutationResult<unknown, ApiError, V>;

export interface LectureBody {
  title: string;
  videoUrl?: string;
  isPreview: boolean;
}

export interface QuestionBody {
  question: string;
  options: { text: string; explanation?: string }[];
  correctOptionIndices: number[];
}

/** What a new course starts with: the details, and the parts the create route ignores. */
export interface CreateCourseInput {
  details: FormData;
  /** description and the lists, sent with a follow-up PUT (POST /api/courses does not take them) */
  extras: FormData | null;
  /** The "Introduction" section and its preview lecture every new course gets (as before) */
  intro: { section: string; lecture: string };
  status?: CourseStatus;
}

export interface UpdateCourseInput {
  details: FormData;
  status?: CourseStatus;
}

/** A new course; `complete` is false when it was created but a follow-up step (extras, intro, status) failed. */
export interface CreatedCourse {
  course: SavedCourse;
  complete: boolean;
}

// ---- Course ----

const setStatus = (id: string, status: CourseStatus): Promise<SavedCourse> =>
  http.patch(`${courseUrl(id)}/status`, { status }, savedCourseSchema);

/** Adds the Introduction section with its free-preview lecture. */
const addIntroSection = async (
  courseId: string,
  intro: CreateCourseInput['intro'],
): Promise<void> => {
  const section = await http.post(
    `${courseUrl(courseId)}/sections`,
    { title: intro.section },
    createdItemSchema,
  );
  await http.post(
    `${sectionUrl(courseId, section._id)}/lectures`,
    { title: intro.lecture, isPreview: true },
    createdItemSchema,
  );
};

/**
 * POST creates the course; the follow-up steps never throw, so a retry after a partial failure edits the
 * course that now exists instead of creating a second one.
 */
export const createCourse = async (input: CreateCourseInput): Promise<CreatedCourse> => {
  const created = await http.post('/api/courses', input.details, savedCourseSchema);
  try {
    if (input.extras) await http.put(courseUrl(created._id), input.extras, savedCourseSchema);
    await addIntroSection(created._id, input.intro);
    const course = input.status ? await setStatus(created._id, input.status) : created;
    return { course, complete: true };
  } catch {
    return { course: created, complete: false };
  }
};

export const updateCourse = async (id: string, input: UpdateCourseInput): Promise<SavedCourse> => {
  const saved = await http.put(courseUrl(id), input.details, savedCourseSchema);
  return input.status ? setStatus(id, input.status) : saved;
};

export const useCreateCourse = (): UseMutationResult<
  CreatedCourse,
  ApiError,
  CreateCourseInput
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => refreshCourseLists(queryClient),
  });
};

/** Saves the details; the cached course keeps its form values (no refetch while typing). */
export const useUpdateCourse = (
  id: string,
): UseMutationResult<SavedCourse, ApiError, UpdateCourseInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => updateCourse(id, input),
    onSuccess: (saved) => {
      queryClient.setQueryData<Course>(queryKeys.browse.course(id), (current) =>
        current
          ? {
              ...current,
              status: saved.status,
              publishedAt: saved.publishedAt,
              coverImage: saved.coverImage,
            }
          : current,
      );
      return refreshCourseLists(queryClient, id);
    },
  });
};

// ---- Curriculum ----

/** The course (with its outline) is read again: the editor, the course page and the player share it. */
const refreshCourse = (queryClient: QueryClient, courseId: string): Promise<void> =>
  queryClient.invalidateQueries({ queryKey: queryKeys.browse.course(courseId) });

/** A curriculum change: on success the course (with its outline) is read again. */
const useCurriculumMutation = <V>(
  courseId: string,
  mutationFn: (variables: V) => Promise<unknown>,
): EditorMutation<V> => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => refreshCourse(queryClient, courseId) });
};

export const useAddSection = (courseId: string): EditorMutation<string> =>
  useCurriculumMutation(courseId, (title: string) =>
    http.post(`${courseUrl(courseId)}/sections`, { title }, createdItemSchema),
  );

export const useRenameSection = (
  courseId: string,
): EditorMutation<{ sectionId: string; title: string }> =>
  useCurriculumMutation(courseId, (input: { sectionId: string; title: string }) =>
    http.send('PUT', sectionUrl(courseId, input.sectionId), { title: input.title }),
  );

export const useDeleteSection = (courseId: string): EditorMutation<string> =>
  useCurriculumMutation(courseId, (sectionId: string) =>
    http.send('DELETE', sectionUrl(courseId, sectionId)),
  );

export const useAddLecture = (
  courseId: string,
): EditorMutation<{ sectionId: string; body: LectureBody }> =>
  useCurriculumMutation(courseId, (input: { sectionId: string; body: LectureBody }) =>
    http.post(`${sectionUrl(courseId, input.sectionId)}/lectures`, input.body, createdItemSchema),
  );

export const useUpdateLecture = (
  courseId: string,
): EditorMutation<{ sectionId: string; lectureId: string; body: LectureBody }> =>
  useCurriculumMutation(
    courseId,
    (input: { sectionId: string; lectureId: string; body: LectureBody }) =>
      http.send('PUT', lectureUrl(courseId, input.sectionId, input.lectureId), input.body),
  );

export const useDeleteLecture = (
  courseId: string,
): EditorMutation<{ sectionId: string; lectureId: string }> =>
  useCurriculumMutation(courseId, (input: { sectionId: string; lectureId: string }) =>
    http.send('DELETE', lectureUrl(courseId, input.sectionId, input.lectureId)),
  );

/**
 * Saves a new order (the backend needs every id of the parent exactly once). The new order shows at once;
 * on failure the course is read again so the screen shows the real order.
 */
export const useReorderCurriculum = (
  courseId: string,
): EditorMutation<{ sectionId?: string; sections: CourseSection[] }> => {
  const queryClient = useQueryClient();
  const key = queryKeys.browse.course(courseId);
  return useMutation({
    mutationFn: ({ sectionId, sections }) => {
      const orderedIds = sectionId
        ? (sections.find((s) => s._id === sectionId)?.lectures ?? []).map((l) => l._id)
        : sections.map((s) => s._id);
      const url = sectionId
        ? `${sectionUrl(courseId, sectionId)}/lectures/reorder`
        : `${courseUrl(courseId)}/sections/reorder`;
      return http.send('PUT', url, { orderedIds });
    },
    onMutate: ({ sections }) => {
      queryClient.setQueryData<Course>(key, (current) =>
        current ? { ...current, sections } : current,
      );
    },
    onError: () => refreshCourse(queryClient, courseId),
  });
};

// ---- Quiz banks ----

/** A quiz change: the sections and banks (editor and player), the public quiz list and attempts. */
const useQuizMutation = <V>(
  courseId: string,
  mutationFn: (variables: V) => Promise<unknown>,
): EditorMutation<V> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.sections(courseId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.banks(courseId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.browse.quizTree(courseId) }),
        // A removed question or bank also changes the student's stored attempts
        queryClient.invalidateQueries({ queryKey: queryKeys.learn.quizAttempts(courseId) }),
      ]),
  });
};

export const useCreateQuizSection = (courseId: string): EditorMutation<string> =>
  useQuizMutation(courseId, (title: string) =>
    http.post('/api/quiz-sections', { course: courseId, title }, quizSectionSchema),
  );

export interface QuizSectionUpdate {
  id: string;
  body: { title?: string; isFreePreview?: boolean };
}

export const useUpdateQuizSection = (courseId: string): EditorMutation<QuizSectionUpdate> =>
  useQuizMutation(courseId, (input: QuizSectionUpdate) =>
    http.put(`/api/quiz-sections/${enc(input.id)}`, input.body, quizSectionSchema),
  );

export const useDeleteQuizSection = (courseId: string): EditorMutation<string> =>
  useQuizMutation(courseId, (id: string) => http.send('DELETE', `/api/quiz-sections/${enc(id)}`));

export interface QuizBankCreate {
  quizSection: string;
  title: string;
  description?: string;
}

export const useCreateQuizBank = (courseId: string): EditorMutation<QuizBankCreate> =>
  useQuizMutation(courseId, (input: QuizBankCreate) =>
    http.post('/api/quiz-bank', { course: courseId, ...input }, quizBankSchema),
  );

export interface QuizBankUpdate {
  id: string;
  body: { title?: string; description?: string; isFreePreview?: boolean };
}

export const useUpdateQuizBank = (courseId: string): EditorMutation<QuizBankUpdate> =>
  useQuizMutation(courseId, (input: QuizBankUpdate) =>
    http.put(`/api/quiz-bank/${enc(input.id)}`, input.body, quizBankSchema),
  );

export const useDeleteQuizBank = (courseId: string): EditorMutation<string> =>
  useQuizMutation(courseId, (id: string) => http.send('DELETE', `/api/quiz-bank/${enc(id)}`));

export interface QuestionSave {
  bankId: string;
  questionId?: string;
  body: QuestionBody;
}

export const useSaveQuestion = (courseId: string): EditorMutation<QuestionSave> =>
  useQuizMutation(courseId, (input: QuestionSave) =>
    input.questionId
      ? http.put(
          `/api/quiz-bank/${enc(input.bankId)}/questions/${enc(input.questionId)}`,
          input.body,
          quizBankSchema,
        )
      : http.post(`/api/quiz-bank/${enc(input.bankId)}/questions`, input.body, quizBankSchema),
  );

export const useDeleteQuestion = (
  courseId: string,
): EditorMutation<{ bankId: string; questionId: string }> =>
  useQuizMutation(courseId, (input: { bankId: string; questionId: string }) =>
    http.send('DELETE', `/api/quiz-bank/${enc(input.bankId)}/questions/${enc(input.questionId)}`),
  );
