import { BYTES_PER_MB, IMAGE_ACCEPT } from '@/utils/image-files';
import { ADMIN_AREA_ROLES } from '@/utils/roles';
import { roleColor } from '@/utils/user-display';

import type { Channel, ChannelOrCard } from '@/schemas/group-chat.schema';
import type { UserRole } from '@/types';

export const HEADER_GRADIENT = 'linear-gradient(135deg, #0f766e 0%, #2563eb 52%, #7c3aed 100%)';
export const SENT_GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';

const DEFAULT_ROLE_COLOR = '#2563eb';

/** Same limits as the backend (upload.middleware uploadAnyFile): 10 files, 10 MB each. */
export const MAX_FILES = 10;
export const MAX_FILE_MB = 10;
export const MAX_FILE_BYTES = MAX_FILE_MB * BYTES_PER_MB;

/** File pickers: the kinds the backend accepts (it checks the real bytes anyway). */
export const ACCEPT_IMAGES = IMAGE_ACCEPT;
export const ACCEPT_PDF = 'application/pdf';
export const ACCEPT_FILES = [
  ACCEPT_IMAGES,
  ACCEPT_PDF,
  '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip',
  'audio/*,video/*',
  '.txt,.csv',
].join(',');

/** Role colour in group chat (unknown roles get the group chat blue). */
export const groupRoleColor = (role: string): string => roleColor(role, DEFAULT_ROLE_COLOR);

/** Super Admin, Admin and Moderator see and manage every channel. */
export const isPlatformAdmin = (role: UserRole | undefined): boolean =>
  role !== undefined && ADMIN_AREA_ROLES.includes(role);

export const isFullChannel = (channel: ChannelOrCard | null | undefined): channel is Channel =>
  channel?.kind === 'full';

export const isChannelMember = (
  channel: ChannelOrCard | null,
  userId: string | undefined,
): boolean =>
  isFullChannel(channel) && channel.members.some((member) => member.user._id === userId);

/** Channel admins (member role Admin) and platform staff manage members and requests. */
export const canManageChannel = (
  channel: ChannelOrCard | null,
  userId: string | undefined,
  role: UserRole | undefined,
): boolean =>
  isFullChannel(channel) &&
  (isPlatformAdmin(role) ||
    channel.members.some((member) => member.user._id === userId && member.role === 'Admin'));

export const memberCount = (channel: ChannelOrCard): number =>
  isFullChannel(channel) ? channel.members.length : channel.memberCount;

export const myUnread = (channel: Channel, userId: string | undefined): number =>
  channel.members.find((member) => member.user._id === userId)?.unreadCount ?? 0;

export const hasPendingRequest = (
  channel: ChannelOrCard | null,
  userId: string | undefined,
): boolean => {
  if (!channel) return false;
  if (!isFullChannel(channel)) return channel.hasPendingRequest;
  return channel.joinRequests.some(
    (request) => request.user._id === userId && request.status === 'Pending',
  );
};

export const pendingRequests = (channel: ChannelOrCard | null): Channel['joinRequests'] =>
  isFullChannel(channel)
    ? channel.joinRequests.filter((request) => request.status === 'Pending')
    : [];

export const isImageType = (mimeType: string): boolean => mimeType.startsWith('image/');
export const isPdfType = (mimeType: string): boolean => mimeType === 'application/pdf';
