import type { FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Chip, Container, Grid, Typography } from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import type { ICourse } from '../../../types/index';
import { formatBdt, getCoursePriceInfo } from '../../../utils/pricing';

interface CourseDetailHeroSectionProps {
	course: ICourse;
}

const CourseDetailHeroSection: FC<CourseDetailHeroSectionProps> = ({ course }) => {
	const priceInfo = getCoursePriceInfo(course);

	return (
		<Box sx={{ bgcolor: '#1c1d1f', color: 'white', py: { xs: 5, md: 7 } }}>
			<Container maxWidth='lg'>
				<Grid container spacing={4}>
					<Grid size={{ xs: 12, md: 8 }}>
						<Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
							<Typography
								component={RouterLink}
								to='/'
								variant='caption'
								sx={{
									color: '#a78bfa',
									textDecoration: 'none',
									'&:hover': { textDecoration: 'underline' },
								}}
							>
								Home
							</Typography>
							{course.category?.name && (
								<>
									<Typography variant='caption' sx={{ color: 'grey.500' }}>
										»
									</Typography>
									<Typography variant='caption' sx={{ color: '#a78bfa' }}>
										{course.category.name}
									</Typography>
								</>
							)}
							{course.courseType?.name && (
								<>
									<Typography variant='caption' sx={{ color: 'grey.500' }}>
										»
									</Typography>
									<Typography variant='caption' sx={{ color: '#a78bfa' }}>
										{course.courseType.name}
									</Typography>
								</>
							)}
						</Box>

						<Typography
							variant='h4'
							sx={{
								fontWeight: 800,
								mb: 1.5,
								lineHeight: 1.25,
								fontSize: { xs: '1.6rem', md: '2rem' },
							}}
						>
							{course.title}
						</Typography>

						{course.subtitle && (
							<Typography
								variant='h6'
								sx={{
									fontWeight: 400,
									opacity: 0.85,
									mb: 2,
									fontSize: { xs: '1rem', md: '1.15rem' },
								}}
							>
								{course.subtitle}
							</Typography>
						)}

						<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
							<Chip
								label={course.status}
								size='small'
								sx={{
									bgcolor: course.status === 'Published' ? '#16a34a' : '#6b7280',
									color: 'white',
									fontWeight: 600,
								}}
							/>
							<Chip
								label={
									course.pricing === 'Paid'
										? priceInfo?.hasDiscount
											? `${formatBdt(priceInfo.discountPrice)} (${priceInfo.discountPercent}% off)`
											: formatBdt(priceInfo?.discountPrice ?? course.price)
										: 'Free'
								}
								size='small'
								sx={{
									bgcolor: course.pricing === 'Free' ? '#0284c7' : '#d97706',
									color: 'white',
									fontWeight: 600,
								}}
							/>
							{course.courseType?.name && (
								<Chip
									icon={
										<ClassIcon
											sx={{
												fontSize: '14px !important',
												color: 'white !important',
											}}
										/>
									}
									label={course.courseType.name}
									size='small'
									sx={{ bgcolor: '#0f766e', color: 'white', fontWeight: 600 }}
								/>
							)}
							{course.includedInSubscription && (
								<Chip
									label='Subscription'
									size='small'
									sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600 }}
								/>
							)}
						</Box>

						{course.teachers?.length > 0 && (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 1,
									flexWrap: 'wrap',
								}}
							>
								<Typography variant='body2' sx={{ opacity: 0.75 }}>
									Created by
								</Typography>
								{course.teachers.map((t, i) => (
									<Typography
										key={t._id}
										variant='body2'
										sx={{ color: '#a78bfa', fontWeight: 500 }}
									>
										{t.name}
										{i < course.teachers.length - 1 ? ',' : ''}
									</Typography>
								))}
							</Box>
						)}
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default CourseDetailHeroSection;
