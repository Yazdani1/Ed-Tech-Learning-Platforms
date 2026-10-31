'use client';

import { useTranslation } from 'react-i18next';

import {
  useAddLecture,
  useAddSection,
  useDeleteLecture,
  useDeleteSection,
  useRenameSection,
  useReorderCurriculum,
  useUpdateLecture,
} from '@/api/course-editor.api';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import { useToastResult } from '@/hooks/useToastResult';

import type { LectureForm } from '@/schemas/course-editor.schema';
import type { DropResult } from '@hello-pangea/dnd';
import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';

export const SECTION_DROP_TYPE = 'section';
export const LECTURE_DROP_TYPE = 'lecture';

type Run = ReturnType<typeof useToastResult>;

const move = <T>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};

export interface CurriculumActions {
  addSection: (title: string) => Promise<boolean>;
  renameSection: (sectionId: string, title: string) => Promise<boolean>;
  deleteSection: (section: CourseSection) => void;
  saveLecture: (
    sectionId: string,
    lecture: CourseLecture | undefined,
    values: LectureForm,
  ) => Promise<boolean>;
  deleteLecture: (sectionId: string, lecture: CourseLecture) => void;
  onDragEnd: (result: DropResult) => void;
  isSavingSection: boolean;
  isSavingLecture: boolean;
}

/** Drag-and-drop: sections move anywhere, lectures only inside their own section (no API to move across). */
const useDragEnd = (courseId: string, sections: CourseSection[], run: Run) => {
  const reorder = useReorderCurriculum(courseId);
  return ({ source, destination, type }: DropResult): void => {
    if (!destination || destination.index === source.index) return;
    if (type === SECTION_DROP_TYPE) {
      void run(reorder.mutateAsync({ sections: move(sections, source.index, destination.index) }));
      return;
    }
    if (source.droppableId !== destination.droppableId) return;
    const next = sections.map((section) =>
      section._id === source.droppableId
        ? { ...section, lectures: move(section.lectures, source.index, destination.index) }
        : section,
    );
    void run(reorder.mutateAsync({ sectionId: source.droppableId, sections: next }));
  };
};

const useLectureActions = (courseId: string, run: Run) => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const add = useAddLecture(courseId);
  const update = useUpdateLecture(courseId);
  const remove = useDeleteLecture(courseId);

  const saveLecture: CurriculumActions['saveLecture'] = (sectionId, lecture, values) => {
    const body = { title: values.title, videoUrl: values.videoUrl, isPreview: values.isPreview };
    return lecture
      ? run(
          update.mutateAsync({ sectionId, lectureId: lecture._id, body }),
          t('catalog.curriculum.lectureUpdated'),
        )
      : run(add.mutateAsync({ sectionId, body }), t('catalog.curriculum.lectureAdded'));
  };

  const deleteLecture: CurriculumActions['deleteLecture'] = (sectionId, lecture) => {
    void confirmDelete(lecture.title).then(
      (ok) =>
        ok &&
        run(
          remove.mutateAsync({ sectionId, lectureId: lecture._id }),
          t('catalog.curriculum.lectureDeleted'),
        ),
    );
  };

  return { saveLecture, deleteLecture, isSavingLecture: add.isPending || update.isPending };
};

/** Every change of the outline: sections and lectures (add, rename/edit, delete) and drag-and-drop order. */
export const useCurriculumActions = (
  courseId: string,
  sections: CourseSection[],
): CurriculumActions => {
  const { t } = useTranslation();
  const run = useToastResult();
  const confirmDelete = useDeleteConfirm();
  const add = useAddSection(courseId);
  const rename = useRenameSection(courseId);
  const remove = useDeleteSection(courseId);
  const lectures = useLectureActions(courseId, run);
  const onDragEnd = useDragEnd(courseId, sections, run);

  return {
    addSection: (title) => run(add.mutateAsync(title), t('catalog.curriculum.sectionAdded')),
    renameSection: (sectionId, title) =>
      run(rename.mutateAsync({ sectionId, title }), t('catalog.curriculum.sectionUpdated')),
    deleteSection: (section) => {
      void confirmDelete(section.title).then(
        (ok) => ok && run(remove.mutateAsync(section._id), t('catalog.curriculum.sectionDeleted')),
      );
    },
    ...lectures,
    onDragEnd,
    isSavingSection: add.isPending || rename.isPending,
  };
};
