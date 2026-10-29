import { Chip } from '@mui/material';

const YouBadge= () => {
	return (
		<Chip
			label='You'
			size='small'
			sx={{
				height: 18,
				fontSize: '0.65rem',
				fontWeight: 800,
				color: '#ffffff',
				bgcolor: 'transparent',
				background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 52%, #06b6d4 100%)',
				boxShadow: '0 6px 16px rgba(139, 92, 246, 0.24)',
				'& .MuiChip-label': { px: 0.85 },
			}}
		/>
	);
};

export default YouBadge;
