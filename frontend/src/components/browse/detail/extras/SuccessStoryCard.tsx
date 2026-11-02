import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { CloudImage } from '@/components/common/CloudImage';

import type { SuccessStory } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface SuccessStoryCardProps {
  story: SuccessStory;
}

const PHOTO_SIZE = 56;
const LOGO_SX = { height: 24, width: 96 } as const;
const COMPANY_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  pt: 1,
  borderTop: 1,
  borderColor: 'divider',
} as const;

/** One success story: photo and title, the story, then the company logo and name. */
export const SuccessStoryCard: FC<SuccessStoryCardProps> = ({ story }) => (
  <Paper
    component="li"
    variant="outlined"
    sx={{ p: 2.5, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar src={story.photo?.url} alt="" sx={{ width: PHOTO_SIZE, height: PHOTO_SIZE }} />
      <Typography component="h3" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
        {story.title}
      </Typography>
    </Box>
    {story.description && (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', flex: 1 }}>
        {story.description}
      </Typography>
    )}
    {(story.companyName !== '' || story.companyLogo !== null) && (
      <Box sx={COMPANY_SX}>
        {story.companyLogo && (
          <CloudImage url={story.companyLogo.url} alt="" sizes="96px" fit="contain" sx={LOGO_SX} />
        )}
        {story.companyName && (
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {story.companyName}
          </Typography>
        )}
      </Box>
    )}
  </Paper>
);
