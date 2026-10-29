import { useEffect, useState, type FC } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box, IconButton, Stack, Typography } from '@mui/material';

interface SelectedChatFilePreviewProps {
	file: File;
	onRemove: () => void;
}

const SelectedChatFilePreview: FC<SelectedChatFilePreviewProps> = ({ file, onRemove }) => {
	const [previewUrl, setPreviewUrl] = useState('');
	const imageFile = file.type.startsWith('image/');

	useEffect(() => {
		if (!imageFile) return;
		const nextUrl = URL.createObjectURL(file);
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPreviewUrl(nextUrl);
		return () => URL.revokeObjectURL(nextUrl);
	}, [file, imageFile]);

	return (
		<Box
			sx={{
				position: 'relative',
				width: imageFile ? 86 : 'auto',
				minWidth: imageFile ? 86 : 120,
				height: 72,
				borderRadius: 1,
				overflow: 'hidden',
				border: '1px solid',
				borderColor: 'divider',
				bgcolor: '#f8fafc',
			}}
		>
			{imageFile ? (
				<Box component="img" src={previewUrl} alt={file.name} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
			) : (
				<Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', px: 1 }}>
					{file.type === 'application/pdf' ? <DescriptionIcon color="error" /> : <InsertDriveFileIcon color="success" />}
					<Typography variant="caption" noWrap sx={{ maxWidth: 104 }}>
						{file.name}
					</Typography>
				</Stack>
			)}
			<IconButton
				size="small"
				aria-label="Remove selected file"
				onClick={onRemove}
				sx={{
					position: 'absolute',
					top: 4,
					right: 4,
					width: 22,
					height: 22,
					bgcolor: 'rgba(15,23,42,0.72)',
					color: '#fff',
					'&:hover': { bgcolor: 'rgba(15,23,42,0.9)' },
				}}
			>
				<CloseIcon sx={{ fontSize: 14 }} />
			</IconButton>
		</Box>
	);
};

export default SelectedChatFilePreview;
