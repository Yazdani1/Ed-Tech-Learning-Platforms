'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { EXTRAS_MAX_FAQS, type CourseFaq } from '@/schemas/course-extras.schema';

import { ExtrasListItem } from './ExtrasListItem';
import { ExtrasTabHeader } from './ExtrasTabHeader';
import { FaqFormModal } from './FaqFormModal';
import { useExtrasList } from './useExtrasList';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface FaqTabProps {
  course: Course;
}

/** Course editor > FAQ: the course's questions and answers, each added / edited in a dialog. */
export const FaqTab: FC<FaqTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const list = useExtrasList<CourseFaq>(course._id, 'faqs', course.faqs);
  const editing = list.form.data === undefined ? undefined : course.faqs[list.form.data];

  return (
    <Box>
      <ExtrasTabHeader
        title={t('catalog.tabs.faq')}
        hint={t('catalog.extras.faq.hint')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={course.faqs.length >= EXTRAS_MAX_FAQS}
            onClick={() => {
              list.form.openModal();
            }}
            sx={{ minHeight: 44 }}
          >
            {t('catalog.extras.faq.add')}
          </Button>
        }
      />
      {course.faqs.length === 0 ? (
        <Typography color="text.secondary">{t('catalog.extras.faq.empty')}</Typography>
      ) : (
        <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
          {course.faqs.map((faq, index) => (
            <ExtrasListItem
              key={`${faq.question}-${index}`}
              title={faq.question}
              subtitle={faq.answer}
              onEdit={() => {
                list.form.openModal(index);
              }}
              onDelete={() => void list.remove(index, faq.question)}
            />
          ))}
        </Stack>
      )}
      <FaqFormModal
        open={list.form.open}
        faq={editing}
        saving={list.isSaving}
        onClose={list.form.closeModal}
        onSave={(faq) => {
          list.saveItem(faq, list.form.data);
        }}
      />
    </Box>
  );
};
