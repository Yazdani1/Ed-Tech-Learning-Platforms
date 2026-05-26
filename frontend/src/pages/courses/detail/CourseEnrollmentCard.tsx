import { type FC } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Grid,
	Paper,
	Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import SchoolIcon from '@mui/icons-material/School';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ClassIcon from '@mui/icons-material/Class';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { ICourse, ISubscriptionPlanConfig } from '../../../types/index';
import { formatDate, formatDateTime } from '../../../utils/dateTime';
import { formatBdt, getCoursePriceInfo } from '../../../utils/pricing';

interface CourseEnrollmentCardProps {
	course: ICourse;
	isEnrolled: boolean;
	enrollmentDate: string | null;
	enrolling: boolean;
	subPlans: ISubscriptionPlanConfig[];
	selectedOption: 'subscription' | 'direct';
	setSelectedOption: React.Dispatch<React.SetStateAction<'subscription' | 'direct'>>;
	playingIntro: boolean;
	setPlayingIntro: React.Dispatch<React.SetStateAction<boolean>>;
	introVideoId: string | null;
	isStudent: boolean;
	isAdmin: boolean;
	isModerator: boolean;
	handleEnroll: () => Promise<void>;
	totalLectures: number;
	userActivePlan: string | undefined;
	userSubExpiry: string | undefined;
	isAuthenticated: boolean;
}

