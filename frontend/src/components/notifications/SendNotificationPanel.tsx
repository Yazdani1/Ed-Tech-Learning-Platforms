'use client';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCreateNotification } from '@/api/notifications.api';

import { BLANK_NOTIFICATION, useNotificationForm } from './notification-form';
import { NotificationFormFields } from './NotificationFormFields';

const FORM_MAX_WIDTH = 760;

/** "Send Push Notification" (Super Admin, Admin): sends to every user of the chosen roles. */
export const SendNotificationPanel = () => {
  const { t } = useTranslation();
  const form = useNotificationForm();
  const create = useCreateNotification();

  const onSubmit = form.handleSubmit(async (body) => {
    await create.mutateAsync(body).then(
      (message) => {
        toast.success(message ?? t('messaging.notifications.sentToast'));
        form.reset(BLANK_NOTIFICATION);
      },
      () => undefined,
    );
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SendOutlinedIcon color="primary" />
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t('messaging.notifications.sendTitle')}
        </Typography>
      </Box>
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        sx={{ maxWidth: FORM_MAX_WIDTH, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {create.error && <Alert severity="error">{create.error.message}</Alert>}
        <NotificationFormFields form={form} />
        <Button
          type="submit"
          variant="contained"
          disabled={create.isPending}
          startIcon={
            create.isPending ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />
          }
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minHeight: 44, fontWeight: 800 }}
        >
          {t('messaging.notifications.send')}
        </Button>
      </Box>
    </Paper>
  );
};
