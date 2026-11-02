'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { ToolLogo } from '@/components/setup/tools/ToolLogo';

import type { Tool } from '@/schemas/tools.schema';
import type { FC } from 'react';

interface ToolPickCardProps {
  tool: Tool;
  chosen: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

/** A tool in the picker: logo and name; a click selects or unselects it (checkbox semantics). */
export const ToolPickCard: FC<ToolPickCardProps> = ({
  tool,
  chosen,
  disabled = false,
  onToggle,
}) => (
  <ButtonBase
    role="checkbox"
    aria-checked={chosen}
    aria-disabled={disabled}
    disabled={disabled}
    onClick={onToggle}
    sx={{
      position: 'relative',
      flexDirection: 'column',
      p: 2,
      borderRadius: 2,
      border: 2,
      borderColor: chosen ? 'primary.main' : 'divider',
      bgcolor: chosen ? 'action.selected' : 'background.paper',
    }}
  >
    {chosen && (
      <CheckCircleIcon
        color="primary"
        fontSize="small"
        sx={{ position: 'absolute', top: 6, right: 6 }}
        aria-hidden
      />
    )}
    <ToolLogo tool={tool} size={48} decorative />
    <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, overflowWrap: 'anywhere' }}>
      {tool.name}
    </Typography>
  </ButtonBase>
);
