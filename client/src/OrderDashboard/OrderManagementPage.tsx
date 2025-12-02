import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ScreenGrid from '../components/ScreenGrid.tsx';
import DashboardHeader from './components/DashboardHeader.tsx';
import COLORS from '../assets/colors.ts';

/**
 * Order Management Page - placeholder for future implementation
 * This page will be used to update typeform logic for ordering forms
 */
function OrderManagementPage() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: COLORS.primaryRed }}>
      <DashboardHeader />
      <ScreenGrid>
        <Paper
          sx={{
            p: 4,
            backgroundColor: COLORS.white,
            borderRadius: 2,
            maxWidth: '800px',
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>
            Order Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page will be used to manage and update the typeform logic for
            ordering forms. Implementation coming soon.
          </Typography>
        </Paper>
      </ScreenGrid>
    </Box>
  );
}

export default OrderManagementPage;
