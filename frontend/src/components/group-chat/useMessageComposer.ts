'use client';

import { useState, type KeyboardEvent } from 'react';

import { useSendGroupMessage } from '@/api/group-chat.api';
import { useGroupChatFiles, type GroupChatFiles } from '@/hooks/useGroupChatFiles';
import { useTypingEmitter } from '@/hooks/useTypingEmitter';
import { toastError } from '@/utils/toast-error';

import { MAX_FILE_BYTES, MAX_FILE_MB, MAX_FILES } from './group-chat-utils';

export interface MessageComposerState {
  text: string;
  changeText: (value: string) => void;
  files: GroupChatFiles;
  canSend: boolean;
  sending: boolean;
  submit: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Text + files of the next message: tells the channel while I type (stops after a pause, on send and on unmount), sends them as
 * multipart and clears the box on success; a failure (e.g. a file type the backend refuses) is a toast.
 */
export const useMessageComposer = (
  channelId: string,
  onTyping: (isTyping: boolean) => void,
): MessageComposerState => {
  const [text, setText] = useState('');
  const files = useGroupChatFiles({
    maxFiles: MAX_FILES,
    maxBytes: MAX_FILE_BYTES,
    maxMb: MAX_FILE_MB,
  });
  const send = useSendGroupMessage();
  const typing = useTypingEmitter(onTyping);
  const canSend = !send.isPending && (text.trim() !== '' || files.items.length > 0);

  const changeText = (value: string): void => {
    setText(value);
    typing.typed(value);
  };

  const submit = (): void => {
    if (!canSend) return;
    const data = new FormData();
    data.append('content', text.trim());
    files.items.forEach((item) => {
      data.append('files', item.file);
    });
    send
      .mutateAsync({ channelId, data })
      .then(() => {
        setText('');
        files.clear();
        typing.stop();
      })
      .catch(toastError);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return { text, changeText, files, canSend, sending: send.isPending, submit, onKeyDown };
};
