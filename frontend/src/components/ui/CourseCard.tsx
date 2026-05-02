import {
	Card,
	CardContent,
	CardMedia,
	Chip,
	Typography,
	Box,
	CardActionArea,
	Popover,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ICourse } from '../../types/index';

interface CourseCardProps {
	course: ICourse;
	basePath?: string;
}

export default function CourseCard({
	course,
	basePath = '/admin/courses',
}: CourseCardProps) {
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMouseLeave = () => {
		setAnchorEl(null);
	};

	const open = Boolean(anchorEl);

	return (
		<>
			<Card
				elevation={0}
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 1,
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
					transition: 'box-shadow 0.3s ease',
					'&:hover': {
						boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
						'& .MuiCardMedia-root': {
							transform: 'scale(1.05)',
							transition: 'transform 0.3s ease',
						},
					},
				}}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<CardActionArea onClick={() => navigate(`${basePath}/${course._id}`)}>
					<CardMedia
						component='img'
						height='160'
						image={
							course.coverImage ?? 'https://placehold.co/400x160?text=No+Image'
						}
						alt={course.title}
						sx={{
							transform: 'scale(1)',
							transition: 'transform 0.3s ease',
						}}
					/>
					<CardContent sx={{ flex: 1 }}>
						<Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
							<Chip
								label={course.pricing}
								size='small'
								color={course.pricing === 'Free' ? 'info' : 'warning'}
							/>
						</Box>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 700 }}
							gutterBottom
							noWrap
						>
							{course.title}
						</Typography>
						{course.subtitle && (
							<Typography variant='body2' color='text.secondary' noWrap>
								{course.subtitle}
							</Typography>
						)}
						{course.category && (
							<Typography
								variant='caption'
								color='primary.main'
								sx={{ mt: 1, display: 'block' }}
							>
								{course.category.name}
							</Typography>
						)}
					</CardContent>
				</CardActionArea>
			</Card>
			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleMouseLeave}
				anchorOrigin={{
					vertical: 'center',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'center',
					horizontal: 'left',
				}}
				disableRestoreFocus
				sx={{
					pointerEvents: 'none',
				}}
			>
				<Box sx={{ p: 2, maxWidth: 300 }}>
					<Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
						{course.title}
					</Typography>
					{course.description && (
						<Typography variant='body2' sx={{ mb: 2 }}>
							{course.description}
						</Typography>
					)}
					{course.teachers && course.teachers.length > 0 && (
						<Box sx={{ mb: 1 }}>
							<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
								Teachers:
							</Typography>
							{course.teachers.map((teacher) => (
								<Typography key={teacher._id} variant='body2'>
									{teacher.name}
								</Typography>
							))}
						</Box>
					)}
					{course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
						<Box sx={{ mb: 1 }}>
							<Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
								What you'll learn:
							</Typography>
							{course.whatYouWillLearn.slice(0, 3).map((item, idx) => (
								<Typography
									key={idx}
									variant='body2'
									sx={{ fontSize: '0.875rem' }}
								>
									• {item}
								</Typography>
							))}
							{course.whatYouWillLearn.length > 3 && (
								<Typography variant='body2' color='text.secondary'>
									...and more
								</Typography>
							)}
						</Box>
					)}
				</Box>
			</Popover>
		</>
	);
}
