'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha, type Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import { useReactToReply } from '@/api/community.api';
import { SafeHtml } from '@/components/common/SafeHtml';
import { toastError } from '@/utils/toast-error';

import { AuthorLine } from '../common/AuthorLine';
import { ImageGallery } from '../common/ImageGallery';
import { ReactionBar } from '../common/ReactionBar';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { ReplyActions } from './ReplyActions';
import { ReplyThread } from './ReplyThread';

import type { CommunityBadge, Reply } from '@/schemas/community.schema';
import type { FC } from 'react';

/** Background strength of an accepted answer. */
const ACCEPTED_TINT = 0.08;

interface ReplyItemProps {
  reply: Reply;
  postId: string;
  isPostAuthor: boolean;
  badges: CommunityBadge[];
}

/** One answer: author, Accept/Delete, text (sanitised), pictures, reactions and its replies. */
export const ReplyItem: FC<ReplyItemProps> = ({ reply, postId, isPostAuthor, badges }) => {
  const { t } = useTranslation();
  const { user } = useCommunityPermissions();
  const react = useReactToReply(postId);
  const label = t('community.reply.replyBy', {
    name: reply.author?.name ?? t('community.author.unknown'),
  });
  const itemSx = {
    listStyle: 'none',
    p: 1.5,
    borderRadius: 1,
    bgcolor: (theme: Theme) =>
      reply.isAccepted ? alpha(theme.palette.success.main, ACCEPTED_TINT) : 'transparent',
  };

  return (
    <Box component="li" aria-label={label} sx={itemSx}>
      <Stack spacing={1}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}
        >
          <AuthorLine author={reply.author} badges={badges} />
          <ReplyActions reply={reply} isPostAuthor={isPostAuthor} />
        </Stack>
        {reply.isAccepted && (
          <Chip
            label={t('community.reply.acceptedAnswer')}
            color="success"
            size="small"
            sx={{ alignSelf: 'flex-start', fontWeight: 800 }}
          />
        )}
        <SafeHtml html={reply.body} sx={{ typography: 'body2', '& ul, & ol': { pl: 3 } }} />
        <ImageGallery images={reply.images} title={label} />
        <ReplyThread
          reply={reply}
          badges={badges}
          reactions={
            <ReactionBar
              reactions={reply.reactions}
              disabled={!user}
              currentUserId={user?._id}
              busy={react.isPending}
              onReact={(type) => {
                react.mutate({ id: reply._id, type }, { onError: toastError });
              }}
            />
          }
        />
      </Stack>
    </Box>
  );
};
