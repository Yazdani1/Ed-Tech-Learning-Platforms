'use client';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useId } from 'react';

import { AppModalActions } from './AppModalActions';
import { AppModalTitle } from './AppModalTitle';

import type { FC, ReactNode, SyntheticEvent } from 'react';

interface AppModalProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  /** Shows the primary button; with `formId` unset the content is wrapped in a <form> that calls it */
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  /** Colour of the primary button (error for destructive actions) */
  saveColor?: 'primary' | 'success' | 'error';
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hideActions?: boolean;
  /** Extra content on the left of the action bar */
  actionsLeft?: ReactNode;
}

/**
 * The one dialog of the app: title with a close icon, scrollable content, Cancel + primary action.
 * Full screen on phones. Backdrop clicks do not close it (no lost form input); Escape and the icon do.
 */
export const AppModal: FC<AppModalProps> = ({
  open,
  title,
  children,
  onClose,
  onSave,
  saveLabel,
  cancelLabel,
  saving = false,
  saveDisabled = false,
  saveColor = 'primary',
  maxWidth = 'sm',
  hideActions = false,
  actionsLeft,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!saving && !saveDisabled) onSave?.();
  };

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || saving) return;
        onClose();
      }}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby={titleId}
    >
      <Box
        component={onSave ? 'form' : 'div'}
        noValidate
        onSubmit={onSave ? handleSubmit : undefined}
        sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
      >
        <AppModalTitle id={titleId} title={title} onClose={onClose} disabled={saving} />
        <DialogContent dividers>{children}</DialogContent>
        {!hideActions && (
          <AppModalActions
            onClose={onClose}
            hasSave={onSave !== undefined}
            saveLabel={saveLabel}
            cancelLabel={cancelLabel}
            saving={saving}
            saveDisabled={saveDisabled}
            saveColor={saveColor}
            actionsLeft={actionsLeft}
          />
        )}
      </Box>
    </Dialog>
  );
};
