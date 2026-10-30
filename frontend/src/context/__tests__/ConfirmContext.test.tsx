import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useConfirm } from '@/hooks/useConfirm';
import { renderWithProviders } from '@/test/render';

import { ConfirmProvider } from '../ConfirmContext';

import type { ConfirmOptions } from '../ConfirmContext';
import type { FC } from 'react';

interface AskerProps {
  options: ConfirmOptions;
  label: string;
  results: boolean[];
}

/** A button that asks for confirmation and records the answer. */
const Asker: FC<AskerProps> = ({ options, label, results }) => {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() => {
        void confirm(options).then((answer) => {
          results.push(answer);
        });
      }}
    >
      {label}
    </button>
  );
};

const renderAsker = (
  results: boolean[],
  options: ConfirmOptions = { title: 'Leave?', message: 'Sure?' },
) =>
  renderWithProviders(
    <ConfirmProvider>
      <Asker options={options} label="Ask" results={results} />
      <Asker options={{ title: 'Second', message: 'Again?' }} label="Ask again" results={results} />
    </ConfirmProvider>,
  );

describe('ConfirmProvider / useConfirm', () => {
  it('resolves true when the user confirms', async () => {
    const results: boolean[] = [];
    renderAsker(results, { title: 'Leave?', message: 'Sure?', confirmLabel: 'Leave' });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Ask' }));
    const dialog = await screen.findByRole('dialog', { name: 'Leave?' });
    expect(within(dialog).getByText('Sure?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Leave' }));

    await waitFor(() => {
      expect(results).toEqual([true]);
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('resolves false when the user cancels', async () => {
    const results: boolean[] = [];
    renderAsker(results);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Ask' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => {
      expect(results).toEqual([false]);
    });
  });

  it('a second confirmation cancels the one still open', async () => {
    const results: boolean[] = [];
    renderAsker(results);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Ask' }));
    await screen.findByRole('dialog', { name: 'Leave?' });
    // The first dialog is modal, so open the second one programmatically through its button element
    screen.getByRole('button', { name: 'Ask again', hidden: true }).click();

    await waitFor(() => {
      expect(results).toEqual([false]);
    });
    const second = await screen.findByRole('dialog', { name: 'Second' });
    await user.click(within(second).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(results).toEqual([false, true]);
    });
  });

  it('useConfirm outside the provider is a programming error', () => {
    const Lonely = () => {
      useConfirm();
      return null;
    };
    // React logs the thrown error; keep the test output clean
    const logError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderWithProviders(<Lonely />)).toThrow(
      'useConfirm must be used inside ConfirmProvider',
    );
    logError.mockRestore();
  });
});
