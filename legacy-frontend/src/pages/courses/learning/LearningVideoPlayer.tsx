import { type FC } from 'react';
import { Box, Typography } from '@mui/material';
import { formatLectureDuration } from '../../../utils/duration';
import type { ILecture } from '../../../types/index';
import CourseQASection from '../../../components/course/CourseQASection';

interface LearningVideoPlayerProps {
	activeLecture: ILecture | null;
	courseId: string;
	canPostQA: boolean;
	userId: string;
	userRole: string;
	initialQuestionId: string | null;
}

const LearningVideoPlayer: FC<LearningVideoPlayerProps> = ({
	activeLecture,
	courseId,
	canPostQA,
	userId,
	userRole,
	initialQuestionId,
}) => {
	const getYouTubeId = (url: string) => {
		const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
		return m ? m[1] : null;
	};

	const videoId = activeLecture?.videoUrl ? getYouTubeId(activeLecture.videoUrl) : null;

	return (
		<>
			<Box
				sx={{
					width: '100%',
					aspectRatio: '16/9',
					bgcolor: '#000',
					flexShrink: 0,
					position: 'relative',
				}}
			>
				{videoId ? (
					<Box
						key={activeLecture?._id}
						component='iframe'
						src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
						title={activeLecture?.title ?? 'Lecture'}
						allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
						allowFullScreen
						sx={{
							position: 'absolute',
							inset: 0,
							width: '100%',
							height: '100%',
							border: 'none',
						}}
					/>
				) : (
					<Box
						sx={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Typography color='grey.500'>
							{activeLecture
								? 'No video available for this lecture'
								: 'Select a lecture to start watching'}
						</Typography>
					</Box>
				)}
			</Box>

			{activeLecture && (
				<Box
					sx={{
						p: 3,
						borderBottom: '1px solid',
						borderColor: 'divider',
					}}
				>
					<Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
						{activeLecture.title}
					</Typography>
					{activeLecture.description && (
						<Typography variant='body2' color='text.secondary'>
							{activeLecture.description}
						</Typography>
					)}
					{activeLecture.duration !== null && activeLecture.duration !== undefined && (
						<Typography
							variant='caption'
							color='text.secondary'
							sx={{ mt: 0.5, display: 'block' }}
						>
							Duration: {formatLectureDuration(activeLecture.duration)}
						</Typography>
					)}
				</Box>
			)}

			<Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 860 }}>
				<CourseQASection
					courseId={courseId}
					canPost={canPostQA}
					userId={userId}
					userRole={userRole}
					initialQuestionId={initialQuestionId}
				/>
			</Box>
		</>
	);
};

export default LearningVideoPlayer;
