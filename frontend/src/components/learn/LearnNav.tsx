'use client';

import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import { useTheme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';

import type { LearnTab } from './learn-tabs';
import type { FC, ReactElement } from 'react';

interface LearnNavProps {
  tabs: LearnTab[];
  value: LearnTab;
  onChange: (tab: LearnTab) => void;
}

const ICONS: Record<LearnTab, ReactElement> = {
  overview: <InfoOutlinedIcon fontSize="small" />,
  lectures: <PlayCircleOutlinedIcon fontSize="small" />,
  live: <EventNoteOutlinedIcon fontSize="small" />,
  teacher: <PersonOutlinedIcon fontSize="small" />,
  announcements: <CampaignOutlinedIcon fontSize="small" />,
  materials: <MenuBookOutlinedIcon fontSize="small" />,
  students: <PeopleOutlinedIcon fontSize="small" />,
  qa: <QuestionAnswerOutlinedIcon fontSize="small" />,
  quiz: <QuizOutlinedIcon fontSize="small" />,
};

/** The player's section menu: a vertical list on desktop, a swipeable tab strip on phones and tablets. */
export const LearnNav: FC<LearnNavProps> = ({ tabs, value, onChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  return (
    <Tabs
      value={value}
      onChange={(_event, next: LearnTab) => {
        onChange(next);
      }}
      orientation={isDesktop ? 'vertical' : 'horizontal'}
      variant="scrollable"
      scrollButtons={isDesktop ? false : 'auto'}
      allowScrollButtonsMobile
      aria-label={t('learn.nav.label')}
      sx={{
        '& .MuiTab-root': {
          minHeight: 48,
          justifyContent: isDesktop ? 'flex-start' : 'center',
          textTransform: 'none',
          fontSize: '0.85rem',
          px: 2,
        },
        '& .Mui-selected': { fontWeight: 700 },
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          icon={ICONS[tab]}
          iconPosition="start"
          label={t(`learn.nav.${tab}`)}
        />
      ))}
    </Tabs>
  );
};
