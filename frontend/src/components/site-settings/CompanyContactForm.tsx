'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateCompanyContact } from '@/api/site-settings.api';
import { useFieldError } from '@/hooks/useFieldError';
import {
  companyContactFormSchema,
  type CompanyContact,
  type CompanyContactForm as ContactValues,
} from '@/schemas/site-settings.schema';

import type { FC } from 'react';

interface CompanyContactFormProps {
  contact: CompanyContact;
}

const ADDRESS_ROWS = 3;
const FIELDS = ['phone', 'whatsapp', 'email'] as const;

/** The contact form; empty fields clear the saved value. */
export const CompanyContactForm: FC<CompanyContactFormProps> = ({ contact }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const save = useUpdateCompanyContact();
  const form = useForm<ContactValues>({
    resolver: zodResolver(companyContactFormSchema),
    defaultValues: contact,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    save.mutate(values, {
      onSuccess: (settings) => {
        form.reset(settings.contact);
        toast.success(t('showcase.contact.saved'));
      },
    });
  });

  return (
    <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 720 }}>
      <Stack component="form" noValidate spacing={2} onSubmit={(event) => void onSubmit(event)}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        {FIELDS.map((field) => (
          <TextField
            key={field}
            {...form.register(field)}
            type={field === 'email' ? 'email' : 'tel'}
            label={t(`showcase.contact.${field}`)}
            fullWidth
            {...fieldError(errors[field])}
          />
        ))}
        <TextField
          {...form.register('address')}
          label={t('showcase.contact.address')}
          fullWidth
          multiline
          rows={ADDRESS_ROWS}
          {...fieldError(errors.address)}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={save.isPending}
          sx={{ alignSelf: 'flex-start', minHeight: 44 }}
        >
          {t('common.save')}
        </Button>
      </Stack>
    </Card>
  );
};
