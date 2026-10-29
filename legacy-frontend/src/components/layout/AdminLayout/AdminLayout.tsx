import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout= () => {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Box key={location.pathname} sx={{ minHeight: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
