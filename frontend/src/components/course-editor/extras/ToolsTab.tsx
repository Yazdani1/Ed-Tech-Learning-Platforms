'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useModal } from '@/hooks/useModal';

import { ExtrasTabHeader } from './ExtrasTabHeader';
import { SaveButton } from './SaveButton';
import { SectionIntroFields } from './SectionIntroFields';
import { SelectedTools } from './SelectedTools';
import { ToolPickerDrawer } from './ToolPickerDrawer';
import { useSaveExtras } from './useSaveExtras';

import type { Course } from '@/schemas/browse.schema';
import type { Tool } from '@/schemas/tools.schema';
import type { FC } from 'react';

interface ToolsTabProps {
  course: Course;
}

/** Course editor > Tools: section title and description, and the tools chosen in the right-side picker. */
export const ToolsTab: FC<ToolsTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const { save, isSaving } = useSaveExtras(course._id);
  const picker = useModal();
  const [intro, setIntro] = useState({
    title: course.toolsSection.title,
    description: course.toolsSection.description,
  });
  const [tools, setTools] = useState<Tool[]>(course.toolsSection.tools);

  return (
    <Box>
      <ExtrasTabHeader
        title={t('catalog.tabs.tools')}
        hint={t('catalog.extras.tools.hint')}
        actions={
          <SaveButton
            saving={isSaving}
            onClick={() => {
              save({ toolsSection: { ...intro, tools: tools.map((tool) => tool._id) } });
            }}
          />
        }
      />
      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <SectionIntroFields
          value={intro}
          onChange={setIntro}
          titlePlaceholder={t('browse.extras.toolsTitle')}
        />
        <SelectedTools
          tools={tools}
          onChoose={() => {
            picker.openModal();
          }}
          onRemove={(toolId) => {
            setTools((list) => list.filter((tool) => tool._id !== toolId));
          }}
        />
      </Stack>
      <ToolPickerDrawer
        open={picker.open}
        selected={tools.map((tool) => tool._id)}
        onClose={picker.closeModal}
        onDone={(chosen) => {
          setTools(chosen);
          picker.closeModal();
        }}
      />
    </Box>
  );
};
