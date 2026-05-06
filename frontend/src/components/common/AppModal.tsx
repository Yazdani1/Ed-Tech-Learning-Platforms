import type { ReactNode } from 'react';
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type AppModalProps = {
	open: boolean;
	title: ReactNode;
	children: ReactNode;
	onClose: () => void;
	onSave?: () => void;
	cancelText?: string;
	saveText?: string;
	saving?: boolean;
	saveDisabled?: boolean;
	maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	fullWidth?: boolean;
	hideActions?: boolean;
	contentDividers?: boolean;
	paperSx?: object;
	contentSx?: object;
	titleSx?: object;
	closeButtonSx?: object;
	actionsLeft?: ReactNode;
};

export default function AppModal({
	open,
	title,
	children,
	onClose,
	onSave,
	cancelText = 'Cancel',
	saveText = 'Save',
	saving = false,
	saveDisabled = false,
	maxWidth = 'sm',
	fullWidth = true,
	hideActions = false,
	contentDividers = true,
	paperSx,
	contentSx,
	titleSx,
	closeButtonSx,
	actionsLeft,
}: AppModalProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth={maxWidth}
			fullWidth={fullWidth}
			slotProps={{ paper: { sx: { borderRadius: 1, ...paperSx } } }}
		>
			<DialogTitle sx={{ pr: 6, fontWeight: 900, ...titleSx }}>
				{title}
				<IconButton
					aria-label='Close modal'
					onClick={onClose}
					size='small'
					sx={{ position: 'absolute', top: 12, right: 12, ...closeButtonSx }}
				>
					<CloseIcon fontSize='small' />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers={contentDividers} sx={contentSx}>
				{children}
			</DialogContent>
			{!hideActions && (
				<DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
					<Box>{actionsLeft}</Box>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button onClick={onClose} disabled={saving}>
							{cancelText}
						</Button>
						{onSave && (
							<Button
								variant='contained'
								onClick={onSave}
								disabled={saving || saveDisabled}
							>
								{saving ? <CircularProgress size={18} color='inherit' /> : saveText}
							</Button>
						)}
					</Box>
				</DialogActions>
			)}
		</Dialog>
	);
}
