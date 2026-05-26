import { type FC } from 'react';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { formatLectureDuration } from '../../../utils/duration';
import type { ICourse, ILecture } from '../../../types/index';

interface CourseLearningLectureSidebarProps {
	course: ICourse;
	activeLecture: ILecture | null;
	totalLectures: number;
	onSelectLecture: (lecture: ILecture) => void;
}

const CourseLearningLectureSidebar: FC<CourseLearningLectureSidebarProps> = ({
	course,
	activeLecture,
	totalLectures,
	onSelectLecture,
}) => {
	return (
		<Box
			sx={{
				width: 320,
				bgcolor: 'grey.50',
				borderLeft: '1px solid',
				borderColor: 'divider',
				overflow: 'auto',
				flexShrink: 0,
			}}
		>
			<Box
				sx={{
					px: 2,
					py: 1.5,
					borderBottom: '1px solid',
					borderColor: 'divider',
					bgcolor: 'background.paper',
					position: 'sticky',
					top: 0,
					zIndex: 1,
				}}
			>
				<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
					Course Content
				</Typography>
				<Typography variant='caption' color='text.secondary'>
					{course.sections?.length ?? 0} section
					{(course.sections?.length ?? 0) !== 1 ? 's' : ''} &bull;{' '}
					{totalLectures} lecture{totalLectures !== 1 ? 's' : ''}
				</Typography>
			</Box>

			{(course.sections ?? []).map((section, si) => (
				<Accordion
					key={section._id}
					defaultExpanded={si === 0}
					elevation={0}
					disableGutters
					sx={{
						bgcolor: 'transparent',
						borderBottom: '1px solid',
						borderColor: 'divider',
						'&::before': { display: 'none' },
					}}
				>
					<AccordionSummary
						expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
						sx={{ px: 2, py: 1, bgcolor: 'grey.100', minHeight: 48 }}
					>
						<Box>
							<Typography
								sx={{
									fontWeight: 600,
									fontSize: '0.82rem',
									lineHeight: 1.3,
								}}
							>
								{section.title}
							</Typography>
							<Typography variant='caption' color='text.secondary'>
								{section.lectures.length} lecture
								{section.lectures.length !== 1 ? 's' : ''}
							</Typography>
						</Box>
					</AccordionSummary>
					<AccordionDetails sx={{ p: 0 }}>
						{section.lectures.map((lecture, li) => {
							const isActive = activeLecture?._id === lecture._id;
							const hasVideo = !!lecture.videoUrl;
							return (
								<Box
									key={lecture._id}
									onClick={() => {
										if (hasVideo) onSelectLecture(lecture);
									}}
									sx={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: 1.25,
										px: 2,
										py: 1.25,
										cursor: hasVideo ? 'pointer' : 'default',
										borderTop: li > 0 ? '1px solid' : 'none',
										borderColor: 'divider',
										bgcolor: isActive
											? 'primary.50'
											: 'background.paper',
										transition: 'background 0.15s',
										...(hasVideo &&
											!isActive && {
												'&:hover': { bgcolor: 'action.hover' },
											}),
									}}
								>
									{isActive ? (
										<PlayCircleFilledIcon
											sx={{
												fontSize: 18,
												color: 'primary.main',
												flexShrink: 0,
												mt: 0.15,
											}}
										/>
									) : (
										<PlayCircleOutlinedIcon
											sx={{
												fontSize: 18,
												color: hasVideo ? 'text.secondary' : 'grey.300',
												flexShrink: 0,
												mt: 0.15,
											}}
										/>
									)}
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography
											sx={{
												fontSize: '0.8rem',
												fontWeight: isActive ? 700 : 400,
												color: isActive
													? 'primary.main'
													: hasVideo
														? 'text.primary'
														: 'text.disabled',
												lineHeight: 1.35,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
											}}
										>
											{lecture.title}
										</Typography>
										{lecture.duration !== null &&
											lecture.duration !== undefined && (
											<Typography
												variant='caption'
												color='text.secondary'
											>
												{formatLectureDuration(lecture.duration)}
											</Typography>
										)}
									</Box>
								</Box>
							);
						})}
						{section.lectures.length === 0 && (
							<Box sx={{ px: 2, py: 1.5 }}>
								<Typography variant='caption' color='text.secondary'>
									No lectures in this section.
								</Typography>
							</Box>
						)}
					</AccordionDetails>
				</Accordion>
			))}
		</Box>
	);
};

export default CourseLearningLectureSidebar;
