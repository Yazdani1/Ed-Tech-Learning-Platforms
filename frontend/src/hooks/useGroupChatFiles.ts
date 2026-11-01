'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export interface PickedFile {
  /** Stable key for the list */
  id: string;
  file: File;
  /** Object URL for image previews (revoked when the file is removed or sent) */
  previewUrl: string | null;
}

export interface GroupChatFiles {
  items: PickedFile[];
  add: (files: FileList | null) => void;
  remove: (id: string) => void;
  clear: () => void;
}

interface Limits {
  maxFiles: number;
  maxBytes: number;
  maxMb: number;
}

const revoke = (items: PickedFile[]): void => {
  items.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
};

let nextId = 0;

/**
 * Files picked for the next group message. Checks the backend's limits up front (count and size) with a
 * toast; the backend still checks the real file type and answers with its own message.
 */
export const useGroupChatFiles = ({ maxFiles, maxBytes, maxMb }: Limits): GroupChatFiles => {
  const { t } = useTranslation();
  const [items, setItems] = useState<PickedFile[]>([]);
  const latest = useRef<PickedFile[]>([]);

  useEffect(() => {
    latest.current = items;
  }, [items]);
  useEffect(
    () => () => {
      revoke(latest.current);
    },
    [],
  );

  const add = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const picked = Array.from(files).filter((file) => {
        if (file.size <= maxBytes) return true;
        toast.error(t('groupChat.messages.fileTooLarge', { name: file.name, size: maxMb }));
        return false;
      });
      const room = Math.max(0, maxFiles - latest.current.length);
      if (picked.length > room)
        toast.error(t('groupChat.messages.tooManyFiles', { count: maxFiles }));
      const added = picked.slice(0, room).map((file) => {
        nextId += 1;
        return {
          id: `file-${nextId}`,
          file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        };
      });
      if (added.length > 0) setItems((current) => [...current, ...added]);
    },
    [maxBytes, maxFiles, maxMb, t],
  );

  const remove = useCallback((id: string) => {
    setItems((current) => {
      revoke(current.filter((item) => item.id === id));
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((current) => {
      revoke(current);
      return [];
    });
  }, []);

  return { items, add, remove, clear };
};
