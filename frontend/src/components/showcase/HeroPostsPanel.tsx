'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useHeroPosts } from '@/api/showcase.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { ShowcasePanel } from './common/ShowcasePanel';
import { sortPosts } from './hero-schedule';
import { HeroPostDetailsModal } from './HeroPostDetailsModal';
import { HeroPostFormModal } from './HeroPostFormModal';
import { useHeroPostActions } from './useHeroPostActions';

import type { HeroPost } from '@/schemas/showcase.schema';

const LIST_SKELETON_HEIGHT = 120;

// Drag and drop needs the browser: loaded on the client only, after the page shell
const HeroPostSortableList = dynamic(
  () => import('./HeroPostSortableList').then((module) => module.HeroPostSortableList),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={LIST_SKELETON_HEIGHT} /> },
);

/** The homepage slider images: upload, list in order (drag to reorder), view, edit, delete. */
export const HeroPostsPanel = () => {
  const { t } = useTranslation();
  const query = useHeroPosts();
  const posts = useMemo(() => sortPosts(query.data ?? []), [query.data]);
  const actions = useHeroPostActions(posts);
  const formModal = useModal<HeroPost>();
  const detailsModal = useModal<HeroPost>();

  return (
    <ShowcasePanel
      title={t('showcase.posts.title')}
      hint={t('showcase.posts.hint')}
      action={
        <Button
          variant="contained"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => {
            formModal.openModal();
          }}
          sx={{ fontWeight: 800, flexShrink: 0, minHeight: 44 }}
        >
          {t('showcase.posts.upload')}
        </Button>
      }
    >
      <Box sx={{ p: 2 }}>
        <QueryState
          isLoading={query.isLoading}
          error={query.error}
          isEmpty={posts.length === 0}
          onRetry={() => void query.refetch()}
          emptyText={t('showcase.posts.empty')}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('showcase.posts.dragHint')}
          </Typography>
          <HeroPostSortableList
            posts={posts}
            actions={actions}
            onView={detailsModal.openModal}
            onEdit={formModal.openModal}
          />
        </QueryState>
      </Box>
      <HeroPostFormModal
        open={formModal.open}
        post={formModal.data}
        postCount={posts.length}
        onClose={formModal.closeModal}
      />
      <HeroPostDetailsModal
        open={detailsModal.open}
        post={detailsModal.data}
        onClose={detailsModal.closeModal}
      />
    </ShowcasePanel>
  );
};
