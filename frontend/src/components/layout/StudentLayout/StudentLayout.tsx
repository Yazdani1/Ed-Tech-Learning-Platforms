import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import ChatWidget from '../../chat/ChatWidget';

const StudentLayout= () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/student/chat';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <StudentSidebar />
      <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Outlet />
      </Box>
      {!isChatPage && <ChatWidget />}
    </Box>
  );
};

export default StudentLayout;
