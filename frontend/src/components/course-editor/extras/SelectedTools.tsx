'use client';

import CloseIcon from '@mui/icons-material/Close';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ToolLogo } from '@/components/setup/tools/ToolLogo';

import type { Tool } from '@/schemas/tools.schema';
import type { FC } from 'react';

interface SelectedToolsProps {
  tools: readonly Tool[];
  onChoose: () => void;
  onRemove: (toolId: string) => void;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
  gap: 1.5,
  p: 0,
  m: 0,
  listStyle: 'none',
} as const;

/** The tools chosen for the course (logo cards with a remove button) and the "Choose tools" button. */
export const SelectedTools: FC<SelectedToolsProps> = ({ tools, onChoose, onRemove }) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          {t('catalog.extras.tools.selected', { count: tools.length })}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<HandymanOutlinedIcon />}
          onClick={onChoose}
          sx={{ minHeight: 44 }}
        >
          {t('catalog.extras.tools.choose')}
        </Button>
      </Box>
      {tools.length === 0 ? (
        <Typography color="text.secondary">{t('catalog.extras.tools.none')}</Typography>
      ) : (
        <Box component="ul" sx={GRID_SX}>
          {tools.map((tool) => (
            <Paper
              component="li"
              key={tool._id}
              variant="outlined"
              sx={{ position: 'relative', p: 1.5, textAlign: 'center' }}
            >
              <IconButton
                size="small"
                aria-label={t('catalog.extras.tools.remove', { name: tool.name })}
                onClick={() => {
                  onRemove(tool._id);
                }}
                sx={{ position: 'absolute', top: 2, right: 2 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <ToolLogo tool={tool} size={40} decorative />
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, overflowWrap: 'anywhere' }}>
                {tool.name}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};
