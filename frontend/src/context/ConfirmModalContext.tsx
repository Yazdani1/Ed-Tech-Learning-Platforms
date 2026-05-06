import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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

type ConfirmOptions = {
	title?: ReactNode;
	message: ReactNode;
	confirmText?: string;
	cancelText?: string;
	confirmColor?: 'primary' | 'error' | 'warning' | 'success';
	maxWidth?: 'xs' | 'sm' | 'md';
};

type PendingConfirm = Required<Pick<ConfirmOptions, 'confirmText' | 'cancelText' | 'confirmColor' | 'maxWidth'>> &
	Pick<ConfirmOptions, 'title' | 'message'> & {
		resolve: (confirmed: boolean) => void;
	};

type ConfirmModalContextValue = {
	confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmModalContext = createContext<ConfirmModalContextValue | null>(null);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
	const [pending, setPending] = useState<PendingConfirm | null>(null);
	const [closing, setClosing] = useState(false);

	const confirm = useCallback((options: ConfirmOptions) => (
		new Promise<boolean>((resolve) => {
			setPending({
				title: options.title ?? 'Confirm Action',
				message: options.message,
				confirmText: options.confirmText ?? 'Confirm',
				cancelText: options.cancelText ?? 'Cancel',
				confirmColor: options.confirmColor ?? 'error',
				maxWidth: options.maxWidth ?? 'xs',
				resolve,
			});
		})
	), []);

	const resolvePending = (confirmed: boolean) => {
		if (!pending) return;
		setClosing(true);
		pending.resolve(confirmed);
		setPending(null);
		setClosing(false);
	};

	const value = useMemo(() => ({ confirm }), [confirm]);

	return (
		<ConfirmModalContext.Provider value={value}>
			{children}
			<Dialog
				open={Boolean(pending)}
				onClose={(_, reason) => {
					if (reason === 'backdropClick') return;
					resolvePending(false);
				}}
				maxWidth={pending?.maxWidth ?? 'xs'}
				fullWidth
				slotProps={{ paper: { sx: { borderRadius: 1 } } }}
			>
				<DialogTitle sx={{ pr: 6, fontWeight: 900 }}>
					<IconButton
						aria-label='Close confirmation'
						onClick={() => resolvePending(false)}
						size='small'
						sx={{ position: 'absolute', top: 12, right: 12 }}
					>
						<CloseIcon fontSize='small' />
					</IconButton>
					{pending?.title}
				</DialogTitle>
				<DialogContent dividers>
					<Typography color='text.secondary' sx={{ lineHeight: 1.7 }}>
						{pending?.message}
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button onClick={() => resolvePending(false)} disabled={closing}>
							{pending?.cancelText}
						</Button>
						<Button
							variant='contained'
							color={pending?.confirmColor ?? 'error'}
							onClick={() => resolvePending(true)}
							disabled={closing}
						>
							{closing ? <CircularProgress size={18} color='inherit' /> : pending?.confirmText}
						</Button>
					</Box>
				</DialogActions>
			</Dialog>
		</ConfirmModalContext.Provider>
	);
}

export function useConfirmModal() {
	const context = useContext(ConfirmModalContext);
	if (!context) {
		throw new Error('useConfirmModal must be used inside ConfirmModalProvider');
	}
	return context;
}
