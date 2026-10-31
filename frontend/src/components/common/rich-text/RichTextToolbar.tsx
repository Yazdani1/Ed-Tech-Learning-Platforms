'use client';

import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import type { Editor } from '@tiptap/react';
import type { RichTextFeatures } from './rich-text.types';
import type { FC, ReactNode } from 'react';

interface RichTextToolbarProps {
  editor: Editor;
  features: RichTextFeatures;
}

type Chain = ReturnType<Editor['chain']>;

interface ToolbarAction {
  key: string;
  icon: ReactNode;
  /** Arguments of editor.isActive() */
  active: [string] | [string, Record<string, unknown>] | [Record<string, unknown>];
  run: (chain: Chain) => Chain;
}

const headingIcon = (label: string): ReactNode => (
  <Box component="span" sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1, px: 0.5 }}>
    {label}
  </Box>
);

const small = 'small';

/** Buttons only the 'full' editor has. */
const FULL_ONLY = new Set(['heading2', 'heading3', 'alignLeft', 'alignCenter', 'alignRight']);

const TOOLBAR_GROUPS: ToolbarAction[][] = [
  [
    {
      key: 'bold',
      icon: <FormatBoldIcon fontSize={small} />,
      active: ['bold'],
      run: (c) => c.toggleBold(),
    },
    {
      key: 'italic',
      icon: <FormatItalicIcon fontSize={small} />,
      active: ['italic'],
      run: (c) => c.toggleItalic(),
    },
    {
      key: 'underline',
      icon: <FormatUnderlinedIcon fontSize={small} />,
      active: ['underline'],
      run: (c) => c.toggleUnderline(),
    },
  ],
  [
    {
      key: 'heading2',
      icon: headingIcon('H2'),
      active: ['heading', { level: 2 }],
      run: (c) => c.toggleHeading({ level: 2 }),
    },
    {
      key: 'heading3',
      icon: headingIcon('H3'),
      active: ['heading', { level: 3 }],
      run: (c) => c.toggleHeading({ level: 3 }),
    },
  ],
  [
    {
      key: 'bulletList',
      icon: <FormatListBulletedIcon fontSize={small} />,
      active: ['bulletList'],
      run: (c) => c.toggleBulletList(),
    },
    {
      key: 'orderedList',
      icon: <FormatListNumberedIcon fontSize={small} />,
      active: ['orderedList'],
      run: (c) => c.toggleOrderedList(),
    },
  ],
  [
    {
      key: 'alignLeft',
      icon: <FormatAlignLeftIcon fontSize={small} />,
      active: [{ textAlign: 'left' }],
      run: (c) => c.setTextAlign('left'),
    },
    {
      key: 'alignCenter',
      icon: <FormatAlignCenterIcon fontSize={small} />,
      active: [{ textAlign: 'center' }],
      run: (c) => c.setTextAlign('center'),
    },
    {
      key: 'alignRight',
      icon: <FormatAlignRightIcon fontSize={small} />,
      active: [{ textAlign: 'right' }],
      run: (c) => c.setTextAlign('right'),
    },
  ],
];

const isActive = (editor: Editor, args: ToolbarAction['active']): boolean =>
  args.length === 2
    ? editor.isActive(args[0], args[1])
    : typeof args[0] === 'string'
      ? editor.isActive(args[0])
      : editor.isActive(args[0]);

/** The formatting buttons of the rich text editor ('basic' leaves out headings and alignment). */
export const RichTextToolbar: FC<RichTextToolbarProps> = ({ editor, features }) => {
  const { t } = useTranslation();
  const groups = TOOLBAR_GROUPS.map((group) =>
    group.filter((action) => features === 'full' || !FULL_ONLY.has(action.key)),
  ).filter((group) => group.length > 0);
  return (
    <Box
      role="toolbar"
      aria-label={t('catalog.richText.toolbar')}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 0.5,
        py: 0.5,
        bgcolor: 'grey.50',
        flexWrap: 'wrap',
      }}
    >
      {groups.map((group, index) => (
        <Fragment key={group[0]?.key ?? index}>
          {index > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}
          {group.map((action) => {
            const label = t(`catalog.richText.${action.key}`);
            const active = isActive(editor, action.active);
            return (
              <Tooltip key={action.key} title={label}>
                <IconButton
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => {
                    action.run(editor.chain().focus()).run();
                  }}
                  color={active ? 'primary' : 'default'}
                  sx={{ borderRadius: 1, width: 44, height: 44 }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            );
          })}
        </Fragment>
      ))}
    </Box>
  );
};
