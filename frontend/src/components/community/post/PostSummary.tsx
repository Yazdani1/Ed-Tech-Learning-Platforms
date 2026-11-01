'use client';

import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { htmlToPlainText } from '@/utils/html-text';

import type { FC } from 'react';

/** Characters of the description shown on the hub card. */
const EXCERPT_LENGTH = 220;

const excerpt = (html: string): string => {
  const text = htmlToPlainText(html);
  return text.length <= EXCERPT_LENGTH ? text : `${text.slice(0, EXCERPT_LENGTH).trim()}...`;
};

interface PostSummaryProps {
  titleId: string;
  title: string;
  description: string;
  href: string;
}

/** Title (link to the discussion) and the plain-text start of the description with "Read more". */
export const PostSummary: FC<PostSummaryProps> = ({ titleId, title, description, href }) => {
  const { t } = useTranslation();
  return (
    <>
      <Typography
        id={titleId}
        variant="h6"
        component="h3"
        sx={{ fontWeight: 800, lineHeight: 1.25 }}
      >
        <MuiLink component={Link} href={href} color="inherit" underline="hover">
          {title}
        </MuiLink>
      </Typography>
      <Typography color="text.secondary" sx={{ lineHeight: 1.7, wordBreak: 'break-word' }}>
        {excerpt(description)}{' '}
        <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>
          {t('community.post.readMore')}
        </Box>
      </Typography>
    </>
  );
};
