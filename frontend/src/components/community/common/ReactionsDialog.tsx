'use client';

import List from '@mui/material/List';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { formatCount, REACTION_ICONS, reactionSummary, reactionUserId } from './community-utils';
import { ReactionListItem } from './ReactionListItem';

import type { Reaction, ReactionType } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ReactionsDialogProps {
  open: boolean;
  reactions: Reaction[];
  onClose: () => void;
}

/** Who reacted, with a tab per reaction type ("All" first). */
export const ReactionsDialog: FC<ReactionsDialogProps> = ({ open, reactions, onClose }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ReactionType | 'All'>('All');
  const shown = selected === 'All' ? reactions : reactions.filter((item) => item.type === selected);

  return (
    <AppModal
      open={open}
      title={t('community.reactions.dialogTitle')}
      onClose={onClose}
      hideActions
    >
      <Tabs
        value={selected}
        onChange={(_event, value: ReactionType | 'All') => {
          setSelected(value);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label={t('community.reactions.dialogTitle')}
      >
        <Tab
          value="All"
          label={t('community.reactions.all', { value: formatCount(reactions.length) })}
        />
        {reactionSummary(reactions).map((item) => (
          <Tab
            key={item.type}
            value={item.type}
            aria-label={`${t(`community.reactions.${item.type}`)} ${item.count}`}
            label={`${REACTION_ICONS[item.type]} ${formatCount(item.count)}`}
          />
        ))}
      </Tabs>
      <List>
        {shown.map((reaction, index) => (
          <ReactionListItem
            key={`${reactionUserId(reaction) ?? index}-${reaction.type}`}
            reaction={reaction}
          />
        ))}
      </List>
    </AppModal>
  );
};
