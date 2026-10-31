'use client';

import { useTranslation } from 'react-i18next';

import { TitleFormModal } from '../common/TitleFormModal';

import { LectureFormModal } from './LectureFormModal';

import type { CurriculumActions } from './useCurriculumActions';
import type { ModalState } from '@/hooks/useModal';
import type { FC } from 'react';
import type { CourseLecture, CourseSection } from '@/schemas/browse.schema';

export interface LectureTarget {
  sectionId: string;
  lecture?: CourseLecture;
}

interface CurriculumModalsProps {
  actions: CurriculumActions;
  sectionModal: ModalState<CourseSection>;
  lectureModal: ModalState<LectureTarget>;
}

const closeIfOk = (close: () => void) => (ok: boolean) => {
  if (ok) close();
};

/** The section (add / rename) and lecture (add / edit) dialogs; each closes after a successful save. */
export const CurriculumModals: FC<CurriculumModalsProps> = ({
  actions,
  sectionModal,
  lectureModal,
}) => {
  const { t } = useTranslation();
  const editingSection = sectionModal.data;
  const target = lectureModal.data;

  return (
    <>
      <TitleFormModal
        open={sectionModal.open}
        title={t(
          editingSection ? 'catalog.curriculum.renameSection' : 'catalog.curriculum.addSection',
        )}
        fieldLabel={t('catalog.curriculum.sectionTitle')}
        initialValue={editingSection?.title}
        saveLabel={editingSection ? t('common.update') : t('common.add')}
        saving={actions.isSavingSection}
        onClose={sectionModal.closeModal}
        onSave={(title) => {
          const work = editingSection
            ? actions.renameSection(editingSection._id, title)
            : actions.addSection(title);
          void work.then(closeIfOk(sectionModal.closeModal));
        }}
      />
      <LectureFormModal
        open={lectureModal.open}
        lecture={target?.lecture}
        saving={actions.isSavingLecture}
        onClose={lectureModal.closeModal}
        onSave={(values) => {
          if (!target) return;
          void actions
            .saveLecture(target.sectionId, target.lecture, values)
            .then(closeIfOk(lectureModal.closeModal));
        }}
      />
    </>
  );
};
