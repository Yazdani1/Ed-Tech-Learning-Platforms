'use client';

import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useImageFileCheck } from '@/hooks/useImageFileCheck';
import { IMAGE_ACCEPT } from '@/utils/image-files';

import { PromoDesignPreview } from './PromoDesignPreview';

import type { FC } from 'react';

interface PromoDesignSlotCardProps {
  title: string;
  hint: string;
  /** The saved picture ('' = the default design is used) */
  imageUrl: string;
  /** Preview shape, e.g. '8 / 1' for the banner, '3 / 4' for the pop-up */
  aspectRatio: string;
  maxPreviewWidth: number;
  busy: boolean;
  error?: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
}

const BUTTON_SX = { minHeight: 44 } as const;

/** One custom picture (banner or pop-up): preview, "Upload picture" and "Use default design". */
export const PromoDesignSlotCard: FC<PromoDesignSlotCardProps> = (props) => {
  const { t } = useTranslation();
  const check = useImageFileCheck(props.onFile);
  const message = check.problem ?? props.error;
  return (
    <Card variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, boxShadow: 1 }}>
      <Typography component="h2" sx={{ fontWeight: 700 }}>
        {props.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {props.hint}
      </Typography>
      <PromoDesignPreview
        title={props.title}
        imageUrl={props.imageUrl}
        aspectRatio={props.aspectRatio}
        maxWidth={props.maxPreviewWidth}
      />
      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<AddPhotoAlternateIcon />}
          disabled={props.busy}
          sx={BUTTON_SX}
        >
          {t(props.imageUrl ? 'promos.design.replace' : 'promos.design.upload')}
          <input
            hidden
            type="file"
            accept={IMAGE_ACCEPT}
            onChange={check.onChange}
            aria-label={props.title}
          />
        </Button>
        {props.imageUrl && (
          <Button
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={props.onRemove}
            disabled={props.busy}
            sx={BUTTON_SX}
          >
            {t('promos.design.useDefault')}
          </Button>
        )}
      </Box>
    </Card>
  );
};
