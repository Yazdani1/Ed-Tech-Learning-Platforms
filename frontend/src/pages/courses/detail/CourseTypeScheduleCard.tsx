import type { FC } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import type { ICourse } from '../../../types/index';
import { formatDate } from '../../../utils/dateTime';

interface CourseTypeScheduleCardProps {
	course: ICourse;
}

const CourseTypeScheduleCard: FC<CourseTypeScheduleCardProps> = ({ course }) => {
	if (!course.courseType && !course.startDate && !course.endDate) return null;

	return (
		<Box
			sx={{
				mb: 4,
				borderRadius: 2,
				overflow: 'hidden',
				border: '1px solid',
				borderColor: 'divider',
				boxShadow: '0 2px 12px rgba(15,118,110,0.08)',
			}}
		>
			<Box
				sx={{
					height: 5,
					background:
						'linear-gradient(90deg, #0f766e, #7c3aed, #0ea5e9, #0f766e)',
					backgroundSize: '300% 100%',
					animation: 'barSlide 4s linear infinite',
					'@keyframes barSlide': {
						'0%': { backgroundPosition: '0% 0%' },
						'100%': { backgroundPosition: '300% 0%' },
					},
				}}
			/>

			<Box sx={{ p: 3 }}>
				{course.courseType && (
					<Box sx={{ mb: course.startDate || course.endDate ? 2.5 : 0 }}>
						<Typography
							variant='overline'
							sx={{
								color: 'text.disabled',
								letterSpacing: 2,
								fontSize: '0.7rem',
								display: 'block',
								mb: 0.75,
							}}
						>
							Course Type
						</Typography>

						<Typography
							variant='h5'
							sx={{
								fontWeight: 900,
								display: 'inline-block',
								background:
									'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)',
								backgroundSize: '250% auto',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
								animation: 'typeShimmer 3s linear infinite',
								'@keyframes typeShimmer': {
									'0%': { backgroundPosition: '0% center' },
									'100%': { backgroundPosition: '250% center' },
								},
								mb: course.courseType.description ? 1 : 0,
							}}
						>
							{course.courseType.name}
						</Typography>

						{course.courseType.description && (
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{ lineHeight: 1.7 }}
							>
								{course.courseType.description}
							</Typography>
						)}
					</Box>
				)}

				{(course.startDate || course.endDate) && (
					<>
						{course.courseType && <Divider sx={{ mb: 2.5 }} />}
						<Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
							{course.startDate && (
								<Box>
									<Typography
										variant='caption'
										sx={{
											color: 'text.disabled',
											textTransform: 'uppercase',
											letterSpacing: 1.5,
											display: 'block',
											mb: 0.5,
										}}
									>
										Start Date
									</Typography>
									<Box
										sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
									>
										<CalendarTodayIcon
											sx={{ fontSize: 18, color: '#0f766e' }}
										/>
										<Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
											{formatDate(course.startDate)}
										</Typography>
									</Box>
								</Box>
							)}
							{course.endDate && (
								<Box>
									<Typography
										variant='caption'
										sx={{
											color: 'text.disabled',
											textTransform: 'uppercase',
											letterSpacing: 1.5,
											display: 'block',
											mb: 0.5,
										}}
									>
										End Date
									</Typography>
									<Box
										sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
									>
										<EventIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
										<Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
											{formatDate(course.endDate)}
										</Typography>
									</Box>
								</Box>
							)}
						</Box>
					</>
				)}
			</Box>
		</Box>
	);
};

export default CourseTypeScheduleCard;
