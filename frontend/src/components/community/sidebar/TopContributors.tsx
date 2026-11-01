'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatCount } from '../common/community-utils';

import { MemberButton } from './MemberButton';
import { SidebarEmpty } from './SidebarEmpty';

import type { HubWidgets } from '@/schemas/community.schema';
import type { FC } from 'react';

interface TopContributorsProps {
  contributors: HubWidgets['topContributors'];
}

/** Members with the most answers; each opens their profile preview. */
export const TopContributors: FC<TopContributorsProps> = ({ contributors }) => {
  const { t } = useTranslation();
  if (contributors.length === 0)
    return <SidebarEmpty text={t('community.sidebar.noContributors')} />;
  return (
    <Stack divider={<Divider />}>
      {contributors.map((item) => {
        const answers = t('community.sidebar.answersCount', {
          value: formatCount(item.answerCount),
        });
        return (
          <MemberButton
            key={item.user._id}
            member={item.user}
            label={`${item.user.name}, ${answers}`}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                {item.user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {answers}
              </Typography>
            </Box>
          </MemberButton>
        );
      })}
    </Stack>
  );
};
