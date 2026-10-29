import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import type { FC } from 'react';

interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  href: string;
}

/** "Don't have an account? Create an account" line under the auth forms. */
export const AuthSwitchLink: FC<AuthSwitchLinkProps> = ({ question, linkText, href }) => (
  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2.5 }}>
    {question}{' '}
    <MuiLink component={Link} href={href} sx={{ fontWeight: 800, textDecoration: 'none' }}>
      {linkText}
    </MuiLink>
  </Typography>
);
