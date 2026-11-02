'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { useId } from 'react';

import { AppModalActions } from './AppModalActions';
import { AppModalTitle } from './AppModalTitle';

import type { FC, ReactNode, SyntheticEvent } from 'react';

interface SideDrawerProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  /** Shows the primary button; the content is wrapped in a <form> that calls it */
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  /** Read-only panels (details) have no action bar */
  hideActions?: boolean;
  /** Wider panel for content with pictures */
  wide?: boolean;
}

const WIDTH = { xs: '100%', sm: 560, md: 640 } as const;
const WIDE_WIDTH = { xs: '100%', sm: 640, md: 820 } as const;
const FRAME_SX = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
} as const;
const BODY_SX = {
  flex: 1,
  overflowY: 'auto',
  p: { xs: 2, sm: 3 },
  borderTop: 1,
  borderColor: 'divider',
} as const;

/**
 * A panel that slides in from the right: title with a close icon, scrollable content, Cancel + primary
 * action (same parts as AppModal). Full width on phones. Backdrop clicks do not close a form panel.
 */
export const SideDrawer: FC<SideDrawerProps> = ({
  open,
  title,
  children,
  onClose,
  onSave,
  saveLabel,
  cancelLabel,
  saving = false,
  saveDisabled = false,
  hideActions = false,
  wide = false,
}) => {
  const titleId = useId();
  const isForm = onSave !== undefined;

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!saving && !saveDisabled) onSave?.();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={(_event, reason) => {
        if (saving || (isForm && reason === 'backdropClick')) return;
        onClose();
      }}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-labelledby': titleId,
          sx: { width: wide ? WIDE_WIDTH : WIDTH },
        },
      }}
    >
      <Box
        component={isForm ? 'form' : 'div'}
        noValidate
        onSubmit={isForm ? handleSubmit : undefined}
        sx={FRAME_SX}
      >
        <AppModalTitle id={titleId} title={title} onClose={onClose} disabled={saving} />
        <Box sx={BODY_SX}>{children}</Box>
        {!hideActions && (
          <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
            <AppModalActions
              onClose={onClose}
              hasSave={isForm}
              saveLabel={saveLabel}
              cancelLabel={cancelLabel}
              saving={saving}
              saveDisabled={saveDisabled}
              saveColor="primary"
            />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
