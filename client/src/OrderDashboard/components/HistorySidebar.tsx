import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { IOrderHistory } from '../../util/types/order.ts';
import COLORS from '../../assets/colors.ts';

interface HistorySidebarProps {
  history: IOrderHistory[];
}

/**
 * Component for displaying order history in the sidebar
 */
function HistorySidebar({ history }: HistorySidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 1,
          backgroundColor: COLORS.white,
          borderRadius: 2,
          overflow: 'auto',
        }}
      >
        {history.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No history available
            </Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#800020',
                    color: COLORS.white,
                  }}
                >
                  Order
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#800020',
                    color: COLORS.white,
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#800020',
                    color: COLORS.white,
                  }}
                >
                  Date
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {entry.orderName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.status}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.statusUpdateDate)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}

export default HistorySidebar;
