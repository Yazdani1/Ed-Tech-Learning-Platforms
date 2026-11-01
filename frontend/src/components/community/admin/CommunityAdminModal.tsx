'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import { BadgesSection } from './BadgesSection';
import { ChannelsSection } from './ChannelsSection';
import { HeaderSettingsSection } from './HeaderSettingsSection';
import { PointRulesSection } from './PointRulesSection';

import type { FC } from 'react';

const SECTIONS = ['header', 'channels', 'badges', 'points'] as const;
type Section = (typeof SECTIONS)[number];

interface CommunityAdminModalProps {
  onClose: () => void;
}

/** "Community Settings" (Super Admin, Admin): header, channels, badges and point rules. */
export const CommunityAdminModal: FC<CommunityAdminModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>('header');

  return (
    <AppModal open title={t('community.admin.title')} onClose={onClose} maxWidth="lg" hideActions>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' },
          gap: 3,
          minHeight: { md: 520 },
        }}
      >
        <List
          component="nav"
          aria-label={t('community.admin.sectionsLabel')}
          sx={{
            display: { xs: 'flex', md: 'block' },
            flexWrap: 'wrap',
            gap: 0.5,
            alignSelf: 'start',
          }}
        >
          {SECTIONS.map((key) => (
            <ListItemButton
              key={key}
              selected={section === key}
              aria-current={section === key ? 'true' : undefined}
              onClick={() => {
                setSection(key);
              }}
              sx={{ borderRadius: 1, minHeight: 44, flex: { xs: '1 1 40%', md: 'none' } }}
            >
              <ListItemText primary={t(`community.admin.sections.${key}`)} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ minWidth: 0 }}>
          {section === 'header' && <HeaderSettingsSection />}
          {section === 'channels' && <ChannelsSection />}
          {section === 'badges' && <BadgesSection />}
          {section === 'points' && <PointRulesSection />}
        </Box>
      </Box>
    </AppModal>
  );
};
