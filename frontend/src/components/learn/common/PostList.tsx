'use client';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SafeHtml } from '@/components/common/SafeHtml';
import { isSafeHttpUrl } from '@/utils/urls';

import { useLearnPermissions } from '../useLearnPermissions';

import { PostCard } from './PostCard';

import type { StudyMaterial } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface PostListProps {
  /** Announcements or study materials (a material may carry a resource link) */
  items: StudyMaterial[];
  onEdit: (item: StudyMaterial) => void;
  onDelete: (item: StudyMaterial) => void;
}

/** Announcements / study materials: poster, title, sanitised text, optional http(s) link, edit/delete menu. */
export const PostList: FC<PostListProps> = ({ items, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <PostCard
          key={item._id}
          title={item.title}
          postedBy={item.postedBy}
          createdAt={item.createdAt}
          userId={permissions.userId}
          canManage={permissions.canPostContent && permissions.canManage(item.postedBy)}
          onEdit={() => {
            onEdit(item);
          }}
          onDelete={() => {
            onDelete(item);
          }}
        >
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            {item.title}
          </Typography>
          <SafeHtml html={item.description} sx={{ fontSize: '0.875rem', lineHeight: 1.6 }} />
          {isSafeHttpUrl(item.fileUrl) && (
            <Link
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
            >
              {t('learn.materials.open')}
            </Link>
          )}
        </PostCard>
      ))}
    </Stack>
  );
};
