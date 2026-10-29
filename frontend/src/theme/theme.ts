import { createTheme } from '@mui/material/styles';

/** Same look as the old client (src/theme.ts there). */
export const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#e53935' },
    background: { default: '#f5f6fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
