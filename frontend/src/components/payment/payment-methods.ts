export type PaymentMethodId = 'bkash' | 'other';

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId = 'bkash';

/** Every payment method, in the order shown. */
export const PAYMENT_METHODS: readonly PaymentMethodId[] = ['bkash', 'other'];

/** White card of the payment page. */
export const PAYMENT_CARD_SX = {
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
} as const;

/** The round number (or tick) of a step. */
export const stepCircleSx = (bgcolor: string, color: string) =>
  ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    bgcolor,
    color,
    display: 'grid',
    placeItems: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    flexShrink: 0,
  }) as const;
