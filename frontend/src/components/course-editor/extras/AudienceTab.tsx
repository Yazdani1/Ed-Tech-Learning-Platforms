'use client';

import Box from '@mui/material/Box';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { EXTRAS_MAX_ITEMS } from '@/schemas/course-extras.schema';

import { ListFieldEditor } from '../details/ListFieldEditor';

import { ExtrasTabHeader } from './ExtrasTabHeader';
import { SaveButton } from './SaveButton';
import { useSaveExtras } from './useSaveExtras';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

const AUDIENCE_ITEM_MAX = 200;

interface AudienceTabProps {
  course: Course;
}

/** Course editor > Who this course is for: one input that adds as many short items as needed. */
export const AudienceTab: FC<AudienceTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const { save, isSaving } = useSaveExtras(course._id);
  const [items, setItems] = useState<string[]>(course.audience);

  return (
    <Box>
      <ExtrasTabHeader
        title={t('catalog.tabs.audience')}
        hint={t('catalog.extras.audience.hint')}
        actions={
          <SaveButton
            saving={isSaving}
            onClick={() => {
              // The server's limits, checked before sending
              if (
                items.length > EXTRAS_MAX_ITEMS ||
                items.some((item) => item.length > AUDIENCE_ITEM_MAX)
              ) {
                toast.error(
                  t('catalog.extras.audience.tooMany', {
                    max: EXTRAS_MAX_ITEMS,
                    length: AUDIENCE_ITEM_MAX,
                  }),
                );
                return;
              }
              save({ audience: items });
            }}
          />
        }
      />
      <Box sx={{ maxWidth: 720 }}>
        <ListFieldEditor
          label={t('catalog.extras.audience.label')}
          values={items}
          onChange={setItems}
        />
      </Box>
    </Box>
  );
};
