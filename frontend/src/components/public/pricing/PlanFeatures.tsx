import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface PlanFeaturesProps {
  features: string[];
  color: string;
}

/** The plan's feature list with a tick in the plan's colour. */
export const PlanFeatures: FC<PlanFeaturesProps> = ({ features, color }) => (
  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, borderTop: 1, borderColor: 'divider' }}>
    {features.map((feature, index) => (
      <Box
        component="li"
        key={`${index}-${feature}`}
        sx={{
          display: 'flex',
          gap: 1.25,
          alignItems: 'flex-start',
          py: 1.1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: `${color}14`,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <CheckIcon sx={{ fontSize: 15, color }} />
        </Box>
        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
          {feature}
        </Typography>
      </Box>
    ))}
  </Box>
);
