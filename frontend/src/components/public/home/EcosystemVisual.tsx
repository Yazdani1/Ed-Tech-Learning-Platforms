'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { GLASS } from './glass';

const SCENE_HEIGHT = { xs: 300, md: 420 } as const;
const STEP_KEYS = ['learn', 'practice', 'showcase'] as const;
const STEPS_SX = {
  position: 'absolute',
  left: 18,
  right: 18,
  bottom: 18,
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
  gap: 1,
} as const;

// Three.js is heavy and needs WebGL: loaded only in the browser, after the rest of the page
const ThreeLearningScene = dynamic(() => import('./ThreeLearningScene'), {
  ssr: false,
  loading: () => <Box sx={{ width: '100%', height: SCENE_HEIGHT }} />,
});

/** The 3D scene with "Learn / Practice / Showcase" labels over its bottom edge. */
export const EcosystemVisual = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ position: 'relative', minHeight: { xs: 320, md: 440 } }}>
      <ThreeLearningScene />
      <Box sx={STEPS_SX}>
        {STEP_KEYS.map((key) => (
          <Box
            key={key}
            sx={{ ...GLASS, backdropFilter: 'blur(8px)', borderRadius: 1, px: 1.5, py: 1 }}
          >
            <Typography sx={{ fontWeight: 800 }}>{t(`public.ecosystem.${key}`)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
