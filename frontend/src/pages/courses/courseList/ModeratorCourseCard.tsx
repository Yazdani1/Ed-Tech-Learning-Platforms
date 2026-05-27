import { type FC } from 'react';
import { Box, Button, Chip, Divider, Paper, Typography } from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { ICourse } from '../../../types/index';

interface ModeratorCourseCardProps {
	course: ICourse;
	onStudentView: () => void;
}

const ModeratorCourseCard: FC<ModeratorCourseCardProps> = ({ course, onStudentView }) => {
	const teachers = course.teachers?.map((teacher) => teacher.name).join(', ');
	const priceLabel =
		course.pricing === 'Free'
			? 'Free'
			: course.price != null
				? `$${course.price.toFixed(2)}`
				: 'Paid';

	return (
		<Paper
			variant='outlined'
			sx={{
				height: '100%',
				borderRadius: 1,
				overflow: 'hidden',
				display: 'flex',
				bgcolor: 'background.paper',
				transition: 'transform 0.22s ease, box-shadow 0.22s ease',
				'&:hover': {
					transform: 'translateY(-3px)',
					boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
				},
			}}
		>
			<Box
				sx={{
					width: 188,
					flexShrink: 0,
					bgcolor: 'grey.100',
					position: 'relative',
					display: { xs: 'none', sm: 'block' },
				}}
			>
				{course.coverImage ? (
					<Box
						component='img'
						src={course.coverImage}
						alt={course.title}
						sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
					/>
				) : (
					<Box
						sx={{
							height: '100%',
							minHeight: 210,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(21,101,192,0.12))',
						}}
					>
						<SchoolOutlinedIcon sx={{ color: 'primary.main', fontSize: 46 }} />
					</Box>
				)}
				{course.courseType && (
					<Box
						sx={{
							position: 'absolute',
							top: 12,
							left: 12,
							px: 1.25,
							py: 0.6,
							borderRadius: 1,
							background:
								'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)',
							backgroundSize: '250% auto',
							color: 'white',
							boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
							<VerifiedIcon sx={{ fontSize: 13, color: 'white' }} />
							<Typography
								variant='caption'
								sx={{
									fontSize: '0.65rem',
									fontWeight: 800,
									color: 'white',
									letterSpacing: 0.75,
									lineHeight: 1,
									textTransform: 'uppercase',
								}}
							>
								{course.courseType.name}
							</Typography>
						</Box>
					</Box>
				)}
			</Box>

			<Box sx={{ p: 2.5, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
					<Box sx={{ minWidth: 0 }}>
						<Typography
							variant='h6'
							sx={{
								fontWeight: 900,
								lineHeight: 1.25,
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{course.title}
						</Typography>
						{course.subtitle && (
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{
									mt: 0.75,
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									overflow: 'hidden',
								}}
							>
								{course.subtitle}
							</Typography>
						)}
					</Box>
					<Chip
						label={priceLabel}
						size='small'
						color={course.pricing === 'Free' ? 'success' : 'default'}
						sx={{ fontWeight: 800, flexShrink: 0 }}
					/>
				</Box>

				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
					{course.courseType?.name && (
						<Chip label={course.courseType.name} size='small' variant='outlined' sx={{ fontWeight: 700 }} />
					)}
					{course.category?.name && (
						<Chip label={course.category.name} size='small' variant='outlined' sx={{ fontWeight: 700 }} />
					)}
					<Chip label={course.visibility} size='small' sx={{ fontWeight: 700 }} />
				</Box>

				{course.description && (
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{
							mt: 2,
							lineHeight: 1.7,
							display: '-webkit-box',
							WebkitLineClamp: 3,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{course.description}
					</Typography>
				)}

				<Box sx={{ flexGrow: 1 }} />
				<Divider sx={{ my: 2 }} />

				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
							Teachers
						</Typography>
						<Typography
							variant='body2'
							sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
						>
							{teachers || 'No teachers assigned'}
						</Typography>
					</Box>
					<Button
						variant='contained'
						size='small'
						startIcon={<VisibilityOutlinedIcon />}
						onClick={onStudentView}
						sx={{ fontWeight: 800, flexShrink: 0 }}
					>
						View
					</Button>
				</Box>
			</Box>
		</Paper>
	);
};

export default ModeratorCourseCard;
