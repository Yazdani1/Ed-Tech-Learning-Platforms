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
  SOCIAL_FIELDS,
  type CompanyContact,
  type CompanyContactForm as ContactValues,
} from '@/schemas/site-settings.schema';

import type { FC } from 'react';

interface CompanyContactFormProps {
  contact: CompanyContact;
}

const ADDRESS_ROWS = 3;
/** Every field, in form order, with its input type */
const INPUT_TYPES = {
  phone: 'tel',
  whatsapp: 'tel',
  email: 'email',
  address: 'text',
  facebook: 'url',
  youtube: 'url',
  linkedin: 'url',
  instagram: 'url',
} as const satisfies Record<keyof ContactValues, string>;
const FIELDS = ['phone', 'whatsapp', 'email', 'address', ...SOCIAL_FIELDS] as const;

/** The contact form (phones, email, address, social links); empty fields clear the saved value. */
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
            type={INPUT_TYPES[field]}
            label={t(`showcase.contact.${field}`)}
            placeholder={INPUT_TYPES[field] === 'url' ? 'https://' : undefined}
            fullWidth
            multiline={field === 'address'}
            rows={field === 'address' ? ADDRESS_ROWS : undefined}
            {...fieldError(errors[field])}
          />
        ))}
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
