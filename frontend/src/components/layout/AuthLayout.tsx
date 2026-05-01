import { Outlet } from 'react-router-dom';
import { Box, Paper } from '@mui/material';
import PublicNavbar from './PublicNavbar';

export default function AuthLayout() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <PublicNavbar />
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, pt: 6, pb: 8 }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Outlet />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
