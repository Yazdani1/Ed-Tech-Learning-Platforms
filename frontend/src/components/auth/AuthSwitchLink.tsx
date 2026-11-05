'use client';

import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { authSwitchHref } from '@/utils/safe-redirect';

import type { FC } from 'react';

interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  href: string;
}

/** "Don't have an account? Create an account" line under the auth forms; keeps a safe ?next=. */
export const AuthSwitchLink: FC<AuthSwitchLinkProps> = ({ question, linkText, href }) => {
  const searchParams = useSearchParams();
  return (
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2.5 }}>
      {question}{' '}
      <MuiLink
        component={Link}
        href={authSwitchHref(href, searchParams.get('next'))}
        sx={{ fontWeight: 800, textDecoration: 'none' }}
      >
        {linkText}
      </MuiLink>
    </Typography>
  );
};
