import { type FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Chip,
	List,
	ListItemButton,
	Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import EventIcon from '@mui/icons-material/Event';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import type { ICourse, IStudyCurriculum, IPublicQuizSection, ILecture } from '../../../types/index';
import { formatLectureDuration, formatSectionDuration } from '../../../utils/duration';
import { formatLiveClassDate, formatLiveClassTime } from '../../../utils/dateTime';

interface CourseContentAccordionTabsProps {
	course: ICourse;
	contentView: 'recorded' | 'curriculum' | 'quizzes';
	setContentView: React.Dispatch<React.SetStateAction<'recorded' | 'curriculum' | 'quizzes'>>;
	expanded: string[];
	setExpanded: React.Dispatch<React.SetStateAction<string[]>>;
	liveExpanded: string[];
	setLiveExpanded: React.Dispatch<React.SetStateAction<string[]>>;
	studyCurricula: IStudyCurriculum[];
	quizSections: IPublicQuizSection[];
	getSectionDuration: (section: ICourse['sections'][number]) => number;
	setPreviewLecture: React.Dispatch<React.SetStateAction<ILecture | null>>;
}

const CourseContentAccordionTabs: FC<CourseContentAccordionTabsProps> = ({
	course,
	contentView,
	setContentView,
	expanded,
	setExpanded,
	liveExpanded,
	setLiveExpanded,
	studyCurricula,
	quizSections,
	getSectionDuration,
	setPreviewLecture,
}) => {
	const hasRecordedContent = (course.sections?.length ?? 0) > 0;
	const hasStudyCurriculum = studyCurricula.length > 0;
	const hasQuizzes = quizSections.length > 0;

	if (!hasRecordedContent && !hasStudyCurriculum) return null;

	const showContentTabs =
		(hasRecordedContent ? 1 : 0) + (hasStudyCurriculum ? 1 : 0) + (hasQuizzes ? 1 : 0) > 1;

	const totalLectures =
		course.sections?.reduce((acc, s) => acc + s.lectures.length, 0) ?? 0;

	const totalCurriculumClasses = studyCurricula.reduce(
		(total, curriculum) => total + curriculum.lectures.length,
		0,
	);

	const activeContentView = (() => {
		if (contentView === 'recorded' && hasRecordedContent) return 'recorded';
		if (contentView === 'curriculum' && hasStudyCurriculum) return 'curriculum';
		if (contentView === 'quizzes' && hasQuizzes) return 'quizzes';
		if (hasRecordedContent) return 'recorded';
		if (hasStudyCurriculum) return 'curriculum';
		if (hasQuizzes) return 'quizzes';
		return 'recorded';
	})();

	return (
		<Box sx={{ mb: 4, width: { md: 'calc(100% + 80px)' }, maxWidth: { md: 'calc(100vw - 48px)' } }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					mb: 2,
					flexWrap: 'wrap',
					gap: 1,
				}}
			>
				<Typography variant='h6' sx={{ fontWeight: 700 }}>
					Course content
				</Typography>
				{activeContentView === 'recorded' && (
					<Button
						size='small'
						onClick={() => {
							if (!course?.sections) return;
							const allIds = course.sections.map((s) => s._id);
							if (expanded.length === allIds.length) {
								setExpanded([]);
							} else {
								setExpanded(allIds);
							}
						}}
						sx={{ color: 'primary.main', fontWeight: 600 }}
					>
						{expanded.length === (course?.sections?.length ?? 0) &&
						(course?.sections?.length ?? 0) > 0
							? 'Collapse all sections'
							: 'Expand all sections'}
					</Button>
				)}
				{activeContentView === 'curriculum' && (
					<Button
						size='small'
						onClick={() => {
							const allIds = studyCurricula.map((item) => item._id);
							if (liveExpanded.length === allIds.length) {
								setLiveExpanded([]);
							} else {
								setLiveExpanded(allIds);
							}
						}}
						sx={{ color: 'primary.main', fontWeight: 600 }}
					>
						{liveExpanded.length === studyCurricula.length && studyCurricula.length > 0
							? 'Collapse all weeks'
							: 'Expand all weeks'}
					</Button>
				)}
			</Box>

			{showContentTabs && (
				<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
					<Button
						size='small'
						variant={activeContentView === 'recorded' ? 'contained' : 'outlined'}
						startIcon={<OndemandVideoIcon fontSize='small' />}
						onClick={() => setContentView('recorded')}
					>
						Recorded Lectures
					</Button>
					<Button
						size='small'
						variant={activeContentView === 'curriculum' ? 'contained' : 'outlined'}
						startIcon={<EventIcon fontSize='small' />}
						onClick={() => setContentView('curriculum')}
					>
						Live Class
					</Button>
					<Button
						size='small'
						variant={activeContentView === 'quizzes' ? 'contained' : 'outlined'}
						startIcon={<QuizOutlinedIcon fontSize='small' />}
						onClick={() => setContentView('quizzes')}
					>
						Quizzes
					</Button>
				</Box>
			)}

			<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
				{activeContentView === 'recorded'
					? `${course.sections.length} sections - ${totalLectures} lectures`
					: activeContentView === 'curriculum'
						? `${studyCurricula.length} weeks - ${totalCurriculumClasses} classes`
						: `${quizSections.length} quiz sections - ${quizSections.reduce((acc, s) => acc + s.banks.length, 0)} quiz banks`}
			</Typography>

			{activeContentView === 'recorded' && (
				<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
					{course.sections.map((section, si) => (
						<Accordion
							key={section._id}
							expanded={expanded.includes(section._id)}
							onChange={(_e, isExpanded) => {
								setExpanded((prev) =>
									isExpanded
										? [...prev, section._id]
										: prev.filter((id) => id !== section._id),
								);
							}}
							elevation={0}
							disableGutters
							sx={{
								borderBottom: si < course.sections.length - 1 ? '1px solid' : 'none',
								borderColor: 'divider',
								'&::before': { display: 'none' },
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								sx={{ bgcolor: 'grey.50', px: 2.5, py: 1.5, minHeight: 56 }}
							>
								<Typography sx={{ fontWeight: 600, flex: 1 }}>{section.title}</Typography>
								<Typography variant='caption' color='text.secondary' sx={{ mr: 1, alignSelf: 'center' }}>
									{section.lectures.length} lecture{section.lectures.length !== 1 ? 's' : ''} •{' '}
									{formatSectionDuration(getSectionDuration(section))}
								</Typography>
							</AccordionSummary>
							<AccordionDetails sx={{ p: 0 }}>
								{section.lectures.map((lecture, li) => {
									const canPreview = lecture.isPreview && !!lecture.videoUrl;
									return (
										<Box
											key={lecture._id}
											onClick={canPreview ? () => setPreviewLecture(lecture) : undefined}
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1.5,
												px: 2.5,
												py: 1.25,
												borderTop: li > 0 ? '1px solid' : 'none',
												borderColor: 'divider',
												...(canPreview && { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }),
											}}
										>
											<PlayCircleOutlinedIcon
												fontSize='small'
												sx={{ color: canPreview ? 'info.main' : 'action.active' }}
											/>
											<Typography
												variant='body2'
												sx={{ flex: 1, color: canPreview ? 'info.main' : 'inherit' }}
											>
												{lecture.title}
											</Typography>
											{lecture.duration && (
												<Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
													{formatLectureDuration(lecture.duration)}
												</Typography>
											)}
											{lecture.isPreview && (
												<Chip label='Free Preview' size='small' color='info' variant='outlined' />
											)}
										</Box>
									);
								})}
								{section.lectures.length === 0 && (
									<Box sx={{ px: 2.5, py: 2 }}>
										<Typography variant='body2' color='text.secondary'>
											No lectures yet.
										</Typography>
									</Box>
								)}
							</AccordionDetails>
						</Accordion>
					))}
				</Box>
			)}

			{activeContentView === 'curriculum' && (
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5, alignItems: 'start' }}>
					{studyCurricula.map((curriculum, ci) => (
						<Accordion
							key={curriculum._id}
							expanded={liveExpanded.includes(curriculum._id)}
							onChange={(_event, isExpanded) => {
								setLiveExpanded((prev) =>
									isExpanded
										? [...prev, curriculum._id]
										: prev.filter((id) => id !== curriculum._id),
								);
							}}
							elevation={0}
							disableGutters
							sx={{
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: '8px !important',
								overflow: 'hidden',
								bgcolor: 'background.paper',
								boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
								'&::before': { display: 'none' },
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								sx={{
									bgcolor: 'background.paper',
									px: 2.5,
									py: 1.5,
									minHeight: 92,
									'& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5, minWidth: 0 },
								}}
							>
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
										<Box
											sx={{
												width: 64,
												minHeight: 78,
												borderRadius: 1,
												bgcolor: ci % 3 === 0 ? '#f59e0b' : ci % 3 === 1 ? '#fb7c3c' : '#0ea5e9',
												color: 'white',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												justifyContent: 'center',
												textAlign: 'center',
												fontSize: '0.8rem',
												fontWeight: 800,
												lineHeight: 1.15,
												flexShrink: 0,
											}}
										>
											<Typography sx={{ fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1 }}>
												Week
											</Typography>
											<Typography sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>
												{ci + 1}
											</Typography>
										</Box>
										<Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
											{curriculum.title || curriculum.weekName}
										</Typography>
									</Box>
								</Box>
								<Box
									sx={{
										display: { xs: 'none', sm: 'flex' },
										alignItems: 'center',
										gap: 0.75,
										mr: 1,
										px: 1.25,
										py: 0.65,
										borderRadius: 1,
										bgcolor: 'grey.100',
										color: '#111827',
										flexShrink: 0,
									}}
								>
									<EventIcon sx={{ fontSize: 17 }} />
									<Typography variant='caption' sx={{ fontWeight: 800 }}>
										{curriculum.lectures.length} Live Class
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails sx={{ p: 0 }}>
								<Box
									sx={{
										px: 2.5,
										py: 1.5,
										fontSize: '0.9rem',
										lineHeight: 1.7,
										color: 'text.secondary',
										'& p': { m: 0, mb: 0.5 },
										'& ul, & ol': { pl: 2.5, my: 0.5 },
									}}
									dangerouslySetInnerHTML={{ __html: curriculum.description }}
								/>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2.5,
										px: 2.5,
										py: 1.25,
										borderTop: '1px solid',
										borderColor: 'divider',
										bgcolor: 'background.paper',
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
										<EventIcon sx={{ fontSize: 18, color: 'primary.main' }} />
										<Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
											{curriculum.lectures.length} Live Class
										</Typography>
									</Box>
								</Box>
								{curriculum.lectures.map((lecture, index) => (
									<Box
										key={lecture._id ?? index}
										sx={{
											display: 'flex',
											gap: 1.25,
											alignItems: 'flex-start',
											px: 2.5,
											py: 1.5,
											borderTop: '1px solid',
											borderColor: 'divider',
										}}
									>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'flex-start',
													justifyContent: 'space-between',
													gap: 2,
													mb: 0.75,
												}}
											>
												<Typography variant='body2' sx={{ fontWeight: 800, color: '#111827' }}>
													{lecture.title}
												</Typography>
												<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
													<Chip
														icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
														label={formatLiveClassDate(lecture.day)}
														size='small'
														sx={{ bgcolor: '#e0f2fe', color: '#075985', fontWeight: 700, borderRadius: 1 }}
													/>
													<Chip
														icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
														label={formatLiveClassTime(lecture.time)}
														size='small'
														variant='outlined'
													/>
												</Box>
											</Box>
											{lecture.description && (
												<Typography variant='body2' color='text.secondary'>
													{lecture.description}
												</Typography>
											)}
										</Box>
									</Box>
								))}
							</AccordionDetails>
						</Accordion>
					))}
				</Box>
			)}

			{activeContentView === 'quizzes' && (
				<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
					{quizSections.map((section, si) => (
						<Accordion
							key={section._id}
							elevation={0}
							disableGutters
							defaultExpanded={si === 0}
							sx={{
								borderBottom: si < quizSections.length - 1 ? '1px solid' : 'none',
								borderColor: 'divider',
								'&::before': { display: 'none' },
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								sx={{ bgcolor: 'grey.50', minHeight: 48, '&.Mui-expanded': { minHeight: 48 } }}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
									<Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
										{section.title}
									</Typography>
									{section.isFreePreview && (
										<Chip
											label='Free Preview'
											size='small'
											sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'success.main', color: 'white' }}
										/>
									)}
								</Box>
							</AccordionSummary>
							<AccordionDetails sx={{ p: 0 }}>
								<List disablePadding>
									{section.banks.map((bank, bi) => (
										<ListItemButton
											key={bank._id}
											component={RouterLink}
											to={`/practice-quiz?courseId=${course._id}&bankId=${bank._id}`}
											sx={{
												px: 3,
												py: 1.5,
												borderBottom: bi < section.banks.length - 1 ? '1px solid' : 'none',
												borderColor: 'divider',
												display: 'flex',
												justifyContent: 'space-between',
											}}
										>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
												<QuizOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
												<Typography variant='body2' sx={{ fontWeight: 600 }}>
													{bank.title}
												</Typography>
											</Box>
											{(section.isFreePreview || bank.isFreePreview) && (
												<Chip
													label='Free Preview'
													size='small'
													variant='outlined'
													sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, borderColor: 'success.main', color: 'success.main' }}
												/>
											)}
										</ListItemButton>
									))}
								</List>
							</AccordionDetails>
						</Accordion>
					))}
					{quizSections.length === 0 && (
						<Box sx={{ p: 4, textAlign: 'center' }}>
							<Typography variant='body2' color='text.secondary'>
								No quizzes available for this course yet.
							</Typography>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default CourseContentAccordionTabs;
