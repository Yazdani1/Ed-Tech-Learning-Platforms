import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, Divider, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { ICourse } from '../../../types/index';
import { formatDate } from '../../../utils/dateTime';

interface AdminCourseCardProps {
	course: ICourse;
	onEdit: () => void;
	onStudentView: () => void;
}

const AdminCourseCard: FC<AdminCourseCardProps> = ({ course, onEdit, onStudentView }) => {
	const navigate = useNavigate();
	const teachers = course.teachers?.map((teacher) => teacher.name).join(', ');
	const priceLabel =
		course.pricing === 'Free'
			? 'Free'
			: course.price != null
				? `$${course.price.toFixed(2)}`
				: 'Paid';
	const isPublished = course.status === 'Published';
	const monthlyEarned = course.enrollmentStats?.thisMonthEarned ?? 0;
	const monthlyEnrollments = course.enrollmentStats?.thisMonthCount ?? 0;
	const publishedDate = course.publishedAt ?? course.updatedAt;
	const publishedDateLabel = publishedDate ? formatDate(publishedDate) : 'date unavailable';

	return (
		<Paper
			variant='outlined'
			sx={{
				height: '100%',
				borderRadius: 1,
				overflow: 'hidden',
				bgcolor: 'background.paper',
				transition: 'transform 0.22s ease, box-shadow 0.22s ease',
				'&:hover': {
					transform: 'translateY(-3px)',
					boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
				},
			}}
		>
			<Box sx={{ display: 'flex', minHeight: 232 }}>
				<Box
					sx={{
						width: 190,
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
					<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
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
							label={isPublished ? `Published • ${publishedDateLabel}` : 'Draft'}
							size='small'
							color={isPublished ? 'success' : 'default'}
							sx={{ fontWeight: 800, flexShrink: 0 }}
						/>
					</Box>

					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
						<Chip label={priceLabel} size='small' color={course.pricing === 'Free' ? 'success' : 'default'} sx={{ fontWeight: 800 }} />
						{course.category?.name && <Chip label={course.category.name} size='small' variant='outlined' sx={{ fontWeight: 700 }} />}
						<Chip label={course.visibility} size='small' variant='outlined' sx={{ fontWeight: 700 }} />
						{course.includedInSubscription && <Chip label='Subscription' size='small' sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 800 }} />}
					</Box>

					<Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
						<Box
							onClick={() => navigate(`/admin/enrollments/${course._id}`)}
							sx={{
								p: 1.25,
								borderRadius: 1,
								bgcolor: 'grey.50',
								border: '1px solid',
								borderColor: 'divider',
								cursor: 'pointer',
								'&:hover': { bgcolor: 'action.hover' },
							}}
						>
							<Typography sx={{ fontWeight: 900, lineHeight: 1 }}>
								${monthlyEarned.toFixed(2)}
							</Typography>
							<Typography variant='caption' color='text.secondary'>Earned this month</Typography>
						</Box>
						<Box
							onClick={() => navigate(`/admin/enrollments/${course._id}`)}
							sx={{
								p: 1.25,
								borderRadius: 1,
								bgcolor: 'grey.50',
								border: '1px solid',
								borderColor: 'divider',
								cursor: 'pointer',
								'&:hover': { bgcolor: 'action.hover' },
							}}
						>
							<Typography sx={{ fontWeight: 900, lineHeight: 1 }}>
								{monthlyEnrollments}
							</Typography>
							<Typography variant='caption' color='text.secondary'>Enrollments this month</Typography>
						</Box>
					</Box>

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
						<Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
							<Tooltip title='Student view'>
								<IconButton onClick={onStudentView} size='small'>
									<VisibilityOutlinedIcon fontSize='small' />
								</IconButton>
							</Tooltip>
							<Tooltip title='Edit course'>
								<IconButton onClick={onEdit} size='small'>
									<EditOutlinedIcon fontSize='small' />
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default AdminCourseCard;
