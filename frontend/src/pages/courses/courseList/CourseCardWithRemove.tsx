import { type FC } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CourseCard from '../../../components/ui/CourseCard';
import type { ICourse } from '../../../types/index';

interface CourseCardWithRemoveProps {
	course: ICourse;
	onRemove: () => void;
	subscriptionBadge?: boolean;
}

const CourseCardWithRemove: FC<CourseCardWithRemoveProps> = ({
	course,
	onRemove,
	subscriptionBadge = false,
}) => {
	return (
		<Box sx={{ position: 'relative' }}>
			<CourseCard
				course={course}
				basePath='/student/courses'
				appendPath='/learn'
				showPreview={false}
			/>
			{subscriptionBadge && (
				<Box
					sx={{
						position: 'absolute',
						top: 8,
						left: 8,
						bgcolor: '#7c3aed',
						color: 'white',
						borderRadius: 1,
						px: 0.75,
						py: 0.25,
						display: 'flex',
						alignItems: 'center',
						gap: 0.4,
						pointerEvents: 'none',
					}}
				>
					<CardMembershipIcon sx={{ fontSize: 12 }} />
					<Typography sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>
						Subscription
					</Typography>
				</Box>
			)}
			<Tooltip title='Remove from my courses'>
				<IconButton
					size='small'
					onClick={onRemove}
					sx={{
						position: 'absolute',
						top: 6,
						right: 6,
						bgcolor: 'rgba(255,255,255,0.9)',
						'&:hover': { bgcolor: 'error.light', color: 'white' },
					}}
				>
					<DeleteOutlineIcon fontSize='small' />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export default CourseCardWithRemove;
