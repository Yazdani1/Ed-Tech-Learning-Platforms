'use client';

import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useSiteSettings } from '@/api/site-settings.api';
import { localizeDigits } from '@/utils/price';

import { PaymentTrustCard } from './PaymentTrustCard';

/** Three promises under the payment form: encryption, the company phone (when saved), course access. */
export const PaymentTrustCards = () => {
  const { t, i18n } = useTranslation();
  const phone = useSiteSettings().data?.contact.phone;
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: '1fr',
        gridAutoFlow: { md: 'column' },
        gridAutoColumns: { md: 'minmax(0, 1fr)' },
      }}
    >
      <PaymentTrustCard
        icon={<GppGoodOutlinedIcon sx={{ color: '#047857' }} />}
        tile="#d1fae5"
        title={t('payment.trust.sslTitle')}
        text={t('payment.trust.sslText')}
      />
      {phone && (
        <PaymentTrustCard
          icon={<PhoneOutlinedIcon sx={{ color: '#1d4ed8' }} />}
          tile="#dbeafe"
          title={t('payment.trust.callTitle', { phone: localizeDigits(phone, i18n.language) })}
          text={t('payment.trust.callText')}
        />
      )}
      <PaymentTrustCard
        icon={<RocketLaunchOutlinedIcon sx={{ color: '#4338ca' }} />}
        tile="#eef2ff"
        title={t('payment.trust.accessTitle')}
        text={t('payment.trust.accessText')}
      />
    </Box>
  );
};
