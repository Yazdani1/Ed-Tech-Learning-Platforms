'use client';

import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { blankLecture } from './live-class.utils';
import { LiveClassLectureFields } from './LiveClassLectureFields';

import type { LiveClassRequest } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface LiveClassClassesFieldProps {
  form: UseFormReturn<LiveClassRequest>;
}

const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mt: 2,
  mb: 1,
} as const;

/** The classes of a week: "Add Class" and one block of fields per class. */
export const LiveClassClassesField: FC<LiveClassClassesFieldProps> = ({ form }) => {
  const { t } = useTranslation();
  const lectures = useFieldArray({ control: form.control, name: 'lectures' });
  const errors = form.formState.errors.lectures;
  const listError = errors?.message ?? errors?.root?.message;

  return (
    <>
      <Box sx={HEADER_SX}>
        <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700 }}>
          {t('catalog.liveClass.classes')}
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            lectures.append(blankLecture());
          }}
          sx={{ minHeight: 44 }}
        >
          {t('catalog.liveClass.addClass')}
        </Button>
      </Box>
      {listError && <Alert severity="error">{t(listError)}</Alert>}
      {lectures.fields.map((item, index) => (
        <LiveClassLectureFields
          key={item.id}
          form={form}
          index={index}
          onRemove={() => {
            lectures.remove(index);
          }}
        />
      ))}
    </>
  );
};
