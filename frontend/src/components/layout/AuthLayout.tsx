import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import {
	Box,
	Chip,
	Container,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import PublicNavbar from './PublicNavbar';

interface CornerArtProps {
	position: 'topLeft' | 'bottomLeft' | 'bottomRight';
}

const CornerArt: FC<CornerArtProps> = ({ position }) => {
	const placement =
		position === 'topLeft'
			? { top: { xs: 82, md: 96 }, left: { xs: 12, md: 28 } }
			: position === 'bottomLeft'
				? { bottom: { xs: 16, md: 32 }, left: { xs: 12, md: 36 } }
				: { bottom: { xs: 16, md: 34 }, right: { xs: 12, md: 38 } };

	const Icon =
		position === 'topLeft'
			? MenuBookIcon
			: position === 'bottomLeft'
				? SchoolIcon
				: TipsAndUpdatesIcon;

	return (
		<Box
			aria-hidden='true'
			sx={{
				position: 'absolute',
				...placement,
				width: { xs: 118, md: 156 },
				height: { xs: 118, md: 156 },
				pointerEvents: 'none',
				opacity: { xs: 0.28, md: 0.42 },
				display: { xs: 'none', sm: 'block' },
				animation: `${position}Float 7s ease-in-out infinite`,
				'@keyframes topLeftFloat': {
					'0%, 100%': { transform: 'translate3d(0, 0, 0)' },
					'50%': { transform: 'translate3d(8px, 10px, 0)' },
				},
				'@keyframes bottomLeftFloat': {
					'0%, 100%': { transform: 'translate3d(0, 0, 0)' },
					'50%': { transform: 'translate3d(10px, -8px, 0)' },
				},
				'@keyframes bottomRightFloat': {
					'0%, 100%': { transform: 'translate3d(0, 0, 0)' },
					'50%': { transform: 'translate3d(-10px, -8px, 0)' },
				},
			}}
		>
			<Box
				sx={{
					position: 'absolute',
					inset: -26,
					borderRadius: '50%',
					background:
						position === 'bottomRight'
							? 'radial-gradient(circle, rgba(124,58,237,0.22), rgba(14,165,233,0.08) 46%, transparent 68%)'
							: 'radial-gradient(circle, rgba(20,184,166,0.2), rgba(21,101,192,0.1) 48%, transparent 70%)',
					filter: 'blur(10px)',
					animation: 'authGlowPulse 4.8s ease-in-out infinite',
					'@keyframes authGlowPulse': {
						'0%, 100%': { opacity: 0.65, transform: 'scale(0.94)' },
						'50%': { opacity: 1, transform: 'scale(1.08)' },
					},
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					inset: 0,
					border: '1px solid',
					borderColor: 'primary.main',
					borderRadius: 1,
					transform: position === 'bottomRight' ? 'rotate(8deg)' : 'rotate(-8deg)',
					animation: 'authFrameHue 6s ease-in-out infinite',
					'@keyframes authFrameHue': {
						'0%, 100%': { borderColor: '#1565c0' },
						'50%': { borderColor: '#14b8a6' },
					},
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					inset: 18,
					border: '1px dashed',
					borderColor: 'primary.main',
					borderRadius: 1,
					transform: position === 'bottomRight' ? 'rotate(-7deg)' : 'rotate(7deg)',
					animation: 'authDashHue 6s ease-in-out infinite reverse',
					'@keyframes authDashHue': {
						'0%, 100%': { borderColor: '#7c3aed' },
						'50%': { borderColor: '#0ea5e9' },
					},
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: { xs: 54, md: 66 },
					height: { xs: 54, md: 66 },
					borderRadius: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: 'background.paper',
					color: 'primary.main',
					border: '1px solid',
					borderColor: 'divider',
					boxShadow: '0 14px 34px rgba(15,23,42,0.08)',
					animation: 'authIconColor 5s ease-in-out infinite',
					'@keyframes authIconColor': {
						'0%, 100%': { color: '#1565c0' },
						'50%': { color: '#0f766e' },
					},
				}}
			>
				<Icon sx={{ fontSize: { xs: 28, md: 34 } }} />
			</Box>
			<Box
				sx={{
					position: 'absolute',
					width: 52,
					height: 34,
					right: position === 'bottomRight' ? 'auto' : -10,
					left: position === 'bottomRight' ? -10 : 'auto',
					bottom: 10,
					backgroundImage:
						'radial-gradient(circle, rgba(21,101,192,0.36) 1.4px, transparent 1.4px)',
					backgroundSize: '10px 10px',
				}}
			/>
		</Box>
	);
};

const AuthLayout= () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative', overflow: 'hidden' }}>
      <PublicNavbar />
      <CornerArt position='topLeft' />
      <CornerArt position='bottomLeft' />
      <CornerArt position='bottomRight' />
      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 7 } }}>
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            minHeight: { md: 620 },
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              color: 'white',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              background:
                'linear-gradient(135deg, #0f766e 0%, #1565c0 55%, #7c3aed 100%)',
            }}
          >
            <Box>
              <Chip
                icon={<VerifiedIcon />}
                label='Trusted learning marketplace'
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  fontWeight: 800,
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
              <Typography
                variant='h3'
                sx={{ mt: 3, fontWeight: 900, lineHeight: 1.1, letterSpacing: 0 }}
              >
                Learn job-ready skills from expert-led courses.
              </Typography>
              <Typography sx={{ mt: 2, maxWidth: 440, lineHeight: 1.8, color: 'rgba(255,255,255,0.82)' }}>
                Join live classes, watch structured lessons, access study materials, and track your learning in one place.
              </Typography>
            </Box>

            <Stack spacing={1.5}>
              {[
                { icon: <AutoStoriesIcon />, title: 'Curated course library', body: 'Browse public, free, paid, and subscription-ready courses.' },
                { icon: <PlayCircleIcon />, title: 'Video and live learning', body: 'Continue lessons, attend classes, and ask questions from your dashboard.' },
                { icon: <VerifiedIcon />, title: 'Instructor-led experience', body: 'Learn from teachers with practical expertise and organized curriculum.' },
              ].map((item) => (
                <Box
                  key={item.title}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.16)',
                  }}
                >
                  <Box sx={{ display: 'flex', color: 'white', mt: 0.25 }}>{item.icon}</Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                    <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
                      {item.body}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: { xs: 2, sm: 4, md: 5 },
              py: { xs: 4, md: 5 },
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 430 }}>
              <Outlet />
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
