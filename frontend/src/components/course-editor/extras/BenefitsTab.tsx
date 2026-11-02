'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EXTRAS_MAX_ITEMS, type Benefit } from '@/schemas/course-extras.schema';

import { BenefitItemEditor } from './BenefitItemEditor';
import { ExtrasTabHeader } from './ExtrasTabHeader';
import { SaveButton } from './SaveButton';
import { SectionIntroFields } from './SectionIntroFields';
import { useSaveExtras } from './useSaveExtras';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface BenefitsTabProps {
  course: Course;
}

const EMPTY_ITEM: Benefit = { title: '', description: '', icon: null };

/** Course editor > What you get: section title and description, then cards of logo + title + description. */
export const BenefitsTab: FC<BenefitsTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const { save, isSaving } = useSaveExtras(course._id);
  const [intro, setIntro] = useState({
    title: course.benefitsSection.title,
    description: course.benefitsSection.description,
  });
  const [items, setItems] = useState<Benefit[]>(course.benefitsSection.items);

  const handleSave = (): void => {
    const cleaned = items.map((item) => ({ ...item, title: item.title.trim() }));
    if (cleaned.some((item) => !item.title)) {
      toast.error(t('catalog.extras.itemTitleRequired'));
      return;
    }
    save({ benefitsSection: { ...intro, items: cleaned } });
  };

  return (
    <Box>
      <ExtrasTabHeader
        title={t('catalog.tabs.benefits')}
        hint={t('catalog.extras.benefits.hint')}
        actions={<SaveButton saving={isSaving} onClick={handleSave} />}
      />
      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <SectionIntroFields
          value={intro}
          onChange={setIntro}
          titlePlaceholder={t('browse.extras.benefitsTitle')}
        />
        {items.map((item, index) => (
          <BenefitItemEditor
            // Items have no id; the position is their identity while editing
            key={index}
            courseId={course._id}
            index={index}
            item={item}
            onChange={(next) => {
              setItems((list) => list.map((old, i) => (i === index ? next : old)));
            }}
            onRemove={() => {
              setItems((list) => list.filter((_old, i) => i !== index));
            }}
          />
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={items.length >= EXTRAS_MAX_ITEMS}
          onClick={() => {
            setItems((list) => [...list, EMPTY_ITEM]);
          }}
          sx={{ alignSelf: 'flex-start', minHeight: 44 }}
        >
          {t('catalog.extras.benefits.add')}
        </Button>
      </Stack>
    </Box>
  );
};
