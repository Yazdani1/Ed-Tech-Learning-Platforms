import { Avatar, Box, Typography } from '@mui/material';
import type { IChatTypingEvent } from '../../types';

const ROLE_COLORS: Record<string, string> = {
	'Super Admin': '#f59e0b',
	Admin: '#ef4444',
	Moderator: '#10b981',
	Teacher: '#3b82f6',
	Student: '#8b5cf6',
};

function avatarColor(role: string) {
	return ROLE_COLORS[role] ?? '#6366f1';
}

export default function TypingIndicator({
	typingUser,
	compact = false,
}: {
	typingUser: IChatTypingEvent;
	compact?: boolean;
}) {
	const dotSize = compact ? 5 : 6;

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.75 : 1, mb: 1 }}>
			<Avatar
				src=''
				sx={{
					width: compact ? 26 : 28,
					height: compact ? 26 : 28,
					bgcolor: avatarColor(typingUser.userRole),
					fontSize: compact ? 11 : 12,
					fontWeight: 700,
				}}
			>
				{typingUser.userName?.[0]?.toUpperCase()}
			</Avatar>
			<Box>
				<Typography
					variant='caption'
					color='text.secondary'
					sx={{ display: 'block', mb: 0.25, fontSize: compact ? 10 : 11 }}
				>
					{typingUser.userName} is typing
				</Typography>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 0.45,
						width: compact ? 44 : 50,
						px: compact ? 1.15 : 1.3,
						py: compact ? 0.85 : 0.95,
						borderRadius: compact ? '13px 13px 13px 4px' : '14px 14px 14px 4px',
						bgcolor: '#fff',
						boxShadow: compact
							? '0 1px 4px rgba(0,0,0,0.1)'
							: '0 1px 4px rgba(0,0,0,0.08)',
						'@keyframes typingDotPulse': {
							'0%, 80%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
							'40%': { opacity: 1, transform: 'translateY(-3px)' },
						},
					}}
				>
					{[0, 1, 2].map((index) => (
						<Box
							key={index}
							sx={{
								width: dotSize,
								height: dotSize,
								borderRadius: '50%',
								bgcolor: '#6366f1',
								animation: 'typingDotPulse 1.1s infinite ease-in-out',
								animationDelay: `${index * 0.16}s`,
							}}
						/>
					))}
				</Box>
			</Box>
		</Box>
	);
}
