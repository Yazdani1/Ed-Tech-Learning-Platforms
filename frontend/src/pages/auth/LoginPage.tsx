import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Button,
	TextField,
	Typography,
	Link,
	CircularProgress,
} from '@mui/material';
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
			<Typography
				variant='h5'
				sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}
			>
				{t('auth.loginTitle')}
			</Typography>
			<TextField
				label={t('auth.email')}
				type='email'
				fullWidth
				required
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				sx={{ mb: 2 }}
			/>
			<TextField
				label={t('auth.password')}
				type='password'
				fullWidth
				required
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				sx={{ mb: 3 }}
			/>
			<Button
				type='submit'
				variant='contained'
				fullWidth
				size='large'
				disabled={loading}
			>
				{loading ? (
					<CircularProgress size={22} color='inherit' />
				) : (
					t('auth.login')
				)}
			</Button>
			<Typography variant='body2' sx={{ textAlign: 'center', mt: 2 }}>
				{t('auth.noAccount')}{' '}
				<Link component={RouterLink} to='/auth/register'>
					{t('auth.register')}
				</Link>
			</Typography>
		</Box>
	);
}
