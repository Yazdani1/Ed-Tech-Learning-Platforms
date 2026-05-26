import { type FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, CardActionArea, Container, Grid, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CategoryIcon from '@mui/icons-material/Category';
import type { ICategory } from '../../types/index';
import { encodeParam } from '../../utils/urlParams';

const CATEGORY_GRADIENTS = [
	'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
	'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
	'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)',
	'linear-gradient(135deg, #86198f 0%, #ec4899 100%)',
	'linear-gradient(135deg, #166534 0%, #84cc16 100%)',
	'linear-gradient(135deg, #4338ca 0%, #a78bfa 100%)',
];

interface HomeCategoryGridProps {
	categories: ICategory[];
}

const HomeCategoryGrid: FC<HomeCategoryGridProps> = ({ categories }) => {
	if (categories.length === 0) return null;

	return (
		<Box sx={{ bgcolor: 'background.paper' }}>
			<Container maxWidth='xl' sx={{ pt: 7, pb: 6 }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: { xs: 'flex-start', md: 'flex-end' },
						gap: 2,
						mb: 3,
						flexDirection: { xs: 'column', md: 'row' },
					}}
				>
					<Box>
						<Typography variant='h4' sx={{ fontWeight: 800 }}>Explore by Category</Typography>
						<Typography variant='body1' color='text.secondary' sx={{ mt: 0.5 }}>
							Pick a subject and jump straight into matching courses.
						</Typography>
					</Box>
					<Button component={RouterLink} to='/courses' endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 700 }}>
						View all courses
					</Button>
				</Box>

				<Grid container spacing={2.5}>
					{categories.map((category, index) => {
						const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
						const initial = category.name.trim().charAt(0).toUpperCase();

						return (
							<Grid key={category._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
								<CardActionArea
									component={RouterLink}
									to={`/courses?categories=${encodeParam(category._id)}`}
									sx={{
										position: 'relative',
										overflow: 'hidden',
										display: 'flex',
										alignItems: 'center',
										gap: 1.75,
										minHeight: 118,
										p: 2,
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'divider',
										bgcolor: 'background.paper',
										textDecoration: 'none',
										boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
										transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
										'&::before': {
											content: '""',
											position: 'absolute',
											inset: -1,
											background: `${gradient}, radial-gradient(circle at 18% 20%, rgba(255,255,255,0.46), transparent 34%), linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.58) 42%, transparent 58%)`,
											backgroundSize: '260% 260%, 180% 180%, 240% 100%',
											backgroundPosition: '0% 50%, -160% 0',
											opacity: 0.26,
											animation: 'categoryGradientShift 4.8s ease-in-out infinite, categoryAmbientShine 3.8s ease-in-out infinite',
											transition: 'opacity 0.25s ease',
										},
										'&::after': {
											content: '""',
											position: 'absolute',
											top: 0,
											left: '-80%',
											width: '55%',
											height: '100%',
											background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
											transform: 'skewX(-18deg)',
											opacity: 0,
											transition: 'opacity 0.2s ease',
										},
										'&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 38px rgba(15,23,42,0.13)', borderColor: 'primary.light' },
										'&:hover::before': { opacity: 0.34 },
										'&:hover::after': { opacity: 1, animation: 'categoryShine 0.85s ease' },
										'&:hover .category-icon': { transform: 'translateY(-2px) rotate(-3deg) scale(1.04)' },
										'&:hover .category-arrow': { opacity: 1, transform: 'translateX(0)' },
										'@keyframes categoryGradientShift': {
											'0%, 100%': { backgroundPosition: '0% 50%, 12% 18%, -160% 0' },
											'50%': { backgroundPosition: '100% 50%, 86% 72%, 80% 0' },
										},
										'@keyframes categoryAmbientShine': {
											'0%, 30%': { filter: 'saturate(1.08) brightness(1)' },
											'60%': { filter: 'saturate(1.35) brightness(1.08)' },
											'100%': { filter: 'saturate(1.08) brightness(1)' },
										},
										'@keyframes categoryShine': {
											'0%': { left: '-80%' },
											'100%': { left: '125%' },
										},
									}}
								>
									<Box
										className='category-icon'
										sx={{
											position: 'relative',
											width: 52,
											height: 52,
											borderRadius: 1,
											flexShrink: 0,
											display: 'grid',
											placeItems: 'center',
											color: 'white',
											background: gradient,
											backgroundSize: '260% 260%',
											boxShadow: '0 10px 22px rgba(15,23,42,0.18)',
											animation: 'categoryIconGradient 4.5s ease-in-out infinite, categoryIconFloat 3.8s ease-in-out infinite',
											transition: 'transform 0.25s ease',
											'&::after': {
												content: '""',
												position: 'absolute',
												inset: 6,
												borderRadius: 0.75,
												border: '1px solid rgba(255,255,255,0.35)',
												opacity: 0.75,
											},
											'@keyframes categoryIconFloat': {
												'0%, 100%': { boxShadow: '0 10px 22px rgba(15,23,42,0.18)' },
												'50%': { boxShadow: '0 14px 28px rgba(15,23,42,0.24)' },
											},
											'@keyframes categoryIconGradient': {
												'0%, 100%': { backgroundPosition: '0% 50%', filter: 'saturate(1.1)' },
												'50%': { backgroundPosition: '100% 50%', filter: 'saturate(1.45) brightness(1.1)' },
											},
										}}
									>
										{initial ? (
											<Typography variant='h5' sx={{ fontWeight: 900, lineHeight: 1 }}>{initial}</Typography>
										) : (
											<CategoryIcon />
										)}
									</Box>

									<Box sx={{ position: 'relative', minWidth: 0, flex: 1 }}>
										<Typography variant='subtitle1' sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.25, overflowWrap: 'anywhere' }}>
											{category.name}
										</Typography>
										<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75, fontWeight: 600 }}>
											Browse category courses
										</Typography>
									</Box>

									<ArrowForwardIcon
										className='category-arrow'
										sx={{ position: 'relative', color: 'text.secondary', opacity: 0.45, transform: 'translateX(-4px)', transition: 'opacity 0.25s ease, transform 0.25s ease' }}
									/>
								</CardActionArea>
							</Grid>
						);
					})}
				</Grid>
			</Container>
		</Box>
	);
};

export default HomeCategoryGrid;
