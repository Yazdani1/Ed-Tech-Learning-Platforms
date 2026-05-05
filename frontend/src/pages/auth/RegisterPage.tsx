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
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';

export default function RegisterPage() {
	const { t } = useTranslation();
	const { register } = useAuth();
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await register(name, email, password);
			navigate('/student/dashboard', { replace: true });
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
					<AutoStoriesIcon />
				</Box>
				<Typography variant='h4' sx={{ fontWeight: 900, lineHeight: 1.15 }}>
					Start learning today
				</Typography>
				<Typography variant='body2' color='text.secondary' sx={{ mt: 1, lineHeight: 1.7 }}>
					Create your student account and unlock courses, lectures, live classes, and study materials.
				</Typography>
			</Box>

			<TextField
				label={t('auth.name')}
				fullWidth
				required
				value={name}
				onChange={(e) => setName(e.target.value)}
				slotProps={{
					input: {
						startAdornment: (
							<InputAdornment position='start'>
								<PersonOutlinedIcon fontSize='small' color='action' />
							</InputAdornment>
						),
					},
				}}
				sx={{ mb: 2 }}
			/>
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
				slotProps={{
					htmlInput: { minLength: 6 },
					input: {
						startAdornment: (
							<InputAdornment position='start'>
								<LockOutlinedIcon fontSize='small' color='action' />
							</InputAdornment>
						),
					},
				}}
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
				sx={{ py: 1.35, fontWeight: 800, borderRadius: 1 }}
			>
				{loading ? (
					<CircularProgress size={22} color='inherit' />
				) : (
					'Create account'
				)}
			</Button>
			<Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', mt: 2.5 }}>
				{t('auth.hasAccount')}{' '}
				<Link component={RouterLink} to='/auth/login' sx={{ fontWeight: 800, textDecoration: 'none' }}>
					Sign in
				</Link>
			</Typography>
		</Box>
	);
}
