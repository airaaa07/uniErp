import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as RoleIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Total Users', value: '0', icon: <PeopleIcon />, color: '#1976d2' },
    { title: 'Total Roles', value: '0', icon: <RoleIcon />, color: '#2e7d32' },
    { title: 'Audit Logs', value: '0', icon: <AuditIcon />, color: '#ed6c02' },
    { title: 'System Settings', value: '0', icon: <SettingsIcon />, color: '#9c27b0' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome to University ERP Administration
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2 }}>
        {stats.map((stat, index) => (
          <Box key={index} sx={{ flex: '1 1 200px', maxWidth: '300px' }}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: stat.color + '20',
                  mb: 2,
                }}
              >
                <Box sx={{ color: stat.color, fontSize: 40 }}>{stat.icon}</Box>
              </Box>
              <Typography variant="h6" component="div">
                {stat.title}
              </Typography>
              <Typography variant="h4" component="div" sx={{ mt: 1 }}>
                {stat.value}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the navigation menu to manage users, roles, audit logs, and system settings.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
