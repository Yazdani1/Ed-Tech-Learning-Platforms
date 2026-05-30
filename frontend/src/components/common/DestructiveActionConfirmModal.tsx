import type { FC, ReactNode } from 'react';
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface DestructiveActionConfirmModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: ReactNode;
	children?: ReactNode;
	cancelText?: string;
	confirmText?: string;
	confirming?: boolean;
	maxWidth?: 'xs' | 'sm' | 'md';
}

const DestructiveActionConfirmModal: FC<DestructiveActionConfirmModalProps> = ({
	open,
	onClose,
	onConfirm,
	title = 'Confirm action',
	children = 'Are you sure you want to delete or remove this item?',
	cancelText = 'Cancel',
	confirmText = 'Confirm',
	confirming = false,
	maxWidth = 'sm',
}) => (
	<Dialog
		open={open}
		onClose={(_, reason) => {
			if (reason === 'backdropClick') return;
			onClose();
		}}
		maxWidth={maxWidth}
		fullWidth
		slotProps={{
			paper: {
				sx: {
					borderRadius: 1,
					minHeight: 260,
					boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
				},
			},
		}}
	>
		<DialogTitle sx={{ pr: 6, fontWeight: 900 }}>
			{title}
			<IconButton
				aria-label='Close confirmation modal'
				onClick={onClose}
				disabled={confirming}
				size='small'
				sx={{
					position: 'absolute',
					top: 12,
					right: 12,
					color: 'error.main',
					'&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
				}}
			>
				<CloseIcon fontSize='small' />
			</IconButton>
		</DialogTitle>
		<DialogContent dividers>
			<Box
				sx={{
					minHeight: 120,
					display: 'grid',
					placeItems: 'center',
					textAlign: 'center',
					px: 2,
				}}
			>
				{typeof children === 'string' ? (
					<Typography color='text.secondary' sx={{ fontWeight: 600 }}>
						{children}
					</Typography>
				) : (
					children
				)}
			</Box>
		</DialogContent>
		<DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
			<Button
				variant='outlined'
				onClick={onClose}
				disabled={confirming}
				sx={{ fontWeight: 800, textTransform: 'none' }}
			>
				{cancelText}
			</Button>
			<Button
				variant='contained'
				color='error'
				onClick={onConfirm}
				disabled={confirming}
				sx={{ minWidth: 112, fontWeight: 900, textTransform: 'none' }}
			>
				{confirming ? (
					<CircularProgress size={18} color='inherit' />
				) : (
					confirmText
				)}
			</Button>
		</DialogActions>
	</Dialog>
);

export default DestructiveActionConfirmModal;
