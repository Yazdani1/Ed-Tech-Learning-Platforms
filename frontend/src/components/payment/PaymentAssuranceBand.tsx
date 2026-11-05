'use client';

import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import { useTranslation } from 'react-i18next';

import { useSiteSettings } from '@/api/site-settings.api';
import { mailtoHref } from '@/utils/urls';

import { PaymentAssuranceItem } from './PaymentAssuranceItem';

/** The grey band at the bottom of the payment page: encryption, the guarantee, and where to ask questions. */
export const PaymentAssuranceBand = () => {
  const { t } = useTranslation();
  const email = useSiteSettings().data?.contact.email;
  return (
    <Box sx={{ bgcolor: '#eceff3', py: { xs: 3, md: 4 } }}>
      <Container
        maxWidth="lg"
        sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}
      >
        <PaymentAssuranceItem
          icon={<GppGoodOutlinedIcon sx={{ color: '#047857' }} />}
          title={t('payment.band.sslTitle')}
        >
          {t('payment.band.sslText')}
        </PaymentAssuranceItem>
        <PaymentAssuranceItem
          icon={<MilitaryTechOutlinedIcon sx={{ color: '#1d4ed8' }} />}
          title={t('payment.band.guaranteeTitle')}
        >
          {t('payment.band.guaranteeText')}
        </PaymentAssuranceItem>
        <PaymentAssuranceItem
          icon={<SupportAgentIcon sx={{ color: '#334155' }} />}
          title={t('payment.band.supportTitle')}
        >
          {t('payment.band.supportText')}
          {email && (
            <>
              {' '}
              <Link href={mailtoHref(email)}>{email}</Link>
            </>
          )}
        </PaymentAssuranceItem>
      </Container>
    </Box>
  );
};
