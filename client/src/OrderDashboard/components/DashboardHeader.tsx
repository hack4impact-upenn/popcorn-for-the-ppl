import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  Button,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import COLORS from '../../assets/colors.ts';

/**
 * Header component with branding and search bar
 */
function DashboardHeader() {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#800020',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link
            to="/dashboard"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: COLORS.white,
                  lineHeight: 1.2,
                }}
              >
                POPCORN
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: COLORS.white,
                  lineHeight: 1.2,
                }}
              >
                FOR THE
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: COLORS.white,
                  lineHeight: 1.2,
                }}
              >
                people
              </Typography>
            </Box>
          </Link>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/order-management"
            sx={{
              color: COLORS.white,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Order Management
          </Button>
          <TextField
            placeholder="Search"
            size="small"
            sx={{
              backgroundColor: COLORS.white,
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none',
                },
              },
              width: 300,
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography sx={{ color: 'text.secondary' }}>🔍</Typography>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default DashboardHeader;
