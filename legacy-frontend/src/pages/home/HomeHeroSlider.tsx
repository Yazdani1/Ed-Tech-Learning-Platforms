import { type FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { IHomeHeroPost } from '../../types/index';

const HOME_HERO_FALLBACK_IMAGE =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2048 460'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0' stop-color='%230b1f4d'/%3E%3Cstop offset='0.56' stop-color='%231b6dc8'/%3E%3Cstop offset='1' stop-color='%2308a5dd'/%3E%3C/linearGradient%3E%3CradialGradient id='b' cx='0.14' cy='0.42' r='0.45'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.18'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='c' cx='0.83' cy='0.48' r='0.2'%3E%3Cstop offset='0' stop-color='%237dd3fc' stop-opacity='0.22'/%3E%3Cstop offset='1' stop-color='%237dd3fc' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='2048' height='460' fill='url(%23a)'/%3E%3Ccircle cx='1960' cy='88' r='164' fill='%23ffffff' opacity='0.1'/%3E%3Ccircle cx='58' cy='278' r='132' fill='%23ffffff' opacity='0.1'/%3E%3Crect width='2048' height='460' fill='url(%23b)'/%3E%3Crect width='2048' height='460' fill='url(%23c)'/%3E%3C/svg%3E";
const SHOW_LEGACY_HERO_COPY = Boolean(import.meta.env.VITE_SHOW_LEGACY_HERO_COPY);

interface HomeHeroSliderProps {
	heroPosts: IHomeHeroPost[];
	heroSlide: number;
	setHeroSlide: React.Dispatch<React.SetStateAction<number>>;
}

const HomeHeroSlider: FC<HomeHeroSliderProps> = ({ heroPosts, heroSlide, setHeroSlide }) => {
	return (
		<Box sx={{ position: 'relative', overflow: 'hidden', background: 'background.default', color: 'white' }}>
			{heroPosts.length > 0 ? (
				<Box
					sx={{
						position: 'relative',
						height: { xs: 320, sm: 380, md: 446 },
						bgcolor: 'grey.100',
						'&:hover .hero-slider-arrow, &:focus-within .hero-slider-arrow': {
							opacity: 1,
							pointerEvents: 'auto',
						},
					}}
				>
					{heroPosts.map((post, index) => (
						<Box
							key={post._id}
							component='img'
							src={post.imageUrl}
							alt=''
							loading={index === 0 ? 'eager' : 'lazy'}
							sx={{
								position: 'absolute',
								inset: 0,
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								opacity: index === heroSlide ? 1 : 0,
								transform: index === heroSlide ? 'scale(1)' : 'scale(1.04)',
								filter: index === heroSlide ? 'none' : 'saturate(0.9)',
								transition: 'opacity 0.65s ease, transform 1.1s ease, filter 0.65s ease',
							}}
						/>
					))}
					{heroPosts.length > 1 && (
						<>
							<IconButton
								className='hero-slider-arrow'
								aria-label='Previous header image'
								onClick={() => setHeroSlide((current) => (current - 1 + heroPosts.length) % heroPosts.length)}
								sx={{
									position: 'absolute',
									left: { xs: 12, md: 24 },
									top: '50%',
									transform: 'translateY(-50%)',
									width: { xs: 42, md: 50 },
									height: { xs: 42, md: 50 },
									opacity: 0,
									pointerEvents: 'none',
									bgcolor: '#0ea5e9',
									color: 'common.white',
									border: '2px solid rgba(255,255,255,0.8)',
									boxShadow: '0 14px 34px rgba(14, 165, 233, 0.38)',
									transition: 'opacity 0.22s ease, transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
									'&:hover': {
										bgcolor: '#0369a1',
										transform: 'translateY(-50%) scale(1.08)',
										boxShadow: '0 18px 42px rgba(14, 165, 233, 0.48)',
									},
								}}
							>
								<ChevronLeftIcon sx={{ fontSize: 30 }} />
							</IconButton>
							<IconButton
								className='hero-slider-arrow'
								aria-label='Next header image'
								onClick={() => setHeroSlide((current) => (current + 1) % heroPosts.length)}
								sx={{
									position: 'absolute',
									right: { xs: 12, md: 24 },
									top: '50%',
									transform: 'translateY(-50%)',
									width: { xs: 42, md: 50 },
									height: { xs: 42, md: 50 },
									opacity: 0,
									pointerEvents: 'none',
									bgcolor: '#0ea5e9',
									color: 'common.white',
									border: '2px solid rgba(255,255,255,0.8)',
									boxShadow: '0 14px 34px rgba(14, 165, 233, 0.38)',
									transition: 'opacity 0.22s ease, transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
									'&:hover': {
										bgcolor: '#0369a1',
										transform: 'translateY(-50%) scale(1.08)',
										boxShadow: '0 18px 42px rgba(14, 165, 233, 0.48)',
									},
								}}
							>
								<ChevronRightIcon sx={{ fontSize: 30 }} />
							</IconButton>
							<Box
								sx={{
									position: 'absolute',
									left: 0,
									right: 0,
									bottom: 18,
									display: 'flex',
									justifyContent: 'center',
									gap: 1,
								}}
							>
								{heroPosts.map((post, index) => (
									<Box
										key={post._id}
										component='button'
										aria-label={`Show header image ${index + 1}`}
										onClick={() => setHeroSlide(index)}
										sx={{
											width: index === heroSlide ? 22 : 8,
											height: 8,
											border: 0,
											borderRadius: 8,
											p: 0,
											cursor: 'pointer',
											bgcolor: index === heroSlide ? '#facc15' : 'rgba(250,204,21,0.48)',
											boxShadow: index === heroSlide ? '0 0 16px rgba(250,204,21,0.55)' : 'none',
											transition: 'width 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
										}}
									/>
								))}
							</Box>
						</>
					)}
				</Box>
			) : (
				<>
					<Box
						component='img'
						src={HOME_HERO_FALLBACK_IMAGE}
						alt=''
						sx={{ width: '100%', height: { xs: 320, sm: 380, md: 446 }, objectFit: 'cover', display: 'block' }}
					/>
					{SHOW_LEGACY_HERO_COPY && (
						<>
							<Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
							<Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
							<Box sx={{ position: 'absolute', top: '30%', right: '15%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(2,136,209,0.25)', pointerEvents: 'none' }} />
							<Container maxWidth='lg' sx={{ position: 'relative' }}>
								<Box sx={{ maxWidth: 620 }}>
									<Typography
										variant='h2'
										sx={{ fontWeight: 900, lineHeight: 1.15, mb: 2.5, fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' }, letterSpacing: -1 }}
									>
										Learn Without
										<Box component='span' sx={{ color: '#7ec8f8' }}> Limits</Box>
									</Typography>
									<Typography
										variant='h6'
										sx={{ fontWeight: 400, opacity: 0.88, mb: 4, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.15rem' } }}
									>
										Explore expert-taught courses in technology, design, business, and more. Advance your career at your own pace — anytime, anywhere.
									</Typography>
									<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
										<Button
											size='large'
											onClick={() => document.getElementById('courses-section')?.scrollIntoView({ behavior: 'smooth' })}
											sx={{ bgcolor: 'white', color: 'primary.dark', fontWeight: 700, px: 4, borderRadius: 2, '&:hover': { bgcolor: 'grey.100' } }}
										>
											Explore Courses
										</Button>
										<Button
											size='large'
											variant='outlined'
											component={RouterLink}
											to='/auth/register'
											sx={{ borderColor: 'rgba(255,255,255,0.7)', color: 'white', fontWeight: 700, px: 4, borderRadius: 2, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
										>
											Start Free Today
										</Button>
									</Box>
								</Box>
							</Container>
						</>
					)}
				</>
			)}
		</Box>
	);
};

export default HomeHeroSlider;
