import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IOrderHistory, OrderStatus } from '../../util/types/order.ts';
import COLORS from '../../assets/colors.ts';

interface CoolGraphsProps {
  history: IOrderHistory[];
}

/**
 * Component for displaying order statistics graphs
 */
function CoolGraphs({ history }: CoolGraphsProps) {
  // Process history data to create timeseries data
  const timeseriesData = useMemo(() => {
    if (history.length === 0) return [];

    // Group by date and count status updates per day
    const dateMap = new Map<string, Map<OrderStatus, number>>();

    history.forEach((entry) => {
      const date = new Date(entry.statusUpdateDate);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, new Map<OrderStatus, number>());
      }

      const statusMap = dateMap.get(dateKey)!;
      statusMap.set(entry.status, (statusMap.get(entry.status) || 0) + 1);
    });

    // Convert to array format for chart
    const statusTypes: OrderStatus[] = [
      'Inquiry',
      'Confirmed',
      'In Production',
      'Ready to Ship',
      'Shipped',
      'Invoiced',
    ];

    const chartData = Array.from(dateMap.entries())
      .map(([date, statusMap]) => {
        const dataPoint: any = { date };
        statusTypes.forEach((status) => {
          dataPoint[status] = statusMap.get(status) || 0;
        });
        return dataPoint;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  }, [history]);

  const colors = {
    Inquiry: '#FF9800',
    Confirmed: '#2196F3',
    'In Production': '#9C27B0',
    'Ready to Ship': '#00BCD4',
    Shipped: '#4CAF50',
    Invoiced: '#8BC34A',
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {timeseriesData.length === 0 ? (
        <Paper
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.white,
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No history data available
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeseriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Inquiry"
                stroke={colors.Inquiry}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Confirmed"
                stroke={colors.Confirmed}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="In Production"
                stroke={colors['In Production']}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Ready to Ship"
                stroke={colors['Ready to Ship']}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Shipped"
                stroke={colors.Shipped}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Invoiced"
                stroke={colors.Invoiced}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}

export default CoolGraphs;
