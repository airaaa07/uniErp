import React, { useState } from 'react';
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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { SchoolOutlined, ArrowForward } from '@mui/icons-material';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Left Panel: Aesthetic visual grid */}
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
            Flexible administration, designed for you.
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
            Build, structure, and customize your university portal in real time. Harness database-driven form creation with a premium, drag-and-drop designer.
          </Typography>

          {/* Floating UI Mockup */}
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
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#eab308' }} />
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e' }} />
            </Box>
            <Box sx={{ height: 100, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ height: 16, width: '40%', bgcolor: 'rgba(255, 255, 255, 0.2)', borderRadius: 1 }} />
              <Box sx={{ height: 12, width: '85%', bgcolor: 'rgba(255, 255, 255, 0.15)', borderRadius: 0.5 }} />
              <Box sx={{ height: 12, width: '70%', bgcolor: 'rgba(255, 255, 255, 0.15)', borderRadius: 0.5 }} />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Box sx={{ height: 24, width: 60, bgcolor: 'rgba(255, 255, 255, 0.25)', borderRadius: 1 }} />
                <Box sx={{ height: 24, width: 80, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }} />
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
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }} className="fade-in">
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SchoolOutlined sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'slate.900' }}>
              ERP Studio
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 1,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Please sign in to access your administrative workspace.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              slotProps={{
                input: {
                  sx: { py: 0.5 },
                }
              }}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              slotProps={{
                input: {
                  sx: { py: 0.5 },
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForward />}
              sx={{
                py: 1.25,
                fontSize: '0.95rem',
                borderRadius: 2,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 3,
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              color: '#1e3a8a',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Demo Environment Credentials
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Username: <strong>admin</strong> &bull; Password: <strong>admin123</strong>
            </Typography>
          </Paper>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: 600 }}>
                Register here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Login;
