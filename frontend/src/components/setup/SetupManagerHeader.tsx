'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { SetupKind } from '@/schemas/setup.schema';
import type { FC } from 'react';

interface SetupManagerHeaderProps {
  kind: SetupKind;
  /** Shown as a chip once the list has loaded */
  count: number | undefined;
  onAdd: () => void;
}

/** Grey header of a course setup list: title, item count, description and the Add button. */
export const SetupManagerHeader: FC<SetupManagerHeaderProps> = ({ kind, count, onAdd }) => {
  const { t } = useTranslation();
  const labelKey = `showcase.setup.${kind}`;
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {t(`${labelKey}.plural`)}
          </Typography>
          {count !== undefined && <Chip label={count} size="small" sx={{ fontWeight: 700 }} />}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t(`${labelKey}.description`)}
        </Typography>
      </Box>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{ flexShrink: 0, fontWeight: 700, minHeight: 44 }}
      >
        {t(`${labelKey}.add`)}
      </Button>
    </Box>
  );
};