const CourseEnrollmentCard: FC<CourseEnrollmentCardProps> = ({
	course,
	isEnrolled,
	enrollmentDate,
	enrolling,
	subPlans,
	selectedOption,
	setSelectedOption,
	playingIntro,
	setPlayingIntro,
	introVideoId,
	isStudent,
	isAdmin,
	isModerator,
	handleEnroll,
	totalLectures,
	userActivePlan,
	userSubExpiry,
	isAuthenticated,
}) => {
	const navigate = useNavigate();

	const priceInfo = getCoursePriceInfo(course);
	const courseInSub =
		(course.includedInSubscription ?? false) &&
		(course.allowedSubscriptionPlans?.length ?? 0) > 0;
	const userSubValid =
		!!userActivePlan && !!userSubExpiry && new Date(userSubExpiry) > new Date();
	const userSubCoversThisCourse =
		courseInSub &&
		userSubValid &&
		(course.allowedSubscriptionPlans ?? []).includes(userActivePlan!);
	const userHasWrongPlan =
		courseInSub && isStudent && userSubValid && !userSubCoversThisCourse;
	const lowestSubPrice = subPlans
		.filter((p) => (course.allowedSubscriptionPlans ?? []).includes(p.plan))
		.reduce<number>((min, p) => Math.min(min, p.price), Infinity);
	const planCountMap = Object.fromEntries(
		subPlans.map((p) => [p.plan, p.courseCount]),
	) as Partial<Record<string, number>>;

	const courseHighlights = [
		{ icon: <OndemandVideoIcon sx={{ fontSize: 16 }} />, text: `${totalLectures} video lecture${totalLectures !== 1 ? 's' : ''}` },
		{ icon: <AllInclusiveIcon sx={{ fontSize: 16 }} />, text: 'Full lifetime access' },
		{ icon: <DevicesIcon sx={{ fontSize: 16 }} />, text: 'Access on any device' },
		{ icon: <WorkspacePremiumIcon sx={{ fontSize: 16 }} />, text: 'Certificate of completion' },
		...(course.courseType?.name ? [{ icon: <ClassIcon sx={{ fontSize: 16 }} />, text: `Type: ${course.courseType.name}` }] : []),
		...(course.startDate ? [{ icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />, text: `Starts: ${formatDate(course.startDate)}` }] : []),
		...(course.endDate ? [{ icon: <EventIcon sx={{ fontSize: 16 }} />, text: `Ends: ${formatDate(course.endDate)}` }] : []),
	];

	return (
		<Grid size={{ xs: 12, md: 4 }} sx={{ mt: { md: -32 }, zIndex: 10 }}>
			<Box sx={{ position: 'sticky', top: 90 }}>
				<Paper elevation={3} sx={{ borderRadius: 0.5, overflow: 'hidden' }}>
					{/* Intro video / cover image */}
					<Box sx={{ width: '100%', height: 200, bgcolor: 'grey.900', position: 'relative', overflow: 'hidden' }}>
						{introVideoId && playingIntro ? (
							<Box
								component='iframe'
								src={`https://www.youtube.com/embed/${introVideoId}?autoplay=1`}
								title='Course Introduction'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
								sx={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
							/>
						) : introVideoId ? (
							<Box
								sx={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
								onClick={() => setPlayingIntro(true)}
							>
								<Box
									component='img'
									src={
										course.coverImage ??
										`https://img.youtube.com/vi/${introVideoId}/hqdefault.jpg`
									}
									alt='Course Introduction'
									sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
								/>
								<Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)' }} />
								<Box
									sx={{
										position: 'absolute',
										inset: 0,
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 0.75,
									}}
								>
									<PlayCircleOutlinedIcon
										sx={{ fontSize: 56, color: 'white', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
									/>
									<Typography variant='caption' sx={{ color: 'white', fontWeight: 600, letterSpacing: 0.5 }}>
										Preview this course
									</Typography>
								</Box>
							</Box>
						) : course.coverImage ? (
							<Box
								component='img'
								src={course.coverImage}
								alt={course.title}
								sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
							/>
						) : (
							<Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<SchoolIcon sx={{ fontSize: 64, color: 'grey.600' }} />
							</Box>
						)}
					</Box>

					<Box sx={{ p: 3 }}>
						{isAdmin ? (
							<>
								{!isModerator && (
									<Button
										fullWidth
										variant='contained'
										size='large'
										startIcon={<EditIcon />}
										onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
										sx={{ fontWeight: 700, borderRadius: 2 }}
									>
										Edit Course
									</Button>
								)}
								<Button
									fullWidth
									variant='outlined'
									size='large'
									startIcon={<VisibilityOutlinedIcon />}
									onClick={() => navigate(`/admin/courses/${course._id}/learn`)}
									sx={{ fontWeight: 700, borderRadius: 2, mt: !isModerator ? 1.5 : 0 }}
								>
									Student View
								</Button>
								<Box sx={{ mt: 2 }}>
									{courseHighlights.map(({ icon, text }) => (
										<Box key={text} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
											<Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
											<Typography variant='body2'>{text}</Typography>
										</Box>
									))}
								</Box>
							</>
						) : isStudent && isEnrolled ? (
							<>
								<Button
									fullWidth
									variant='contained'
									size='large'
									color='success'
									startIcon={<SchoolIcon />}
									onClick={() => navigate(`/student/courses/${course._id}/learn`)}
									sx={{ fontWeight: 700, borderRadius: 2 }}
								>
									Go to this course
								</Button>
								{enrollmentDate && (
									<Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
										Enrolled on {formatDateTime(enrollmentDate)}
									</Typography>
								)}
								<Box sx={{ mt: 2 }}>
									{[
										{ icon: <OndemandVideoIcon sx={{ fontSize: 16 }} />, text: `${totalLectures} video lecture${totalLectures !== 1 ? 's' : ''}` },
										{ icon: <AllInclusiveIcon sx={{ fontSize: 16 }} />, text: 'Full lifetime access' },
										{ icon: <DevicesIcon sx={{ fontSize: 16 }} />, text: 'Access on any device' },
										{ icon: <WorkspacePremiumIcon sx={{ fontSize: 16 }} />, text: 'Certificate of completion' },
									].map(({ icon, text }) => (
										<Box key={text} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
											<Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
											<Typography variant='body2'>{text}</Typography>
										</Box>
									))}
								</Box>
							</>
						) : (
							<>
								{courseInSub && (
									<Box
										onClick={() => setSelectedOption('subscription')}
										sx={{
											border: '2px solid',
											borderColor: selectedOption === 'subscription' ? '#7c3aed' : 'divider',
											borderRadius: 2,
											p: 2,
											mb: 1.5,
											cursor: 'pointer',
											transition: 'border-color 0.15s',
											'&:hover': { borderColor: '#7c3aed' },
										}}
									>
										<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
											<Box
												sx={{
													width: 20,
													height: 20,
													borderRadius: '50%',
													flexShrink: 0,
													mt: 0.25,
													border: '2px solid',
													borderColor: selectedOption === 'subscription' ? '#7c3aed' : 'grey.400',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												{selectedOption === 'subscription' && (
													<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#7c3aed' }} />
												)}
											</Box>
											<Box>
												<Typography variant='body2' sx={{ fontWeight: 700 }}>
													Subscribe and save
												</Typography>
												{lowestSubPrice < Infinity ? (
													<Typography variant='caption' color='text.secondary'>
														From ৳{lowestSubPrice.toLocaleString()} /month
													</Typography>
												) : (
													<Typography variant='caption' color='text.secondary'>
														View subscription plans
													</Typography>
												)}
											</Box>
										</Box>

										{selectedOption === 'subscription' && (
											<Box sx={{ mt: 2 }}>
												{userSubCoversThisCourse ? (
													<>
														<Box
															sx={{
																display: 'flex',
																gap: 1,
																alignItems: 'flex-start',
																bgcolor: '#f0fdf4',
																border: '1px solid #bbf7d0',
																borderRadius: 1.5,
																p: 1.5,
																mb: 2,
															}}
														>
															<VerifiedIcon sx={{ color: '#16a34a', fontSize: 18, flexShrink: 0, mt: 0.1 }} />
															<Box>
																<Typography variant='caption' sx={{ fontWeight: 700, color: '#166534', display: 'block' }}>
																	Get this course free with your subscription
																</Typography>
																<Typography variant='caption' color='text.secondary'>
																	{userActivePlan} plan · Expires {formatDate(userSubExpiry!)}
																	{(planCountMap[userActivePlan!] ?? 0) > 0 &&
																		` · ${planCountMap[userActivePlan!]} courses included`}
																</Typography>
															</Box>
														</Box>
														<Button
															fullWidth
															variant='contained'
															size='large'
															disabled={enrolling}
															onClick={(e) => { e.stopPropagation(); void handleEnroll(); }}
															startIcon={<CardMembershipIcon />}
															sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
														>
															{enrolling ? <CircularProgress size={22} color='inherit' /> : 'Enroll with Subscription'}
														</Button>
													</>
												) : userHasWrongPlan ? (
													<>
														<Box
															sx={{ bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1.5, p: 1.5, mb: 2 }}
														>
															<Typography variant='caption' sx={{ fontWeight: 700, color: '#92400e', display: 'block', mb: 1 }}>
																Plan upgrade required to enroll free
															</Typography>
															<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
																<Typography variant='caption' color='text.secondary'>Your current plan</Typography>
																<Chip
																	label={userActivePlan}
																	size='small'
																	sx={{ bgcolor: '#0284c7', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
																/>
															</Box>
															<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
																<Typography variant='caption' color='text.secondary'>Required plan</Typography>
																<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
																	{course.allowedSubscriptionPlans.map((p) => (
																		<Chip
																			key={p}
																			label={p}
																			size='small'
																			sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
																		/>
																	))}
																</Box>
															</Box>
															{course.allowedSubscriptionPlans.map(
																(p) =>
																	(planCountMap[p] ?? 0) > 0 && (
																		<Typography
																			key={p}
																			variant='caption'
																			color='text.secondary'
																			sx={{ display: 'block', textAlign: 'right', mb: 0.25 }}
																		>
																			{planCountMap[p]} courses free with {p}
																		</Typography>
																	),
															)}
														</Box>
														<Button
															fullWidth
															variant='outlined'
															size='medium'
															component={RouterLink}
															to='/pricing'
															onClick={(e) => e.stopPropagation()}
															startIcon={<CardMembershipIcon />}
															sx={{
																fontWeight: 600,
																borderRadius: 2,
																color: '#92400e',
																borderColor: '#f97316',
																'&:hover': { bgcolor: '#fff7ed', borderColor: '#ea580c' },
															}}
														>
															Upgrade Subscription
														</Button>
													</>
												) : (
													<>
														<Box
															sx={{
																display: 'flex',
																gap: 1,
																alignItems: 'flex-start',
																bgcolor: '#f0fdf4',
																border: '1px solid #bbf7d0',
																borderRadius: 1.5,
																p: 1.5,
																mb: 1.5,
															}}
														>
															<VerifiedIcon sx={{ color: '#16a34a', fontSize: 18, flexShrink: 0, mt: 0.1 }} />
															<Typography variant='caption' sx={{ color: '#166534' }}>
																<strong>Get this course for free</strong> when you subscribe. Terms apply.
															</Typography>
														</Box>
														{course.allowedSubscriptionPlans.map((p) => {
															const count = planCountMap[p] ?? 0;
															return (
																<Box key={p} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
																	<LocalOfferIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
																	<Typography variant='caption' color='text.secondary'>
																		<strong>{p}</strong> plan
																		{count > 0 && ` · access to ${count} course${count !== 1 ? 's' : ''} for free`}
																	</Typography>
																</Box>
															);
														})}
														<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
															<AllInclusiveIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
															<Typography variant='caption' color='text.secondary'>Cancel anytime</Typography>
														</Box>
														<Button
															fullWidth
															variant='contained'
															size='large'
															component={RouterLink}
															to={isAuthenticated ? '/pricing' : '/auth/register'}
															onClick={(e) => e.stopPropagation()}
															sx={{ fontWeight: 700, borderRadius: 2, mt: 1.5, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
														>
															{isAuthenticated ? 'View Subscription Plans' : 'Start Subscription'}
														</Button>
													</>
												)}
											</Box>
										)}
									</Box>
								)}

								<Box
									onClick={() => courseInSub && setSelectedOption('direct')}
									sx={{
										border: courseInSub ? '2px solid' : 'none',
										borderColor: selectedOption === 'direct' ? 'primary.main' : 'divider',
										borderRadius: courseInSub ? 2 : 0,
										p: courseInSub ? 2 : 0,
										cursor: courseInSub ? 'pointer' : 'default',
										transition: 'border-color 0.15s',
										'&:hover': courseInSub ? { borderColor: 'primary.main' } : {},
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: courseInSub ? 1.5 : 0 }}>
										{courseInSub && (
											<Box
												sx={{
													width: 20,
													height: 20,
													borderRadius: '50%',
													flexShrink: 0,
													mt: 0.25,
													border: '2px solid',
													borderColor: selectedOption === 'direct' ? 'primary.main' : 'grey.400',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												{selectedOption === 'direct' && (
													<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
												)}
											</Box>
										)}
										<Box>
											<Typography variant='body2' sx={{ fontWeight: 700 }}>
												{course.pricing === 'Free' ? 'Enroll for free' : 'Buy this course'}
											</Typography>
											{course.pricing === 'Free' || !priceInfo ? (
												<Typography variant='h5' sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.25 }}>
													Free
												</Typography>
											) : (
												<Box sx={{ mt: 0.25 }}>
													<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
														<Typography variant='h5' sx={{ fontWeight: 900, lineHeight: 1.2 }}>
															{formatBdt(priceInfo.discountPrice)}
														</Typography>
														{priceInfo.hasDiscount && (
															<Chip
																label={`${priceInfo.discountPercent}% off`}
																size='small'
																color='success'
																sx={{ height: 24, fontSize: '0.75rem', fontWeight: 800 }}
															/>
														)}
													</Box>
													{priceInfo.hasDiscount && (
														<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
															List price{' '}
															<Box component='span' sx={{ textDecoration: 'line-through', fontWeight: 700 }}>
																{formatBdt(priceInfo.listPrice)}
															</Box>{' '}
															You save {formatBdt(priceInfo.discountAmount)}
														</Typography>
													)}
												</Box>
											)}
										</Box>
									</Box>

									{(selectedOption === 'direct' || !courseInSub) && (
										<Box sx={{ mt: courseInSub ? 2 : 1.5 }}>
											{[
												{ icon: <WorkspacePremiumIcon sx={{ fontSize: 15 }} />, text: 'Certificate of completion' },
												{ icon: <AllInclusiveIcon sx={{ fontSize: 15 }} />, text: 'Full lifetime access' },
												{ icon: <DevicesIcon sx={{ fontSize: 15 }} />, text: 'Access on any device' },
											].map(({ icon, text }) => (
												<Box key={text} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
													<Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
													<Typography variant='caption' color='text.secondary'>{text}</Typography>
												</Box>
											))}
											<Box sx={{ mt: 1.5 }}>
												{isStudent ? (
													<Button
														fullWidth
														variant='contained'
														size='large'
														disabled={enrolling}
														onClick={(e) => { e.stopPropagation(); void handleEnroll(); }}
														sx={{ fontWeight: 700, borderRadius: 2 }}
													>
														{enrolling ? (
															<CircularProgress size={22} color='inherit' />
														) : course.pricing === 'Free' ? (
															'Enroll Now – Free'
														) : priceInfo?.hasDiscount ? (
															`Buy Now - ${formatBdt(priceInfo.discountPrice)}`
														) : (
															'Buy Now'
														)}
													</Button>
												) : (
													<>
														<Button
															fullWidth
															variant='contained'
															size='large'
															component={RouterLink}
															to='/auth/register'
															onClick={(e) => e.stopPropagation()}
															sx={{ fontWeight: 700, borderRadius: 2, mb: 1 }}
														>
															{course.pricing === 'Free' ? 'Enroll Free' : 'Get Started'}
														</Button>
														<Button
															fullWidth
															variant='outlined'
															size='large'
															component={RouterLink}
															to='/auth/login'
															onClick={(e) => e.stopPropagation()}
															sx={{ fontWeight: 600, borderRadius: 2 }}
														>
															Sign In
														</Button>
													</>
												)}
											</Box>
										</Box>
									)}
								</Box>

								<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
									<OndemandVideoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
									<Typography variant='caption' color='text.secondary'>
										{totalLectures} on-demand video lecture{totalLectures !== 1 ? 's' : ''}
									</Typography>
								</Box>
							</>
						)}
					</Box>
				</Paper>
			</Box>
		</Grid>
	);
};

export default CourseEnrollmentCard;
