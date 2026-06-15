import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography, Box, Grid, Card, CardContent, CircularProgress, Button } from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as RoleIcon,
  History as AuditIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { userAPI, roleAPI, auditAPI, settingsAPI } from '../services/api';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    users: 0,
    roles: 0,
    audit: 0,
    settings: 0,
  });

  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Format date beautifully
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [usersRes, rolesRes, auditRes, settingsRes] = await Promise.all([
          userAPI.getAll(),
          roleAPI.getAll(),
          auditAPI.getAll(500, 0),
          settingsAPI.getAll(),
        ]);

        setCounts({
          users: usersRes.data?.length || 0,
          roles: rolesRes.data?.length || 0,
          audit: auditRes.data?.length || 0,
          settings: settingsRes.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: counts.users,
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: '#4f46e5', // Indigo
      bgLight: 'rgba(79, 70, 229, 0.08)',
      path: '/dashboard/users',
      desc: 'Registered accounts',
    },
    {
      title: 'Total Roles',
      value: counts.roles,
      icon: <RoleIcon sx={{ fontSize: 28 }} />,
      color: '#06b6d4', // Cyan
      bgLight: 'rgba(6, 182, 212, 0.08)',
      path: '/dashboard/roles',
      desc: 'Permissions & access groups',
    },
    {
      title: 'Audit Logs',
      value: counts.audit,
      icon: <AuditIcon sx={{ fontSize: 28 }} />,
      color: '#ec4899', // Pink
      bgLight: 'rgba(236, 72, 153, 0.08)',
      path: '/dashboard/audit',
      desc: 'Logged system operations',
    },
    {
      title: 'System Settings',
      value: counts.settings,
      icon: <SettingsIcon sx={{ fontSize: 28 }} />,
      color: '#10b981', // Emerald
      bgLight: 'rgba(16, 185, 129, 0.08)',
      path: '/dashboard/settings',
      desc: 'Configuration parameters',
    },
  ];

  const quickActions = [
    { label: 'Manage System Users', path: '/dashboard/users', icon: <PeopleIcon /> },
    { label: 'Configure RBAC Roles', path: '/dashboard/roles', icon: <RoleIcon /> },
    { label: 'Inspect Security Audit Logs', path: '/dashboard/audit', icon: <AuditIcon /> },
    { label: 'Update Portal Configuration', path: '/dashboard/settings', icon: <SettingsIcon /> },
  ];

  return (
    <Box sx={{ py: 1 }}>
      {/* Top Greeting Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            System Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            University ERP backend database operations & resources.
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.05)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {currentDate}
          </Typography>
        </Box>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                  },
                }}
                onClick={() => navigate(stat.path)}
              >
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {stat.title}
                    </Typography>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                        bgcolor: stat.bgLight,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>

                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <CircularProgress size={20} thickness={4} />
                    </Box>
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5, color: '#0f172a' }}>
                      {stat.value}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {stat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions & Action Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'slate.900' }}>
              Quick Control Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Navigate to system resources to manage users, assign permission groups, or inspect operations.
            </Typography>

            <Grid container spacing={2}>
              {quickActions.map((action) => (
                <Grid size={{ xs: 12, sm: 6 }} key={action.label}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
                    endIcon={<ArrowIcon fontSize="small" />}
                    onClick={() => navigate(action.path)}
                    sx={{
                      justifyContent: 'space-between',
                      px: 2.5,
                      py: 1.75,
                      borderRadius: 3,
                      color: 'text.primary',
                      borderColor: 'rgba(15, 23, 42, 0.08)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(79, 70, 229, 0.02)',
                        transform: 'translateX(2px)',
                      },
                      '& .MuiButton-startIcon': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {action.label}
                    </Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            sx={{
              p: 3.5,
              borderRadius: 4,
              height: '100%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(79, 70, 229, 0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle background circles for depth */}
            <Box
              sx={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                pointerEvents: 'none',
              }}
            />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
              Designer Studio
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 3, lineHeight: 1.6 }}>
              Have Designer privileges? Create custom data schemas, adjust field types, and construct bespoke drag-and-drop form layouts.
            </Typography>
            <Box>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard/designer/modules')}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#4f46e5',
                  px: 3,
                  py: 1.25,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                Launch Studio
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
