import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Button,
	TextField,
	Typography,
	Link,
	CircularProgress,
	InputAdornment,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SchoolIcon from '@mui/icons-material/School';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import type { UserRole } from '../../types/index';

const ROLE_REDIRECT: Record<UserRole, string> = {
	'Super Admin': '/admin/dashboard',
	Admin: '/admin/dashboard',
	Moderator: '/admin/dashboard',
	Teacher: '/teacher/courses',
	Student: '/student/dashboard',
};

export default function LoginPage() {
	const { t } = useTranslation();
	const { login } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const loggedUser = await login(email, password);
			const redirect = loggedUser
				? ROLE_REDIRECT[loggedUser.role]
				: '/admin/dashboard';
			navigate(redirect, { replace: true });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box component='form' onSubmit={(e) => void handleSubmit(e)}>
			<Box sx={{ textAlign: 'center', mb: 3.5 }}>
				<Box
					sx={{
						width: 54,
						height: 54,
						mx: 'auto',
						mb: 1.5,
						borderRadius: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						bgcolor: 'primary.50',
						color: 'primary.main',
					}}
				>
					<SchoolIcon />
				</Box>
				<Typography variant='h4' sx={{ fontWeight: 900, lineHeight: 1.15 }}>
					Welcome back
				</Typography>
				<Typography variant='body2' color='text.secondary' sx={{ mt: 1, lineHeight: 1.7 }}>
					Sign in to continue your courses, live classes, and learning dashboard.
				</Typography>
			</Box>

			<TextField
				label={t('auth.email')}
				type='email'
				fullWidth
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position='start'>
								<EmailOutlinedIcon fontSize='small' color='action' />
							</InputAdornment>
						),
					},
				}}
				sx={{ mb: 2 }}
			/>
			<TextField
				label={t('auth.password')}
				type='password'
				fullWidth
				required
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position='start'>
								<LockOutlinedIcon fontSize='small' color='action' />
							</InputAdornment>
						),
					},
				}}
				sx={{ mb: 3 }}
			/>
			<Button
				type='submit'
				variant='contained'
				fullWidth
				size='large'
				disabled={loading}
				sx={{ py: 1.35, fontWeight: 800, borderRadius: 1 }}
			>
				{loading ? (
					<CircularProgress size={22} color='inherit' />
				) : (
					'Sign in'
				)}
			</Button>
			<Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', mt: 2.5 }}>
				{t('auth.noAccount')}{' '}
				<Link component={RouterLink} to='/auth/register' sx={{ fontWeight: 800, textDecoration: 'none' }}>
					Create an account
				</Link>
			</Typography>
		</Box>
	);
}
