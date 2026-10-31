'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { QuizBankManagePanel } from './QuizBankManagePanel';
import { QuizBankModals } from './QuizBankModals';
import { QuizBankPlaceholder } from './QuizBankPlaceholder';
import { QuizBankSidebar } from './QuizBankSidebar';
import { useQuizBankUi } from './useQuizBankUi';

import type { FC } from 'react';
import { useQuizBanks, useQuizSections } from '@/api/quiz.api';

interface QuizBankTabProps {
  courseId: string;
}

const SIDEBAR_WIDTH = 300;
const MIN_HEIGHT_DESKTOP = 520;
const FRAME_SX = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  minHeight: { md: MIN_HEIGHT_DESKTOP },
} as const;

/** On phones only one side shows at a time; on desktop both. */
const showOnPhone = (visible: boolean) => ({ xs: visible ? 'block' : 'none', md: 'block' });

/**
 * Quiz bank management: sections and banks on the left, the open bank with its questions on the right.
 * On phones the list and the open bank take turns (with a back button).
 */
export const QuizBankTab: FC<QuizBankTabProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const sections = useQuizSections(courseId);
  const banks = useQuizBanks(courseId);
  const ui = useQuizBankUi(courseId, banks.data ?? []);
  const bank = ui.managingBank;

  return (
    <QueryState
      isLoading={sections.isLoading || banks.isLoading}
      error={sections.error ?? banks.error}
      onRetry={() => {
        void sections.refetch();
        void banks.refetch();
      }}
    >
      <Box sx={FRAME_SX}>
        <Box
          sx={{
            width: { xs: '100%', md: SIDEBAR_WIDTH },
            flexShrink: 0,
            borderRight: { md: 1 },
            borderColor: 'divider',
            display: showOnPhone(!bank),
          }}
        >
          <QuizBankSidebar
            sections={sections.data ?? []}
            banks={banks.data ?? []}
            managingBankId={bank?._id ?? null}
            onAddSection={() => {
              ui.sectionModal.openModal();
            }}
            handlers={ui.handlers}
          />
        </Box>
        <Box
          sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, md: 0 }, display: showOnPhone(Boolean(bank)) }}
        >
          {bank ? (
            <>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={ui.closeBank}
                sx={{ display: { md: 'none' }, minHeight: 44, mb: 1 }}
              >
                {t('catalog.quiz.backToList')}
              </Button>
              <QuizBankManagePanel bank={bank} ui={ui} />
            </>
          ) : (
            <QuizBankPlaceholder />
          )}
        </Box>
      </Box>
      <QuizBankModals ui={ui} />
    </QueryState>
  );
};
