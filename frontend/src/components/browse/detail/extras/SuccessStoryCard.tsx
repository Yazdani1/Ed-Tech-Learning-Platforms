import CodeIcon from '@mui/icons-material/Code';
import TerminalIcon from '@mui/icons-material/Terminal';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { CloudImage } from '@/components/common/CloudImage';

import { CARD_RADIUS, pickByIndex, SOFT_BG, SOFT_BORDER } from '../detail-styles';

import type { SuccessStory } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface SuccessStoryCardProps {
  story: SuccessStory;
  /** Position in the list: picks the colours of the card */
  index: number;
}

const PHOTO_SIZE = 80;
const LOGO_SIZE = 24;
const ICON_SIZE = 36;
const LOOKS = [
  {
    avatarBg: '#0f172a',
    icon: <CodeIcon sx={{ color: '#22d3ee', fontSize: ICON_SIZE }} aria-hidden />,
    role: '#2563eb',
  },
  {
    avatarBg: '#052e2b',
    icon: <TerminalIcon sx={{ color: '#34d399', fontSize: ICON_SIZE }} aria-hidden />,
    role: '#047857',
  },
] as const;
const CARD_SX = {
  p: { xs: 2.5, sm: 3.5 },
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  bgcolor: SOFT_BG,
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: CARD_RADIUS,
} as const;
const COMPANY_SX = {
  mt: 'auto',
  pt: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 1.5,
  borderTop: `1px solid ${SOFT_BORDER}`,
} as const;
const LOGO_TILE_SX = {
  width: 42,
  height: 42,
  display: 'grid',
  placeItems: 'center',
  bgcolor: 'common.white',
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: '10px',
} as const;

/** One success story: photo, name and what they do now, then the company name and logo at the bottom right. */
export const SuccessStoryCard: FC<SuccessStoryCardProps> = ({ story, index }) => {
  const look = pickByIndex(LOOKS, index);
  return (
    <Box component="li" sx={CARD_SX}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Avatar
          src={story.photo?.url}
          alt=""
          sx={{ width: PHOTO_SIZE, height: PHOTO_SIZE, bgcolor: look.avatarBg }}
        >
          {look.icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h3"
            sx={{ fontWeight: 600, fontSize: '1.2rem', overflowWrap: 'anywhere' }}
          >
            {story.title}
          </Typography>
          {story.description && (
            <Typography sx={{ color: look.role, whiteSpace: 'pre-line', mt: 0.25 }}>
              {story.description}
            </Typography>
          )}
        </Box>
      </Box>
      {(story.companyName !== '' || story.companyLogo !== null) && (
        <Box sx={COMPANY_SX}>
          {story.companyName && (
            <Typography sx={{ fontWeight: 700 }}>{story.companyName}</Typography>
          )}
          {story.companyLogo && (
            <Box sx={LOGO_TILE_SX}>
              <CloudImage
                url={story.companyLogo.url}
                alt=""
                sizes={`${LOGO_SIZE}px`}
                fit="contain"
                sx={{ width: LOGO_SIZE, height: LOGO_SIZE }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
