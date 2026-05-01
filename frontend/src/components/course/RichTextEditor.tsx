import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { type ReactNode } from 'react';
import { Box, IconButton, Divider, Tooltip, Paper } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';

interface ToolbarBtnProps {
	onClick: () => void;
	active?: boolean;
	title: string;
	children: ReactNode;
}

function ToolbarBtn({ onClick, active, title, children }: ToolbarBtnProps) {
	return (
		<Tooltip title={title}>
			<IconButton
				size='small'
				onClick={onClick}
				color={active ? 'primary' : 'default'}
				sx={{ borderRadius: 1 }}
			>
				{children}
			</IconButton>
		</Tooltip>
	);
}

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	minHeight?: number;
}

export default function RichTextEditor({
	value,
	onChange,
	placeholder = 'Write something...',
	minHeight = 200,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			Placeholder.configure({ placeholder }),
		],
		content: value,
		onUpdate: ({ editor: e }) => onChange(e.getHTML()),
	});

	if (!editor) return null;

	return (
		<Paper variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
			{/* Toolbar */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 0.5,
					px: 1,
					py: 0.5,
					bgcolor: 'grey.50',
					flexWrap: 'wrap',
				}}
			>
				<ToolbarBtn
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive('bold')}
					title='Bold'
				>
					<FormatBoldIcon fontSize='small' />
				</ToolbarBtn>
				<ToolbarBtn
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive('italic')}
					title='Italic'
				>
					<FormatItalicIcon fontSize='small' />
				</ToolbarBtn>
				<ToolbarBtn
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					active={editor.isActive('underline')}
					title='Underline'
				>
					<FormatUnderlinedIcon fontSize='small' />
				</ToolbarBtn>

				<Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

				<ToolbarBtn
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					active={editor.isActive('heading', { level: 2 })}
					title='Heading 2'
				>
					<Box sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1, px: 0.5 }}>
						H2
					</Box>
				</ToolbarBtn>
				<ToolbarBtn
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					active={editor.isActive('heading', { level: 3 })}
					title='Heading 3'
				>
					<Box sx={{ fontWeight: 700, fontSize: 12, lineHeight: 1, px: 0.5 }}>
						H3
					</Box>
				</ToolbarBtn>

				<Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

				<ToolbarBtn
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive('bulletList')}
					title='Bullet List'
				>
					<FormatListBulletedIcon fontSize='small' />
				</ToolbarBtn>
				<ToolbarBtn
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive('orderedList')}
					title='Numbered List'
				>
					<FormatListNumberedIcon fontSize='small' />
				</ToolbarBtn>

				<Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

				<ToolbarBtn
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					active={editor.isActive({ textAlign: 'left' })}
					title='Align Left'
				>
					<FormatAlignLeftIcon fontSize='small' />
				</ToolbarBtn>
				<ToolbarBtn
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					active={editor.isActive({ textAlign: 'center' })}
					title='Align Center'
				>
					<FormatAlignCenterIcon fontSize='small' />
				</ToolbarBtn>
				<ToolbarBtn
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
					active={editor.isActive({ textAlign: 'right' })}
					title='Align Right'
				>
					<FormatAlignRightIcon fontSize='small' />
				</ToolbarBtn>
			</Box>

			<Divider />

			{/* Content */}
			<Box
				sx={{
					minHeight,
					px: 2,
					py: 1,
					'& .tiptap': { outline: 'none', minHeight },
					'& .tiptap p.is-editor-empty:first-child::before': {
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
}
