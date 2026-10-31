// TipTap needs a real browser layout: in component tests a plain textarea stands in for the rich text editor.
import type { RichTextEditorProps } from '@/components/common/rich-text/rich-text.types';
import type { ChangeEvent, FC } from 'react';

export const FakeRichTextEditor: FC<RichTextEditorProps> = ({ value, onChange, label }) => (
  <textarea
    aria-label={label}
    value={value}
    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    }}
  />
);
