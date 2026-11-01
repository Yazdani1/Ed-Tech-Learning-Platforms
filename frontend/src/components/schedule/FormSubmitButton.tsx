import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import type { FC } from 'react';

interface FormSubmitButtonProps {
  pending: boolean;
  label: string;
  pendingLabel: string;
}

/** Full-width submit button of the create forms, with a spinner while saving. */
export const FormSubmitButton: FC<FormSubmitButtonProps> = ({ pending, label, pendingLabel }) => (
  <Button
    type="submit"
    variant="contained"
    fullWidth
    disabled={pending}
    startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
    sx={{ mt: 2, minHeight: 44 }}
  >
    {pending ? pendingLabel : label}
  </Button>
);
