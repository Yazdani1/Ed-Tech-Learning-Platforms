'use client';

import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';
import { isCloudinaryUrl } from '@/utils/urls';
import type { Profile } from '@/schemas/profile.schema';

import { AvatarPicker } from './AvatarPicker';
import { CommunityPrivacySwitch } from './CommunityPrivacySwitch';
import { ProfilePasswordFields } from './ProfilePasswordFields';
import { ROLE_COLORS } from './subscription.utils';
import { useProfileFieldError } from './useProfileFieldError';
import { useProfileForm } from './useProfileForm';

import type { FC } from 'react';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
}

/** Only a picked file (blob:) or a Cloudinary image is shown (the CSP allows nothing else). */
const safePreview = (url: string | undefined): string | undefined =>
  url?.startsWith('blob:') || isCloudinaryUrl(url) ? url : undefined;

/** Edit name, email (students), avatar, community privacy and password in one save. */
export const EditProfileModal: FC<EditProfileModalProps> = ({ profile, onClose }) => {
  const { t } = useTranslation();
  const { form, formError, avatar, onSubmit, isSaving } = useProfileForm(profile, onClose);
  const { register, control, formState } = form;
  const isStudent = profile.role === 'Student';
  const fieldError = useProfileFieldError();
  const preview = safePreview(avatar.preview);

  return (
    <AppModal
      open
      title={t('profile.editTitle')}
      onClose={onClose}
      onSave={onSubmit}
      saveLabel={t('profile.saveChanges')}
      saving={isSaving}
    >
      <AvatarPicker
        name={profile.name}
        color={ROLE_COLORS[profile.role]}
        preview={preview}
        canRemove={preview !== undefined}
        error={avatar.error}
        disabled={isSaving}
        onPick={avatar.pick}
        onRemove={avatar.remove}
      />
      <Stack spacing={2}>
        {formError && <Alert severity="error">{formError}</Alert>}
        <TextField
          {...register('name')}
          label={t('profile.name')}
          required
          fullWidth
          autoComplete="name"
          {...fieldError(formState.errors.name)}
        />
        <TextField
          {...register('email')}
          label={t('profile.email')}
          type="email"
          required
          fullWidth
          autoComplete="email"
          // Read-only (not disabled): a disabled input would drop the value from the form
          slotProps={{ htmlInput: { readOnly: !isStudent } }}
          helperText={t(isStudent ? 'profile.emailHelpStudent' : 'profile.emailHelpStaff')}
          {...fieldError(formState.errors.email)}
        />
        <CommunityPrivacySwitch control={control} />
        <Divider />
        <ProfilePasswordFields
          register={register}
          errors={formState.errors}
          fieldError={fieldError}
        />
      </Stack>
    </AppModal>
  );
};
