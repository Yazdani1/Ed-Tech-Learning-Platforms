import { type FC } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';

interface CourseCreateMediaTabProps {
	coverPreview: string;
	coverImage: File | null;
	onCoverChange: (file: File | null, preview: string) => void;
}

const CourseCreateMediaTab: FC<CourseCreateMediaTabProps> = ({
	coverPreview,
	onCoverChange,
}) => {
	return (
		<Box sx={{ maxWidth: 720 }}>
			<Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
				Cover Image
			</Typography>
			<Paper
				variant='outlined'
				sx={{
					p: 4,
					textAlign: 'center',
					borderRadius: 3,
					borderStyle: 'dashed',
					cursor: 'pointer',
					position: 'relative',
					'&:hover': { borderColor: 'primary.main' },
				}}
				onClick={() => document.getElementById('cover-upload')?.click()}
			>
				{coverPreview ? (
					<>
						<img
							src={coverPreview}
							alt='cover'
							style={{
								maxHeight: 280,
								maxWidth: '100%',
								borderRadius: 8,
							}}
						/>
						<IconButton
							size='small'
							sx={{
								position: 'absolute',
								top: 8,
								right: 8,
								bgcolor: 'background.paper',
							}}
							onClick={(e) => {
								e.stopPropagation();
								onCoverChange(null, '');
							}}
						>
							<CloseIcon fontSize='small' />
						</IconButton>
					</>
				) : (
					<Box>
						<CloudUploadIcon
							sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
						/>
						<Typography color='text.secondary'>
							Click to upload cover image (max 5MB)
						</Typography>
					</Box>
				)}
				<input
					id='cover-upload'
					type='file'
					accept='image/*'
					hidden
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) {
							onCoverChange(file, URL.createObjectURL(file));
						}
					}}
				/>
			</Paper>
		</Box>
	);
};

export default CourseCreateMediaTab;
