'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';

import { initial, REACTION_ICONS, safeImage } from './community-utils';

import type { Reaction } from '@/schemas/community.schema';
import type { FC } from 'react';

const emojiSx = { position: 'absolute', right: -4, bottom: -4, fontSize: 16 } as const;

interface ReactionListItemProps {
  reaction: Reaction;
}

/** One person in the reactions dialog: avatar with their emoji, name and reaction name. */
export const ReactionListItem: FC<ReactionListItemProps> = ({ reaction }) => {
  const { t } = useTranslation();
  const member = typeof reaction.user === 'object' ? reaction.user : null;
  return (
    <ListItem divider>
      <ListItemAvatar>
        <Box sx={{ position: 'relative', width: 44 }}>
          <Avatar src={safeImage(member?.avatar)} alt="" sx={{ width: 44, height: 44 }}>
            {initial(member?.name)}
          </Avatar>
          <Box component="span" aria-hidden sx={emojiSx}>
            {REACTION_ICONS[reaction.type]}
          </Box>
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={member?.name ?? t('community.author.unknown')}
        secondary={t(`community.reactions.${reaction.type}`)}
      />
    </ListItem>
  );
};
