'use client';

import Close from '@mui/icons-material/Close';
import Search from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

const TOUCH_TARGET = 44;

interface CoursePickerHeaderProps {
  /** Id of the title (names the panel) */
  titleId: string;
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
}

/** Top of the course picker: title, close button and the title search box. */
export const CoursePickerHeader: FC<CoursePickerHeaderProps> = ({
  titleId,
  title,
  search,
  onSearchChange,
  onClose,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ p: 3, pb: 2, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography id={titleId} component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label={t('common.close')}
          sx={{ width: TOUCH_TARGET, height: TOUCH_TARGET }}
        >
          <Close />
        </IconButton>
      </Box>
      <TextField
        fullWidth
        size="small"
        value={search}
        onChange={(event) => {
          onSearchChange(event.target.value);
        }}
        placeholder={t('coursePicker.search')}
        slotProps={{
          htmlInput: { 'aria-label': t('coursePicker.search') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
