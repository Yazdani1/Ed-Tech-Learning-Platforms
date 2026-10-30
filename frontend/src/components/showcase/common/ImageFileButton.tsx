'use client';

import Button from '@mui/material/Button';

import { IMAGE_ACCEPT } from '../image-files';

import type { SxProps, Theme } from '@mui/material/styles';
import type { ChangeEvent, FC, ReactNode } from 'react';

type FlatSx = Exclude<SxProps<Theme>, readonly unknown[]>;

interface ImageFileButtonProps {
  children: ReactNode;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  startIcon?: ReactNode;
  disabled?: boolean;
  /** Extra styles (an object or a theme function, not an array) */
  sx?: FlatSx;
}

/** A button that opens the file picker for PNG/JPEG/GIF/WEBP images. */
export const ImageFileButton: FC<ImageFileButtonProps> = ({
  children,
  onFiles,
  multiple = false,
  startIcon,
  disabled = false,
  sx,
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFiles(Array.from(event.target.files ?? []));
    // Picking the same file again must fire a change event too
    event.target.value = '';
  };

  return (
    <Button
      component="label"
      variant="outlined"
      startIcon={startIcon}
      disabled={disabled}
      sx={[{ minHeight: 44, fontWeight: 800 }, sx ?? false]}
    >
      {children}
      <input hidden type="file" accept={IMAGE_ACCEPT} multiple={multiple} onChange={handleChange} />
    </Button>
  );
};
