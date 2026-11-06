'use client';

import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { useAuthPanel } from '@/hooks/useAuthPanel';

import type { AuthMode } from '@/utils/auth-drawer';
import type { FC } from 'react';

interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  /** The other form of the panel */
  mode: AuthMode;
}

/** "Don't have an account? Create an account" under the auth forms: switches the panel, keeps ?next=. */
export const AuthSwitchLink: FC<AuthSwitchLinkProps> = ({ question, linkText, mode }) => {
  const panel = useAuthPanel();
  return (
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2.5 }}>
      {question}{' '}
      <MuiLink
        component="button"
        type="button"
        onClick={() => {
          panel.open(mode);
        }}
        sx={{ fontWeight: 800, textDecoration: 'none', verticalAlign: 'baseline', minHeight: 44 }}
      >
        {linkText}
      </MuiLink>
    </Typography>
  );
};
