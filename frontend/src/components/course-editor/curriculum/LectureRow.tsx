'use client';

import { Draggable } from '@hello-pangea/dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { IconAction } from '../common/IconAction';
import { SortHandle } from '../common/SortHandle';

import type { FC } from 'react';
import type { CourseLecture } from '@/schemas/browse.schema';

interface LectureRowProps {
  lecture: CourseLecture;
  index: number;
  onEdit: (lecture: CourseLecture) => void;
  onDelete: (lecture: CourseLecture) => void;
}

const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 0.5,
  pr: 0.5,
  mb: 1,
  border: 1,
  borderColor: 'divider',
  borderRadius: 1.5,
} as const;

/** One lecture of a section: drag handle, title, "Free Preview" badge, edit and delete. */
export const LectureRow: FC<LectureRowProps> = ({ lecture, index, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const name = lecture.title;

  return (
    <Draggable draggableId={lecture._id} index={index}>
      {(provided, snapshot) => (
        <Box
          component="li"
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{ ...ROW_SX, bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper' }}
        >
          <SortHandle
            handleProps={provided.dragHandleProps}
            label={t('catalog.curriculum.dragLecture', { name })}
          />
          <PlayCircleOutlinedIcon fontSize="small" color="action" aria-hidden />
          <Typography variant="body2" sx={{ flex: 1, minWidth: 120, wordBreak: 'break-word' }}>
            {name}
          </Typography>
          {lecture.isPreview && (
            <Chip
              icon={<VisibilityIcon />}
              label={t('catalog.curriculum.freePreview')}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
          <IconAction
            label={t('catalog.curriculum.editLectureNamed', { name })}
            icon={<EditIcon fontSize="small" />}
            onClick={() => {
              onEdit(lecture);
            }}
          />
          <IconAction
            label={t('catalog.curriculum.deleteLectureNamed', { name })}
            icon={<DeleteIcon fontSize="small" />}
            color="error"
            onClick={() => {
              onDelete(lecture);
            }}
          />
        </Box>
      )}
    </Draggable>
  );
};
