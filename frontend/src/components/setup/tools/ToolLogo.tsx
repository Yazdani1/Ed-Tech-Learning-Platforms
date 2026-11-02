import Box from '@mui/material/Box';
import Image from 'next/image';

import { isCloudinaryUrl } from '@/utils/urls';

import type { FC } from 'react';

interface ToolLogoProps {
  tool: { name: string; logoUrl: string };
  size: number;
  /** The name is shown next to the logo: the picture needs no text of its own */
  decorative?: boolean;
}

/** A tool's logo, centred in a square (Cloudinary images only, like every uploaded picture). */
export const ToolLogo: FC<ToolLogoProps> = ({ tool, size, decorative = false }) => (
  <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
    {isCloudinaryUrl(tool.logoUrl) && (
      <Image
        src={tool.logoUrl}
        alt={decorative ? '' : tool.name}
        fill
        sizes={`${size}px`}
        style={{ objectFit: 'contain' }}
      />
    )}
  </Box>
);
