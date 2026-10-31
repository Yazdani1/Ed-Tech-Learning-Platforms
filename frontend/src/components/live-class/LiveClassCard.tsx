'use client';

import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { EditDeleteMenu } from '@/components/common/EditDeleteMenu';
import { PostedByLine } from '@/components/common/PostedByLine';
import { SafeHtml } from '@/components/common/SafeHtml';

import { weekTitle } from './live-class.utils';
import { LiveClassCardHeader } from './LiveClassCardHeader';
import { LiveClassLectureList } from './LiveClassLectureList';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface LiveClassCardProps {
  week: LiveClassWeek;
  /** 1-based position ("Week 1") */
  number: number;
  /** The signed-in user's id (their own weeks get a "You" badge) */
  userId: string;
  /** Edit, delete and "Add Class" are shown */
  canManage: boolean;
  onEdit: (week: LiveClassWeek) => void;
  onDelete: (week: LiveClassWeek) => void;
  onAddClass: (week: LiveClassWeek) => void;
}

const CARD_SX = { p: { xs: 1.5, sm: 2.5 }, borderRadius: 1, listStyle: 'none' } as const;

/** One live class week: header, poster, description, its classes and "Add Class". */
export const LiveClassCard: FC<LiveClassCardProps> = ({
  week,
  number,
  userId,
  canManage,
  onEdit,
  onDelete,
  onAddClass,
}) => {
  const { t } = useTranslation();
  const name = weekTitle(week) ?? t('catalog.liveClass.weekN', { n: number });
  const menu = canManage ? (
    <EditDeleteMenu
      label={t('catalog.liveClass.actionsFor', { name })}
      onEdit={() => {
        onEdit(week);
      }}
      onDelete={() => {
        onDelete(week);
      }}
    />
  ) : undefined;

  return (
    <Paper component="li" variant="outlined" aria-label={name} sx={CARD_SX}>
      <LiveClassCardHeader week={week} number={number} name={name} menu={menu} />
      {week.postedBy && (
        <PostedByLine postedBy={week.postedBy} createdAt={week.createdAt} userId={userId} />
      )}
      {week.description && (
        <SafeHtml html={week.description} sx={{ fontSize: '0.875rem', mb: 2 }} />
      )}
      <LiveClassLectureList lectures={week.lectures} />
      {canManage && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            onAddClass(week);
          }}
          sx={{ mt: 1.5, minHeight: 44 }}
        >
          {t('catalog.liveClass.addClass')}
        </Button>
      )}
    </Paper>
  );
};
