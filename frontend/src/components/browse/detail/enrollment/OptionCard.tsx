import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';

import type { FC, ReactNode } from 'react';

interface OptionCardProps {
  /** Radio group name */
  name: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  /** Border colour when selected */
  color: string;
  /** Title and price (inside the radio's label) */
  header: ReactNode;
  /** Shown under the header while selected */
  children: ReactNode;
}

/** One way to get the course (subscription or direct): a bordered radio card that opens when chosen. */
export const OptionCard: FC<OptionCardProps> = ({
  name,
  value,
  selected,
  onSelect,
  color,
  header,
  children,
}) => (
  <Box
    sx={{
      border: '2px solid',
      borderColor: selected ? color : 'divider',
      borderRadius: 2,
      p: 2,
      transition: 'border-color 0.15s',
      '&:hover': { borderColor: color },
    }}
  >
    <Box
      component="label"
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, cursor: 'pointer' }}
    >
      <Radio
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        sx={{ p: 0.5, mt: -0.5, ml: -0.5, color, '&.Mui-checked': { color } }}
      />
      <Box sx={{ minWidth: 0 }}>{header}</Box>
    </Box>
    {selected && <Box sx={{ mt: 2 }}>{children}</Box>}
  </Box>
);
