'use client';

import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { isSafeHttpUrl } from '@/utils/urls';

import type { TeacherProfile } from '@/schemas/public.schema';
import type { FC, ReactElement } from 'react';

interface TeacherSocialLinksProps {
  teacher: TeacherProfile;
}

const NETWORKS: {
  key: 'twitter' | 'linkedin' | 'website' | 'youtube';
  icon: ReactElement;
  color: string;
}[] = [
  { key: 'twitter', icon: <TwitterIcon fontSize="small" />, color: '#1DA1F2' },
  { key: 'linkedin', icon: <LinkedInIcon fontSize="small" />, color: '#0A66C2' },
  { key: 'website', icon: <LanguageIcon fontSize="small" />, color: '#10b981' },
  { key: 'youtube', icon: <YouTubeIcon fontSize="small" />, color: '#ff0000' },
];

/** The teacher's social links (only plain http(s) addresses), opened in a new tab. */
export const TeacherSocialLinks: FC<TeacherSocialLinksProps> = ({ teacher }) => {
  const { t } = useTranslation();
  const links = NETWORKS.flatMap((network) => {
    const href = teacher.socialLinks?.[network.key];
    return isSafeHttpUrl(href) ? [{ ...network, href }] : [];
  });
  if (links.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2.5, justifyContent: 'center' }}>
      {links.map((link) => {
        const network = t(`public.instructors.${link.key}`);
        return (
          <Tooltip key={link.key} title={network}>
            <IconButton
              component="a"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('public.instructors.socialLink', { name: teacher.name, network })}
              sx={{ width: 44, height: 44, color: link.color, bgcolor: `${link.color}1a` }}
            >
              {link.icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Stack>
  );
};
