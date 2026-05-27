import { type FC } from 'react';
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import AppModal from '../../../components/common/AppModal';
import type { ILecture } from '../../../types/index';

interface CoursePreviewLectureModalProps {
	previewLecture: ILecture | null;
	setPreviewLecture: React.Dispatch<React.SetStateAction<ILecture | null>>;
	allPreviewLectures: ILecture[];
	courseTitle: string;
}

const getYouTubeId = (url: string) => {
	const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
	return m ? m[1] : null;
};

const CoursePreviewLectureModal: FC<CoursePreviewLectureModalProps> = ({
	previewLecture,
	setPreviewLecture,
	allPreviewLectures,
	courseTitle,
}) => {
	return (
		<AppModal
			open={Boolean(previewLecture)}
			onClose={() => setPreviewLecture(null)}
			maxWidth='md'
			hideActions
			contentDividers={false}
			paperSx={{ borderRadius: 3, overflow: 'hidden', bgcolor: '#0f0f0f' }}
			titleSx={{ bgcolor: '#1a1a1a', color: 'white', py: 1.5, px: 2.5, pr: 6 }}
			closeButtonSx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
			contentSx={{
				p: 0,
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				minHeight: 420,
			}}
			title={
				<Box>
					<Typography variant='caption' sx={{ color: 'grey.400', display: 'block', mb: 0.25 }}>
						Free Preview - {courseTitle}
					</Typography>
					<Typography sx={{ fontWeight: 700, color: 'white', fontSize: '1rem', lineHeight: 1.3 }}>
						{previewLecture?.title}
					</Typography>
				</Box>
			}
		>
			<Box sx={{ flex: 1, bgcolor: '#000', position: 'relative', minHeight: { xs: 240, md: 420 } }}>
				{previewLecture?.videoUrl && getYouTubeId(previewLecture.videoUrl) ? (
					<Box
						key={previewLecture._id}
						component='iframe'
						src={`https://www.youtube.com/embed/${getYouTubeId(previewLecture.videoUrl)}?autoplay=1`}
						title={previewLecture.title}
						allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
						allowFullScreen
						sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
					/>
				) : (
					<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Typography color='grey.500'>No video available</Typography>
					</Box>
				)}
			</Box>

			{allPreviewLectures.length > 1 && (
				<Box
					sx={{
						width: { xs: '100%', md: 280 },
						bgcolor: '#1a1a1a',
						display: 'flex',
						flexDirection: 'column',
						borderLeft: { md: '1px solid #2a2a2a' },
						borderTop: { xs: '1px solid #2a2a2a', md: 'none' },
						overflow: 'hidden',
					}}
				>
					<Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #2a2a2a' }}>
						<Typography
							variant='caption'
							sx={{ color: 'grey.400', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
						>
							Free Previews ({allPreviewLectures.length})
						</Typography>
					</Box>
					<List disablePadding sx={{ overflow: 'auto', flex: 1 }}>
						{allPreviewLectures.map((lec) => {
							const isActive = lec._id === previewLecture?._id;
							return (
								<ListItemButton
									key={lec._id}
									selected={isActive}
									onClick={() => setPreviewLecture(lec)}
									sx={{
										px: 2,
										py: 1.25,
										gap: 1.25,
										borderBottom: '1px solid #2a2a2a',
										'&.Mui-selected': { bgcolor: '#7c3aed22' },
										'&.Mui-selected:hover': { bgcolor: '#7c3aed33' },
										'&:hover': { bgcolor: '#ffffff0a' },
									}}
								>
									{isActive ? (
										<PlayCircleFilledIcon sx={{ fontSize: 20, color: '#a78bfa', flexShrink: 0 }} />
									) : (
										<PlayCircleOutlinedIcon sx={{ fontSize: 20, color: 'grey.500', flexShrink: 0 }} />
									)}
									<ListItemText
										primary={lec.title}
										slotProps={{
											primary: {
												style: {
													fontSize: '0.82rem',
													fontWeight: isActive ? 700 : 400,
													color: isActive ? '#a78bfa' : '#d1d5db',
													lineHeight: 1.35,
												},
											},
										}}
									/>
								</ListItemButton>
							);
						})}
					</List>
				</Box>
			)}
		</AppModal>
	);
};

export default CoursePreviewLectureModal;
