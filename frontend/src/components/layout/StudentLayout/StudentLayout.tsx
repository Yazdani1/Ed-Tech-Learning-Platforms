import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

export default function StudentLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <StudentSidebar />
      <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
