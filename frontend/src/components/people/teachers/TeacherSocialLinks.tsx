import LinkIcon from '@mui/icons-material/Link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { safeSocialLinks } from './teacher-utils';

import type { AdminTeacher } from '@/schemas/public.schema';
import type { FC } from 'react';

interface TeacherSocialLinksProps {
  teacher: AdminTeacher;
}

/** The teacher's social links (only real http(s) links), opened in a new tab. */
export const TeacherSocialLinks: FC<TeacherSocialLinksProps> = ({ teacher }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
    {safeSocialLinks(teacher).map(([label, url]) => (
      <Button
        key={label}
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        variant="outlined"
        startIcon={<LinkIcon />}
        sx={{ textTransform: 'capitalize', minHeight: 44 }}
      >
        {label}
      </Button>
    ))}
  </Box>
);
