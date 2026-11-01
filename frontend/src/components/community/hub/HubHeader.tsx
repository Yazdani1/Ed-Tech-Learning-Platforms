'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import { HubSearchForm } from './HubSearchForm';

import type { CommunitySettings } from '@/schemas/community.schema';
import type { FC } from 'react';

const OVERLAY = 'linear-gradient(90deg, rgba(8, 20, 38, 0.72), rgba(8, 20, 38, 0.48))';
/** Without a header picture the old page's dark blue look is kept with a plain gradient. */
const FALLBACK_BACKGROUND = 'linear-gradient(135deg, #0f2747 0%, #1565c0 55%, #0f766e 100%)';
const titleSx = { fontWeight: 900, mb: 1, fontSize: { xs: 32, md: 52 }, lineHeight: 1.1 };
const innerSx = {
  maxWidth: 980,
  mx: 'auto',
  py: { xs: 5, md: 7 },
  alignItems: 'center',
  textAlign: 'center',
  width: '100%',
} as const;

interface HubHeaderProps {
  settings: CommunitySettings | null;
  search: string;
  onSearch: (search: string) => void;
}

/** Hero of the hub: title, description and the background picture set by admins, plus the search box. */
export const HubHeader: FC<HubHeaderProps> = ({ settings, search, onSearch }) => {
  const { t } = useTranslation();
  const image = settings?.headerImageUrl;
  const background = isCloudinaryUrl(image) ? `${OVERLAY}, url("${image}")` : FALLBACK_BACKGROUND;
  const title = settings && settings.title !== '' ? settings.title : t('community.title');
  const description =
    settings && settings.description !== ''
      ? settings.description
      : t('community.defaultDescription');

  return (
    <Box
      sx={{
        minHeight: { xs: 280, md: 390 },
        display: 'flex',
        alignItems: 'center',
        backgroundImage: background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'common.white',
        px: 2,
      }}
    >
      <Stack spacing={3} sx={innerSx}>
        <Box sx={{ maxWidth: 860 }}>
          <Typography variant="h3" component="h1" sx={titleSx}>
            {title}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: { xs: 16, md: 19 } }}>
            {description}
          </Typography>
        </Box>
        <HubSearchForm key={search} search={search} onSearch={onSearch} />
      </Stack>
    </Box>
  );
};
