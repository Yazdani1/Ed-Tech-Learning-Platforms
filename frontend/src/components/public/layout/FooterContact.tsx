'use client';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useSiteSettings } from '@/api/site-settings.api';
import { DISPLAY_FONT } from '@/theme/fonts';
import { mailtoHref } from '@/utils/urls';

/** Heading of a footer column */
export const FOOTER_HEADING_SX = {
  fontFamily: DISPLAY_FONT,
  fontWeight: 700,
  fontSize: '1.05rem',
  mb: 1.5,
} as const;
/** One line of a footer column (touch-friendly height) */
export const FOOTER_LINE_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minHeight: 44,
  overflowWrap: 'anywhere',
  color: 'inherit',
} as const;

/** The footer's contact column (Company Contact page); hidden while nothing is saved. */
export const FooterContact = () => {
  const { t } = useTranslation();
  const contact = useSiteSettings().data?.contact;
  if (!contact || (!contact.phone && !contact.email && !contact.address)) return null;
  return (
    <Box>
      <Typography component="h2" sx={FOOTER_HEADING_SX}>
        {t('public.footer.contact')}
      </Typography>
      {contact.phone && (
        <MuiLink
          href={`tel:${contact.phone.replace(/[\s-]/g, '')}`}
          variant="body2"
          underline="hover"
          sx={FOOTER_LINE_SX}
        >
          <PhoneOutlinedIcon fontSize="small" aria-hidden />
          {contact.phone}
        </MuiLink>
      )}
      {contact.email && (
        <MuiLink
          href={mailtoHref(contact.email)}
          variant="body2"
          underline="hover"
          sx={FOOTER_LINE_SX}
        >
          <EmailOutlinedIcon fontSize="small" aria-hidden />
          {contact.email}
        </MuiLink>
      )}
      {contact.address && (
        <Typography variant="body2" sx={FOOTER_LINE_SX}>
          <PlaceOutlinedIcon fontSize="small" aria-hidden />
          {contact.address}
        </Typography>
      )}
    </Box>
  );
};
