'use client';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseThumb } from './CourseThumb';

import type { FC } from 'react';

const TOUCH_TARGET = 56;

interface CoursePickerOptionProps {
  title: string;
  coverImage?: string | null;
  checked: boolean;
  /** "12 paid students" / "8 students"; omitted for the "All courses" row */
  countLabel?: string;
  /** Shows the "Unpublished" tag */
  draft?: boolean;
  /** "All courses" row: no cover */
  showCover?: boolean;
  onToggle: () => void;
}

/** One course in the picker: checkbox, cover, title and its student count in one row (whole row clickable). */
export const CoursePickerOption: FC<CoursePickerOptionProps> = ({
  title,
  coverImage,
  checked,
  countLabel,
  draft = false,
  showCover = true,
  onToggle,
}) => {
  const { t } = useTranslation();
  const labelId = useId();
  return (
    <ListItemButton
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={labelId}
      selected={checked}
      onClick={onToggle}
      sx={{
        border: 1,
        borderColor: checked ? 'primary.main' : 'divider',
        borderRadius: 1,
        mb: 1,
        gap: 1.5,
        minHeight: TOUCH_TARGET,
        px: 1.5,
      }}
    >
      <Checkbox
        edge="start"
        checked={checked}
        tabIndex={-1}
        disableRipple
        slotProps={{ input: { 'aria-hidden': true } }}
        sx={{ p: 0.5 }}
      />
      {showCover && <CourseThumb coverImage={coverImage} />}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          id={labelId}
          sx={{ fontWeight: checked ? 700 : 500, overflowWrap: 'anywhere', lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {draft && (
          <Chip label={t('coursePicker.unpublished')} size="small" sx={{ mt: 0.5, mr: 0.5 }} />
        )}
      </Box>
      {countLabel && (
        <Chip
          label={countLabel}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ flexShrink: 0, fontWeight: 700 }}
        />
      )}
    </ListItemButton>
  );
};
