'use client';

import RadioButtonChecked from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

const TOUCH_TARGET = 48;

interface CourseSelectOptionProps {
  title: string;
  selected: boolean;
  /** Shows the "Unpublished" tag */
  draft?: boolean;
  onSelect: () => void;
}

/** One choice in the course picker (radio look, whole row clickable). */
export const CourseSelectOption: FC<CourseSelectOptionProps> = ({
  title,
  selected,
  draft = false,
  onSelect,
}) => {
  const { t } = useTranslation();
  return (
    <ListItemButton
      selected={selected}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        mb: 1.25,
        gap: 2,
        minHeight: TOUCH_TARGET,
      }}
    >
      {selected ? (
        <RadioButtonChecked color="primary" fontSize="small" aria-hidden />
      ) : (
        <RadioButtonUnchecked color="action" fontSize="small" aria-hidden />
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: selected ? 700 : 400, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {draft && (
          <Chip label={t('insights.performance.unpublished')} size="small" sx={{ mt: 0.75 }} />
        )}
      </Box>
    </ListItemButton>
  );
};
