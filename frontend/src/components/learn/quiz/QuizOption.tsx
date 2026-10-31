'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface QuizOptionProps {
  index: number;
  text: string;
  /** Shown after answering */
  explanation: string | null | undefined;
  selected: boolean;
  /** The question was answered: options are locked and coloured */
  checked: boolean;
  /** This option is a correct answer (known only after answering) */
  correct: boolean;
  onToggle: () => void;
}

const OPTION_TINT = 0.1;
const LABELS = ['A', 'B', 'C', 'D'] as const;

const tone = (
  checked: boolean,
  selected: boolean,
  correct: boolean,
): 'success' | 'error' | 'primary' | null => {
  if (checked) return correct ? 'success' : selected ? 'error' : null;
  return selected ? 'primary' : null;
};

type Tone = ReturnType<typeof tone>;

const optionSx = (color: Tone, checked: boolean): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  textAlign: 'left',
  gap: 1.5,
  p: 1.5,
  minHeight: 48,
  width: '100%',
  borderRadius: 1,
  border: 1.5,
  borderStyle: 'solid',
  borderColor: color ? `${color}.main` : 'divider',
  bgcolor: (theme) =>
    color ? alpha(theme.palette[color].main, OPTION_TINT) : theme.palette.background.paper,
  cursor: checked ? 'default' : 'pointer',
  '&:hover': checked ? undefined : { borderColor: 'primary.main' },
});

const letterSx = (color: Tone): SxProps<Theme> => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  fontWeight: 800,
  fontSize: '0.78rem',
  border: 1.5,
  borderStyle: 'solid',
  borderColor: color ? `${color}.main` : 'action.disabled',
  bgcolor: color ? `${color}.main` : 'transparent',
  color: color ? 'common.white' : 'text.secondary',
});

/** One answer option (a checkbox): A-D letter, text, and after answering green/red with its explanation. */
export const QuizOption: FC<QuizOptionProps> = ({
  index,
  text,
  explanation,
  selected,
  checked,
  correct,
  onToggle,
}) => {
  const color = tone(checked, selected, correct);
  return (
    <ButtonBase
      role="checkbox"
      aria-checked={selected}
      aria-disabled={checked}
      onClick={checked ? undefined : onToggle}
      sx={optionSx(color, checked)}
    >
      <Box aria-hidden sx={letterSx(color)}>
        {LABELS[index] ?? index + 1}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: selected ? 600 : 400, wordBreak: 'break-word' }}
        >
          {text}
        </Typography>
        {explanation && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
            {explanation}
          </Typography>
        )}
      </Box>
      {checked && correct && <CheckCircleIcon color="success" fontSize="small" />}
      {checked && selected && !correct && <CancelIcon color="error" fontSize="small" />}
    </ButtonBase>
  );
};
