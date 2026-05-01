import { AppBar, Toolbar, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

function Navbar() {
  return (
    <AppBar position="static">
      
      <Toolbar>
        <SchoolIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div">
          MedhaBee E-Learning Platform
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
