import { type FC } from 'react';
import {
	Avatar,
	Box,
	Chip,
	IconButton,
	Paper,
	Tooltip,
	Typography,
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import type { ICourse } from '../../../types/index';

interface CourseLearningTeacherTabProps {
	course: ICourse;
}

const CourseLearningTeacherTab: FC<CourseLearningTeacherTabProps> = ({ course }) => {
	return (
		<Box sx={{ p: { xs: 3, md: 4 }, maxWidth: 860 }}>
			<Typography variant='h5' sx={{ fontWeight: 700, mb: 1 }}>
				Your Instructor{(course.teachers?.length ?? 0) > 1 ? 's' : ''}
			</Typography>
			<Typography
				variant='body2'
				color='text.secondary'
				sx={{ mb: 4 }}
			>
				{course.teachers?.length ?? 0} instructor
				{(course.teachers?.length ?? 0) !== 1 ? 's' : ''} teaching
				this course
			</Typography>

			{(course.teachers?.length ?? 0) === 0 ? (
				<Typography color='text.secondary'>
					No instructors listed for this course.
				</Typography>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							sm: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
							xl: 'repeat(auto-fill, minmax(340px, 1fr))',
						},
						gap: 3,
						width: '100%',
					}}
				>
					{course.teachers.map((teacher) => {
						const hasSocials =
							teacher.socialLinks &&
							Object.values(teacher.socialLinks).some(Boolean);

						return (
							<Box key={teacher._id} sx={{ minWidth: 0 }}>
								<Paper
									variant='outlined'
									sx={{
										height: '100%',
										borderRadius: 1,
										overflow: 'hidden',
										display: 'flex',
										flexDirection: 'column',
										bgcolor: 'background.paper',
										transition: 'transform 0.25s ease, box-shadow 0.25s ease',
										'&:hover': {
											transform: 'translateY(-4px)',
											boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
										},
									}}
								>
									<Box
										sx={{
											height: 108,
											background:
												'linear-gradient(135deg, #0f766e 0%, #2563eb 55%, #7c3aed 100%)',
											position: 'relative',
										}}
									>
										<Avatar
											src={teacher.profileImage}
											alt={teacher.name}
											sx={{
												width: 96,
												height: 96,
												position: 'absolute',
												left: '50%',
												bottom: -48,
												transform: 'translateX(-50%)',
												border: '4px solid white',
												bgcolor: 'primary.main',
												fontSize: 34,
												fontWeight: 800,
												boxShadow: '0 10px 28px rgba(15,23,42,0.2)',
											}}
										>
											{teacher.name.charAt(0).toUpperCase()}
										</Avatar>
									</Box>

									<Box
										sx={{
											pt: 7,
											px: 3,
											pb: 3,
											flex: 1,
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											textAlign: 'center',
										}}
									>
										<Typography variant='h6' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
											{teacher.name}
										</Typography>

										{teacher.expertise?.length > 0 && (
											<Box
												sx={{
													display: 'flex',
													gap: 0.75,
													flexWrap: 'wrap',
													justifyContent: 'center',
													mt: 1.5,
												}}
											>
												{teacher.expertise.slice(0, 4).map((exp) => (
													<Chip
														key={exp}
														label={exp}
														size='small'
														sx={{
															fontWeight: 700,
															bgcolor: 'rgba(37,99,235,0.08)',
															color: 'primary.main',
														}}
													/>
												))}
												{teacher.expertise.length > 4 && (
													<Chip label={`+${teacher.expertise.length - 4}`} size='small' />
												)}
											</Box>
										)}

										{teacher.bio && (
											<Typography
												variant='body2'
												color='text.secondary'
												sx={{
													mt: 2,
													lineHeight: 1.7,
													display: '-webkit-box',
													WebkitLineClamp: 4,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
												}}
											>
												{teacher.bio}
											</Typography>
										)}

										<Box sx={{ flexGrow: 1 }} />

										{hasSocials && (
											<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2.5 }}>
												{teacher.socialLinks?.website && (
													<Tooltip title='Website'>
														<IconButton component='a' href={teacher.socialLinks.website} target='_blank' size='small' sx={{ color: '#10b981', bgcolor: 'rgba(16,185,129,0.1)' }}>
															<LanguageIcon fontSize='small' />
														</IconButton>
													</Tooltip>
												)}
												{teacher.socialLinks?.linkedin && (
													<Tooltip title='LinkedIn'>
														<IconButton component='a' href={teacher.socialLinks.linkedin} target='_blank' size='small' sx={{ color: '#0A66C2', bgcolor: 'rgba(10,102,194,0.1)' }}>
															<LinkedInIcon fontSize='small' />
														</IconButton>
													</Tooltip>
												)}
												{teacher.socialLinks?.twitter && (
													<Tooltip title='Twitter'>
														<IconButton component='a' href={teacher.socialLinks.twitter} target='_blank' size='small' sx={{ color: '#1DA1F2', bgcolor: 'rgba(29,161,242,0.1)' }}>
															<TwitterIcon fontSize='small' />
														</IconButton>
													</Tooltip>
												)}
											</Box>
										)}
									</Box>
								</Paper>
							</Box>
						);
					})}
				</Box>
			)}
		</Box>
	);
};

export default CourseLearningTeacherTab;
