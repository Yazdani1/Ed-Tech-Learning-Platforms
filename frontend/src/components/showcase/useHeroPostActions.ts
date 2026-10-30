'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteHeroPost, useReorderHeroPosts, useUpdateHeroPost } from '@/api/showcase.api';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import { moveId } from './hero-schedule';

import type { HeroPost } from '@/schemas/showcase.schema';
import type { ApiError } from '@/services/http.service';

export interface HeroPostActions {
  /** Move the post at `from` to `to` (drag and drop, Move Up / Move Down) */
  move: (from: number, to: number) => void;
  toggleVisibility: (post: HeroPost) => void;
  remove: (post: HeroPost, position: number) => Promise<void>;
}

/** The quick actions of the slider list; every failure shows the backend's message. */
export const useHeroPostActions = (posts: HeroPost[]): HeroPostActions => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const reorder = useReorderHeroPosts();
  const update = useUpdateHeroPost();
  const deletePost = useDeleteHeroPost();
  const onError = (error: ApiError): void => {
    toast.error(error.message);
  };

  const move = (from: number, to: number): void => {
    if (from === to || to < 0 || to >= posts.length) return;
    const orderedIds = moveId(
      posts.map((post) => post._id),
      from,
      to,
    );
    reorder.mutate(orderedIds, {
      onSuccess: () => toast.success(t('showcase.posts.reordered')),
      onError,
    });
  };

  const toggleVisibility = (post: HeroPost): void => {
    const data = new FormData();
    data.append('visibility', post.visibility === 'Public' ? 'Private' : 'Public');
    data.append('order', String(post.order));
    // An empty date clears any pending schedule: the change applies now
    data.append('publishAt', '');
    update.mutate(
      { id: post._id, data },
      { onSuccess: () => toast.success(t('showcase.posts.updated')), onError },
    );
  };

  const remove = async (post: HeroPost, position: number): Promise<void> => {
    if (!(await confirmDelete(t('showcase.posts.deleteName', { position })))) return;
    deletePost.mutate(post._id, {
      onSuccess: () => toast.success(t('showcase.posts.deleted')),
      onError,
    });
  };

  return { move, toggleVisibility, remove };
};
