'use client';

import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '@/api/query-keys';
import { useUpdateProfile } from '@/api/profile.api';
import { useToastResult } from '@/hooks/useToastResult';

import type { FC } from 'react';

interface PrivacyToggleProps {
  userId: string;
  isPrivate: boolean;
}

/** On your own profile: hide your details from other members (saved on your account). */
export const PrivacyToggle: FC<PrivacyToggleProps> = ({ userId, isPrivate }) => {
  const { t } = useTranslation();
  const update = useUpdateProfile();
  const queryClient = useQueryClient();
  const toastResult = useToastResult();

  const change = async (checked: boolean): Promise<void> => {
    const data = new FormData();
    data.append('isCommunityProfilePrivate', String(checked));
    const saved = update
      .mutateAsync(data)
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.community.profile(userId) }));
    await toastResult(
      saved,
      checked ? t('community.profile.nowPrivate') : t('community.profile.nowPublic'),
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: '100%', sm: 330 },
        p: 1.5,
        bgcolor: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.24)',
        color: 'common.white',
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.1, minWidth: 0 }}>
          <LockOutlinedIcon fontSize="small" aria-hidden />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              {t('community.profile.privateTitle')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              {t('community.profile.privateHint')}
            </Typography>
          </Box>
        </Stack>
        <Switch
          checked={isPrivate}
          disabled={update.isPending}
          onChange={(event) => void change(event.target.checked)}
          slotProps={{ input: { 'aria-label': t('community.profile.privateSwitch') } }}
          color="success"
        />
      </Stack>
    </Paper>
  );
};
