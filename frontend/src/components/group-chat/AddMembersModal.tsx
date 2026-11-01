'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { USER_SEARCH_MIN_LENGTH, useAddMembers, useGroupUserSearch } from '@/api/group-chat.api';
import { AppModal } from '@/components/common/AppModal';
import { SearchField } from '@/components/common/SearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToastResult } from '@/hooks/useToastResult';

import { UserSearchList } from './UserSearchList';

import type { Channel } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface AddMembersModalProps {
  channel: Channel;
  onClose: () => void;
}

const toggleId = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];

/** Search users by name and add the selected ones to the channel (emails are shown to staff only). */
export const AddMembersModal: FC<AddMembersModalProps> = ({ channel, onClose }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const term = useDebouncedValue(search).trim();
  const users = useGroupUserSearch(term);
  const add = useAddMembers();
  const toastResult = useToastResult();
  const count = selectedIds.length;
  const searched = term.length >= USER_SEARCH_MIN_LENGTH && users.isSuccess;

  const save = (): void => {
    void toastResult(
      add.mutateAsync({ channelId: channel._id, userIds: selectedIds }),
      t('groupChat.toast.membersAdded'),
    ).then((saved) => {
      if (saved) onClose();
    });
  };

  return (
    <AppModal
      open
      title={t('groupChat.addMembers')}
      onClose={onClose}
      onSave={save}
      saveLabel={t(`groupChat.addMembersModal.${count > 0 ? 'addSelectedCount' : 'addSelected'}`, {
        count,
      })}
      saving={add.isPending}
      saveDisabled={count === 0}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <SearchField
          value={search}
          onChange={setSearch}
          loading={users.isFetching}
          autoFocus
          showLabel
          type="text"
          size="medium"
          label={t('groupChat.addMembersModal.search')}
          helperText={t('groupChat.addMembersModal.searchHint')}
        />
        {users.error && <Alert severity="error">{users.error.message}</Alert>}
        <UserSearchList
          users={users.data ?? []}
          memberIds={new Set(channel.members.map((member) => member.user._id))}
          selectedIds={selectedIds}
          showEmpty={searched && users.data.length === 0}
          onToggle={(userId) => {
            setSelectedIds((current) => toggleId(current, userId));
          }}
        />
      </Stack>
    </AppModal>
  );
};
