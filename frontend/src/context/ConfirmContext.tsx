'use client';

import Typography from '@mui/material/Typography';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppModal } from '@/components/common/AppModal';

import type { FC, ReactNode } from 'react';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  /** Red confirm button (deletes, irreversible actions) */
  destructive?: boolean;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

interface ConfirmProviderProps {
  children: ReactNode;
}

/** One app-wide confirmation dialog; `useConfirm()` opens it and resolves true (confirmed) or false. */
export const ConfirmProvider: FC<ConfirmProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        // A dialog that is still open counts as cancelled
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const settle = (confirmed: boolean): void => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOptions(null);
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AppModal
        open={options !== null}
        title={options?.title ?? ''}
        onClose={() => {
          settle(false);
        }}
        onSave={() => {
          settle(true);
        }}
        saveLabel={options?.confirmLabel ?? t('common.confirm')}
        saveColor={options?.destructive ? 'error' : 'primary'}
        maxWidth="xs"
      >
        <Typography component="div" variant="body2">
          {options?.message}
        </Typography>
      </AppModal>
    </ConfirmContext.Provider>
  );
};
