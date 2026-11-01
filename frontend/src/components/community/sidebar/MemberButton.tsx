'use client';

import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import { useState, type ReactNode } from 'react';

import { initial, safeImage } from '../common/community-utils';
import { ProfilePreviewPopover } from '../common/ProfilePreviewPopover';

import type { CommunityAuthor } from '@/schemas/community.schema';
import type { FC } from 'react';

interface MemberButtonProps {
  member: CommunityAuthor;
  /** Accessible name (e.g. the member's name and answer count) */
  label: string;
  /** Wraps the avatar (e.g. the green "online" dot) */
  decorate?: (avatar: ReactNode) => ReactNode;
  children?: ReactNode;
}

/** A member's avatar (and optional text) that opens their profile preview. */
export const MemberButton: FC<MemberButtonProps> = ({ member, label, decorate, children }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const avatar = (
    <Avatar src={safeImage(member.avatar)} alt="" sx={{ width: 38, height: 38 }}>
      {initial(member.name)}
    </Avatar>
  );
  return (
    <>
      <ButtonBase
        aria-label={label}
        onClick={(event) => {
          setAnchor(event.currentTarget);
        }}
        sx={{
          gap: 1.25,
          justifyContent: 'flex-start',
          width: '100%',
          minHeight: 44,
          py: 0.5,
          borderRadius: 1,
          textAlign: 'left',
        }}
      >
        {decorate ? decorate(avatar) : avatar}
        {children}
      </ButtonBase>
      <ProfilePreviewPopover
        anchorEl={anchor}
        userId={member._id}
        onClose={() => {
          setAnchor(null);
        }}
      />
    </>
  );
};
