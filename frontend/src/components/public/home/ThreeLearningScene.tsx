'use client';

import Box from '@mui/material/Box';
import { useEffect, useRef } from 'react';

import { startLearningScene } from './three-scene';

const SCENE_HEIGHT = { xs: 300, md: 420 } as const;

/** WebGL needs a browser: loaded with next/dynamic (ssr: false) by EcosystemBand. Decorative only. */
const ThreeLearningScene = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    return startLearningScene(mount);
  }, []);

  return (
    <Box
      ref={mountRef}
      aria-hidden
      sx={{
        width: '100%',
        height: SCENE_HEIGHT,
        position: 'relative',
        '& canvas': { display: 'block', width: '100%', height: '100%' },
      }}
    />
  );
};

export default ThreeLearningScene;
