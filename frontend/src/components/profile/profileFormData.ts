import type { Profile, ProfileFormValues } from '@/schemas/profile.schema';

export interface AvatarChange {
  file: File | null;
  remove: boolean;
}

/**
 * The multipart body for PUT /api/auth/me with only what changed (null: nothing changed).
 * The current password goes along when the password or (students only) the email changes.
 */
export const buildProfileFormData = (
  profile: Profile,
  values: ProfileFormValues,
  avatar: AvatarChange,
): FormData | null => {
  const body = new FormData();
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();
  const emailChanged = profile.role === 'Student' && email !== profile.email.toLowerCase();
  const passwordChanged = values.newPassword !== '';

  if (name !== profile.name) body.append('name', name);
  if (emailChanged) body.append('email', email);
  if (avatar.file) body.append('avatar', avatar.file);
  else if (avatar.remove && profile.avatar) body.append('removeAvatar', 'true');
  if (values.isCommunityProfilePrivate !== profile.isCommunityProfilePrivate) {
    body.append('isCommunityProfilePrivate', String(values.isCommunityProfilePrivate));
  }
  if (passwordChanged) body.append('newPassword', values.newPassword);
  if (passwordChanged || emailChanged) body.append('currentPassword', values.currentPassword);

  return [...body.keys()].length > 0 ? body : null;
};

/** The form's starting values for this profile. */
export const profileFormDefaults = (profile: Profile): ProfileFormValues => ({
  name: profile.name,
  email: profile.email,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  isCommunityProfilePrivate: profile.isCommunityProfilePrivate,
});
