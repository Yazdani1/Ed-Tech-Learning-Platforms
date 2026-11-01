import Avatar from '@mui/material/Avatar';

import { cloudinaryImage, nameInitial } from '@/utils/user-display';

import type { FC } from 'react';

interface UserAvatarProps {
  name: string | null | undefined;
  /** Shown only when it is a Cloudinary picture; otherwise the first letter of the name */
  avatar?: string | null;
  /** Width and height in px (MUI's default 40 px when left out) */
  size?: number;
  /** Background behind the letter, e.g. roleColor(role) */
  color?: string;
}

const FONT_RATIO = 0.42;

/** A person's round picture, or the first letter of their name when there is no (allowed) picture. */
export const UserAvatar: FC<UserAvatarProps> = ({ name, avatar, size, color }) => (
  <Avatar
    src={cloudinaryImage(avatar)}
    alt=""
    sx={{
      bgcolor: color,
      fontWeight: 700,
      flexShrink: 0,
      ...(size !== undefined && {
        width: size,
        height: size,
        fontSize: Math.round(size * FONT_RATIO),
      }),
    }}
  >
    {nameInitial(name)}
  </Avatar>
);
