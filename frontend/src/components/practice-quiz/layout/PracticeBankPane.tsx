'use client';

import { PracticeBankTree } from '../tree/PracticeBankTree';

import type { PracticePage } from '../usePracticePage';
import type { FC } from 'react';

interface PracticeBankPaneProps {
  page: PracticePage;
  /** After a bank was chosen (closes the drawer on phones) */
  onChosen: () => void;
}

/** The quiz bank tree wired to the page state (a fresh tree per course, so its folds start over). */
export const PracticeBankPane: FC<PracticeBankPaneProps> = ({ page, onChosen }) => {
  const { selection } = page;
  const { tree } = selection;
  return (
    <PracticeBankTree
      key={selection.courseId ?? ''}
      courseId={selection.courseId}
      tree={tree.data}
      isLoading={tree.isPending && selection.courseId !== null}
      error={tree.error}
      onRetry={() => void tree.refetch()}
      answers={page.practice.answers}
      selectedBankId={selection.bank?._id ?? null}
      subsection={selection.subsection}
      onSelect={(bankId, subsection) => {
        selection.selectBank(bankId, subsection);
        onChosen();
      }}
      onReset={page.resetBank}
    />
  );
};
