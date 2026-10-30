'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';

import { ActionMenu, type ActionMenuItem } from '@/components/common/ActionMenu';

import type { HeroPostActions } from './useHeroPostActions';
import type { HeroPost } from '@/schemas/showcase.schema';
import type { TFunction } from 'i18next';
import type { FC } from 'react';

export interface HeroPostMenuProps {
  post: HeroPost;
  /** 1-based place in the slider */
  position: number;
  total: number;
  actions: HeroPostActions;
  onView: (post: HeroPost) => void;
  onEdit: (post: HeroPost) => void;
}

/** Move Up / Move Down (disabled at the ends of the list). */
const moveItems = (
  { position, total, actions }: HeroPostMenuProps,
  t: TFunction,
): ActionMenuItem[] => {
  const index = position - 1;
  return [
    {
      label: t('showcase.posts.moveUp'),
      icon: <ArrowUpwardIcon fontSize="small" />,
      disabled: index === 0,
      onClick: () => {
        actions.move(index, index - 1);
      },
    },
    {
      label: t('showcase.posts.moveDown'),
      icon: <ArrowDownwardIcon fontSize="small" />,
      disabled: index === total - 1,
      onClick: () => {
        actions.move(index, index + 1);
      },
    },
  ];
};

const menuItems = (props: HeroPostMenuProps, t: TFunction): ActionMenuItem[] => {
  const { post, position, actions, onView, onEdit } = props;
  const isPublic = post.visibility === 'Public';
  return [
    {
      label: t('showcase.posts.viewDetails'),
      icon: <InfoOutlinedIcon fontSize="small" />,
      onClick: () => {
        onView(post);
      },
    },
    {
      label: t('common.edit'),
      icon: <EditIcon fontSize="small" />,
      onClick: () => {
        onEdit(post);
      },
    },
    {
      label: isPublic ? t('showcase.posts.makePrivate') : t('showcase.posts.makePublic'),
      icon: isPublic ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />,
      onClick: () => {
        actions.toggleVisibility(post);
      },
    },
    ...moveItems(props, t),
    {
      label: t('common.delete'),
      icon: <DeleteIcon fontSize="small" />,
      danger: true,
      onClick: () => void actions.remove(post, position),
    },
  ];
};

/** The "⋮" menu of a slider image: details, edit, show/hide, move up/down, delete. */
export const HeroPostMenu: FC<HeroPostMenuProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ActionMenu
      label={t('showcase.posts.actionsFor', { position: props.position })}
      items={menuItems(props, t)}
    />
  );
};
