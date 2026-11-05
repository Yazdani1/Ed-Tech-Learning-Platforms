'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SafeHtml } from '@/components/common/SafeHtml';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC } from 'react';

interface FoldableHtmlProps {
  /** Rich text (sanitised by SafeHtml) */
  html: string;
  /** Id of the text box (the button controls it) */
  id: string;
  htmlSx: SxProps<Theme>;
}

/** Height of the folded text (a few lines) */
const FOLDED_HEIGHT = 168;
const FADE_HEIGHT = 64;

/**
 * Rich text that shows its first lines with a fade and "Show more" / "Show less", only when it really is taller
 * than those lines (measured, and measured again when the width changes).
 */
export const FoldableHtml: FC<FoldableHtmlProps> = ({ html, id, htmlSx }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tall, setTall] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return undefined;
    const measure = (): void => {
      setTall(text.scrollHeight > FOLDED_HEIGHT);
    };
    measure();
    // Every browser the site supports has it; test DOMs may not
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    return () => {
      observer.disconnect();
    };
  }, [html]);

  const folded = tall && !open;
  return (
    <>
      <Box
        id={id}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          maxHeight: folded ? FOLDED_HEIGHT : 'none',
          '&::after': folded
            ? {
                content: '""',
                position: 'absolute',
                inset: 'auto 0 0 0',
                height: FADE_HEIGHT,
                background: 'linear-gradient(rgba(255,255,255,0), #fff)',
              }
            : undefined,
        }}
      >
        <Box ref={textRef}>
          <SafeHtml html={html} sx={htmlSx} />
        </Box>
      </Box>
      {tall && (
        <Button
          onClick={() => {
            setOpen((value) => !value);
          }}
          aria-expanded={open}
          aria-controls={id}
          endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ mt: 1, minHeight: 44, px: 0.5, fontWeight: 700 }}
        >
          {open ? t('browse.detail.showLess') : t('browse.detail.showMore')}
        </Button>
      )}
    </>
  );
};
