import { type FC } from 'react';
import {
	Box,
	Chip,
	Divider,
	Grid,
	Typography,
} from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { formatSectionDuration } from '../../../utils/duration';
import type { ICourse } from '../../../types/index';

interface StatItemProps {
	icon: React.ReactNode;
	label: string;
	value: string;
}

const StatItem: FC<StatItemProps> = ({ icon, label, value }) => {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
			<Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
			<Box>
				<Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.15 }}>
					{value}
				</Typography>
				<Typography variant='caption' color='text.secondary'>
					{label}
				</Typography>
			</Box>
		</Box>
	);
};

interface LearningCourseOverviewProps {
	course: ICourse;
	enrolledCount: number | null;
	totalLectures: number;
	totalDurationSec: number;
	announcementsCount: number;
	studyMaterialsCount: number;
	studyCurriculaCount: number;
	qaCount: number;
}

const LearningCourseOverview: FC<LearningCourseOverviewProps> = ({
	course,
	enrolledCount,
	totalLectures,
	totalDurationSec,
	announcementsCount,
	studyMaterialsCount,
	studyCurriculaCount,
	qaCount,
}) => {
	return (
		<Box sx={{ p: { xs: 3, md: 4 }, width: '100%' }}>
			<Typography
				variant='h4'
				sx={{ fontWeight: 800, mb: 0.75, lineHeight: 1.25 }}
			>
				{course.title}
			</Typography>
			{course.subtitle && (
				<Typography
					variant='h6'
					sx={{ fontWeight: 400, color: 'text.secondary', mb: 2 }}
				>
					{course.subtitle}
				</Typography>
			)}
			{course.category?.name && (
				<Box sx={{ mb: 3 }}>
					<Chip
						icon={<CategoryOutlinedIcon sx={{ fontSize: 15 }} />}
						label={course.category.name}
						size='small'
						sx={{ fontWeight: 600 }}
					/>
				</Box>
			)}

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr 1fr',
						sm: 'repeat(3, 1fr)',
						md: 'repeat(4, 1fr)',
					},
					gap: { xs: 2.5, sm: 3 },
					mb: 4,
					p: 3,
					bgcolor: 'background.paper',
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: 2,
					boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
				}}
			>
				<StatItem
					icon={<PeopleOutlinedIcon />}
					label='Enrolled Students'
					value={enrolledCount !== null ? enrolledCount.toLocaleString() : '—'}
				/>
				<StatItem
					icon={<OndemandVideoIcon />}
					label='Video Lectures'
					value={String(totalLectures)}
				/>
				<StatItem
					icon={<AccessTimeIcon />}
					label='Total Duration'
					value={totalDurationSec > 0 ? formatSectionDuration(totalDurationSec) : '—'}
				/>
				<StatItem
					icon={<MenuBookOutlinedIcon />}
					label='Sections'
					value={String(course.sections?.length ?? 0)}
				/>
				<StatItem
					icon={<CampaignOutlinedIcon />}
					label='Announcements'
					value={String(announcementsCount)}
				/>
				<StatItem
					icon={<MenuBookOutlinedIcon />}
					label='Study Materials'
					value={String(studyMaterialsCount)}
				/>
				<StatItem
					icon={<EventNoteOutlinedIcon />}
					label='Live Class'
					value={String(studyCurriculaCount)}
				/>
				<StatItem
					icon={<QuestionAnswerOutlinedIcon />}
					label='Q & A Questions'
					value={String(qaCount)}
				/>
				<StatItem
					icon={<PersonOutlinedIcon />}
					label='Total Teachers'
					value={String(course.teachers?.length ?? 0)}
				/>
			</Box>

			<Divider sx={{ mb: 4 }} />

			{(course.whatYouWillLearn?.length ?? 0) > 0 && (
				<Box sx={{ mb: 4 }}>
					<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
						What you&apos;ll learn
					</Typography>
					<Grid container spacing={1}>
						{course.whatYouWillLearn.map((item, i) => (
							<Grid key={i} size={{ xs: 12, sm: 6 }}>
								<Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
									<CheckCircleOutlinedIcon
										sx={{
											color: 'success.main',
											fontSize: 18,
											flexShrink: 0,
											mt: 0.2,
										}}
									/>
									<Typography variant='body2'>{item}</Typography>
								</Box>
							</Grid>
						))}
					</Grid>
				</Box>
			)}

			{(course.requirements?.length ?? 0) > 0 && (
				<Box sx={{ mb: 4 }}>
					<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
						Requirements
					</Typography>
					<Box component='ul' sx={{ pl: 3, m: 0 }}>
						{course.requirements.map((item, i) => (
							<Box component='li' key={i} sx={{ mb: 0.75 }}>
								<Typography variant='body2'>{item}</Typography>
							</Box>
						))}
					</Box>
				</Box>
			)}

			{course.description && (
				<Box>
					<Typography variant='h6' sx={{ fontWeight: 700, mb: 2 }}>
						About this course
					</Typography>
					<Box
						dangerouslySetInnerHTML={{ __html: course.description }}
						sx={{
							'& p': { mt: 0, mb: 1.5 },
							'& ul': { pl: 3 },
							lineHeight: 1.8,
							color: 'text.secondary',
						}}
					/>
				</Box>
			)}
		</Box>
	);
};

export default LearningCourseOverview;
