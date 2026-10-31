import toast from 'react-hot-toast';

import i18n from '@/i18n/i18n';

/** The user-ready text of a failed request (an ApiError's message), or the generic "something went wrong". */
export const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : i18n.t('errors.unknown');

/** Shows a failed mutation's message. Returns false so it can end a `.catch` that resolves "not saved". */
export const toastError = (error: unknown): false => {
  toast.error(errorMessage(error));
  return false;
};
