import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  Box, IconButton, TextField, Typography, Tooltip, Collapse, Button,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import type { ILecture } from '../../../types/index';

interface LectureItemProps {
  lecture: ILecture;
  index: number;
  courseId: string;
  sectionId: string;
  onUpdate: (lectureId: string, data: Partial<ILecture>) => Promise<void>;
  onDelete: (lectureId: string) => Promise<void>;
}

export default function LectureItem({ lecture, index, onUpdate, onDelete }: LectureItemProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lecture.title);
  const [videoUrl, setVideoUrl] = useState(lecture.videoUrl ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(lecture._id, { title, videoUrl });
    setSaving(false);
    setEditing(false);
  };

  return (
    <Draggable draggableId={lecture._id} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            mb: 1,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1, gap: 1 }}>
            <Box {...provided.dragHandleProps} sx={{ color: 'text.disabled', display: 'flex', cursor: 'grab' }}>
              <DragIndicatorIcon fontSize="small" />
            </Box>
            <PlayCircleOutlinedIcon fontSize="small" color="action" />
            {editing ? (
              <TextField value={title} onChange={(e) => setTitle(e.target.value)} size="small" sx={{ flex: 1 }} autoFocus />
            ) : (
              <Typography variant="body2" sx={{ flex: 1 }}>{lecture.title}</Typography>
            )}
            {editing ? (
              <>
                <Tooltip title="Save">
                  <span>
                    <IconButton size="small" onClick={() => void handleSave()} disabled={saving} color="primary">
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton size="small" onClick={() => setEditing(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => setEditing(true)}><EditIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => void onDelete(lecture._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
          <Collapse in={editing}>
            <Box sx={{ px: 2, pb: 1.5 }}>
              <TextField
                label="Video URL (YouTube)" value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                size="small" fullWidth placeholder="https://youtube.com/watch?v=..." sx={{ mb: 1 }}
              />
              <Button size="small" variant="outlined" onClick={() => void handleSave()} disabled={saving}>
                Save Changes
              </Button>
            </Box>
          </Collapse>
        </Box>
      )}
    </Draggable>
  );
}
