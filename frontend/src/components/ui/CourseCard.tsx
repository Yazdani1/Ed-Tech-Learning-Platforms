import {
	Card,
	CardContent,
	CardMedia,
	Chip,
	Typography,
	Box,
	CardActionArea,
} from '@mui/material';
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

	return (
		<Card
			elevation={0}
			sx={{
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 3,
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<CardActionArea onClick={() => navigate(`${basePath}/${course._id}`)}>
				<CardMedia
					component='img'
					height='160'
					image={
						course.coverImage ?? 'https://placehold.co/400x160?text=No+Image'
					}
					alt={course.title}
				/>
				<CardContent sx={{ flex: 1 }}>
					<Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
						<Chip
							label={course.status}
							size='small'
							color={course.status === 'Published' ? 'success' : 'default'}
						/>
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
	);
}
