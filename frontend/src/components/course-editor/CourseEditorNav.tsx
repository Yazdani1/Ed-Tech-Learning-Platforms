'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import { alpha, useTheme, type Theme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';

import { formatTime } from '@/utils/dateTime';

import { EDITOR_TABS, panelId, tabId, type EditorTab } from './editor-tabs';

import type { TFunction } from 'i18next';
import type { FC } from 'react';

interface CourseEditorNavProps {
  tab: EditorTab;
  onChange: (tab: EditorTab) => void;
  /** Existing course: shows the auto-save state */
  showSaveState: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
}

const NAV_TOP = 90;
const DESKTOP_INDICATOR_SX = { left: 0, right: 'auto', width: 4, borderRadius: 2 } as const;
const MOBILE_INDICATOR_SX = { height: 3 } as const;
/** The open item: tinted background, bold primary text (plus the bar on its left on desktop) */
const TAB_SX = {
  minHeight: 44,
  alignItems: { md: 'flex-start' },
  borderRadius: { md: 1 },
  textTransform: 'none',
  fontWeight: 500,
  '&.Mui-selected': {
    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.12),
    color: 'primary.main',
    fontWeight: 700,
  },
  '&:hover': { bgcolor: 'action.hover' },
} as const;

/** "Saving…", "Saved at 10:32" or "Auto-save is on". */
const saveStateText = (
  t: TFunction,
  language: string,
  isAutoSaving: boolean,
  lastSaved: Date | null,
): string => {
  if (isAutoSaving) return t('catalog.editor.autoSaving');
  if (lastSaved) return t('catalog.editor.lastSaved', { time: formatTime(lastSaved, language) });
  return t('catalog.editor.autoSaveOn');
};

/** The editor menu: vertical on desktop (sticky), a scrollable tab bar on phones; plus the auto-save state. */
export const CourseEditorNav: FC<CourseEditorNavProps> = ({
  tab,
  onChange,
  showSaveState,
  isAutoSaving,
  lastSaved,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const saveState = saveStateText(t, i18n.language, isAutoSaving, lastSaved);

  return (
    <Paper
      variant="outlined"
      sx={{ position: { md: 'sticky' }, top: NAV_TOP, p: { xs: 0, md: 2 }, borderRadius: 1 }}
    >
      <Typography
        variant="subtitle1"
        component="h2"
        sx={{ fontWeight: 700, mb: 1, display: { xs: 'none', md: 'block' } }}
      >
        {t('catalog.editor.menuTitle')}
      </Typography>
      <Tabs
        value={tab}
        onChange={(_event, value: EditorTab) => {
          onChange(value);
        }}
        orientation={isDesktop ? 'vertical' : 'horizontal'}
        variant="scrollable"
        scrollButtons="auto"
        aria-label={t('catalog.editor.menuTitle')}
        // Desktop: the bar of the open item sits on its left edge
        slotProps={{ indicator: { sx: isDesktop ? DESKTOP_INDICATOR_SX : MOBILE_INDICATOR_SX } }}
      >
        {EDITOR_TABS.map((item) => (
          <Tab
            key={item}
            value={item}
            id={tabId(item)}
            aria-controls={panelId(item)}
            label={t(`catalog.tabs.${item}`)}
            sx={TAB_SX}
          />
        ))}
      </Tabs>
      {showSaveState && (
        <Box
          role="status"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: { xs: 2, md: 0 }, py: 1 }}
        >
          {isAutoSaving && <CircularProgress size={14} />}
          <Typography variant="caption">{saveState}</Typography>
        </Box>
      )}
    </Paper>
  );
};
