'use client';

import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { initial, safeImage } from './community-utils';
import { EarnedBadgeChips } from './EarnedBadgeChips';
import { ProfilePreviewPopover } from './ProfilePreviewPopover';

import type { CommunityAuthor, CommunityBadge } from '@/schemas/community.schema';
import type { FC } from 'react';

const nameSx = {
  fontWeight: 800,
  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
};
const avatarSx = { width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 };

interface AuthorLineProps {
  author: CommunityAuthor | null;
  badges: CommunityBadge[];
}

/** Avatar, name (opens the profile preview), role, points and up to three earned badges. */
export const AuthorLine: FC<AuthorLineProps> = ({ author, badges }) => {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const name = author?.name ?? t('community.author.unknown');

  return (
    <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      <ButtonBase
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        disabled={!author}
        aria-label={t('community.author.openProfile', { name })}
        sx={{ borderRadius: 1, gap: 1, minHeight: 44, px: 0.25 }}
      >
        <Avatar src={safeImage(author?.avatar)} alt="" sx={avatarSx}>
          {initial(author?.name)}
        </Avatar>
        <Typography component="span" variant="body2" sx={nameSx}>
          {name}
        </Typography>
      </ButtonBase>
      {author && (
        <>
          <Chip label={author.role} size="small" variant="outlined" />
          <Typography variant="caption" color="text.secondary">
            {t('community.author.points', { count: author.communityPoints ?? 0 })}
          </Typography>
          <EarnedBadgeChips points={author.communityPoints} badges={badges} />
        </>
      )}
      <ProfilePreviewPopover
        anchorEl={anchor}
        userId={author?._id}
        onClose={() => {
          setAnchor(null);
        }}
      />
    </Stack>
  );
};
