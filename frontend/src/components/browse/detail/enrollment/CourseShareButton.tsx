'use client';

import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import Button from '@mui/material/Button';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CourseShareButtonProps {
  title: string;
}

/** Shares the course page: the phone's share sheet where there is one, otherwise copies the address. */
export const CourseShareButton: FC<CourseShareButtonProps> = ({ title }) => {
  const { t } = useTranslation();

  const share = async (): Promise<void> => {
    const url = window.location.href;
    // Desktop browsers may have no share sheet, although the DOM types always declare one
    const { share: nativeShare } = navigator as Partial<Pick<Navigator, 'share'>>;
    if (nativeShare) {
      // Closing the share sheet rejects the promise; that is not an error to show
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url).then(
      () => toast.success(t('browse.enroll.linkCopied')),
      () => toast.error(t('browse.enroll.copyFailed')),
    );
  };

  return (
    <Button
      startIcon={<ShareOutlinedIcon />}
      onClick={() => void share()}
      sx={{ minHeight: 44, color: 'text.secondary', fontWeight: 500, px: 0.5 }}
    >
      {t('browse.enroll.share')}
    </Button>
  );
};
