'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

import { RichTextToolbar } from './RichTextToolbar';

import type { RichTextEditorProps } from './rich-text.types';
import type { FC } from 'react';

const DEFAULT_MIN_HEIGHT = 120;

/**
 * The one TipTap rich text editor (course editor, course player forms, bulk announcement). It emits '' when
 * empty; the HTML it writes is always shown through SafeHtml (sanitised). Load it with LazyRichTextEditor.
 */
const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = '',
  minHeight = DEFAULT_MIN_HEIGHT,
  error = false,
  features = 'full',
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: { attributes: { 'aria-label': label, 'aria-multiline': 'true', role: 'textbox' } },
    onUpdate: ({ editor: current }) => {
      onChange(current.isEmpty ? '' : current.getHTML());
    },
  });

  // A value changed from outside (e.g. the form was reset) replaces the content without an update event
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if (current !== value) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 0.5, overflow: 'hidden', borderColor: error ? 'error.main' : undefined }}
    >
      <RichTextToolbar editor={editor} features={features} />
      <Divider />
      <Box
        sx={{
          px: 2,
          py: 1,
          '& .tiptap': { outline: 'none', minHeight },
          '& .tiptap p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            float: 'left',
            color: 'text.disabled',
            pointerEvents: 'none',
            height: 0,
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Paper>
  );
};

export default RichTextEditor;
