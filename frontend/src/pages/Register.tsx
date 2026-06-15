import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SchoolOutlined, ArrowBack } from '@mui/icons-material';
import { userAPI, roleAPI } from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await userAPI.create(formData);
      navigate('/login', {
        state: { message: 'Registration successful! Please login.' },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Left Panel: Visual Grid */}
      <Grid
        size={{ md: 6, lg: 7 }}
        className="dark-animated-mesh-gradient"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#ffffff',
          p: 6,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SchoolOutlined sx={{ color: '#fff' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            ERP Studio
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 460 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 30px rgba(0,0,0,0.1)',
            }}
          >
            Create your administrative workspace.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              mb: 5,
              fontSize: '1.1rem',
              lineHeight: 1.6,
            }}
          >
            Join and manage user permissions, oversee operations, and model layouts under a single integrated system.
          </Typography>

          {/* Simple Mockup */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              color: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                JD
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ height: 12, width: '50%', bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 1, mb: 1 }} />
                <Box sx={{ height: 8, width: '80%', bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 0.5 }} />
              </Box>
            </Box>
          </Paper>
        </Box>
      </Grid>

      {/* Right Panel: Clean form layout */}
      <Grid
        size={{ xs: 12, md: 6, lg: 5 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8fafc',
          p: { xs: 3, sm: 6 },
          overflowY: 'auto',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 460, py: 4 }} className="fade-in">
          {/* Back to Login link */}
          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            <ArrowBack fontSize="small" />
            Back to login
          </Link>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 1,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            Get started
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Create a new account by filling in the details below.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  name="first_name"
                  label="First Name"
                  id="first_name"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  name="last_name"
                  label="Last Name"
                  id="last_name"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={formData.role_id}
                    label="Role"
                    required
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value as string })}
                    disabled={loading}
                    sx={{ borderRadius: 2 }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.25,
                fontSize: '0.95rem',
                borderRadius: 2,
                mt: 3,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Register;
