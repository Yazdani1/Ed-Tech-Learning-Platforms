'use client';

import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { CommunityOverview } from '@/schemas/community.schema';
import type { FC } from 'react';

interface HubStatsProps {
  overview: CommunityOverview;
}

/** Guest notice (signed out) and the "N Total Members · N Discussion Questions · N Answers" bar under the hero. */
export const HubStats: FC<HubStatsProps> = ({ overview }) => {
  const { t, i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language);
  const items = [
    { key: 'members', value: overview.totalMemberCount, Icon: GroupsOutlinedIcon },
    { key: 'questions', value: overview.totalPostCount, Icon: ForumOutlinedIcon },
    { key: 'answers', value: overview.totalReplyCount, Icon: QuestionAnswerOutlinedIcon },
  ] as const;

  return (
    <>
      {overview.guestLimited && <Alert severity="info">{t('community.guestNotice')}</Alert>}
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', px: { xs: 2, md: 3 }, py: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ gap: { xs: 1.5, sm: 3 }, justifyContent: 'space-between', flexWrap: 'wrap' }}
        >
          {items.map(({ key, value, Icon }) => (
            <Stack key={key} direction="row" sx={{ alignItems: 'center', gap: 1.1 }}>
              <Icon sx={{ fontSize: 28 }} aria-hidden />
              <Typography sx={{ fontWeight: 800 }}>
                {t(`community.stats.${key}`, { value: format.format(value) })}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </>
  );
};
