import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  CheckCircleOutlined,
} from '@mui/icons-material';
import Grid from '@mui/material/Grid';
import { userAPI, roleAPI } from '../../services/api';
import type { User } from '../../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '' as string | number,
  });

  useEffect(() => {
    fetchUsers();
    loadRoles();
  }, [search]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll(search);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.roles?.[0]?.role_id ?? '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await userAPI.update(editingUser.user_id, {
          ...formData,
          role_id: formData.role_id ? Number(formData.role_id) : null,
        });
      } else {
        await userAPI.create({
          ...formData,
          role_id: formData.role_id ? Number(formData.role_id) : null,
        });
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleDisable = async (userId: number) => {
    try {
      await userAPI.disable(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const getRoleChipColor = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return { bg: 'rgba(101, 12, 8, 0.08)', text: '#650C08' };
    if (name.includes('counsellor')) return { bg: 'rgba(6, 182, 212, 0.08)', text: '#0891b2' };
    return { bg: 'rgba(71, 85, 105, 0.08)', text: '#475569' };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* Header section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #650C08 0%, #b77a6f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            User Administration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage university employee roles, logins, and status.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: 2.5,
            bgcolor: '#650C08',
            '&:hover': { bgcolor: '#7a1d16' },
          }}
        >
          Add User
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search user by username, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', mr: 0.5 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#ffffff',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                '& fieldset': { borderColor: 'rgba(15, 23, 42, 0.06) !important' },
              },
            }
          }}
        />
      </Box>

      {/* User Table container */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Assigned Roles</TableCell>
              <TableCell>Account Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} thickness={4} sx={{ color: '#650C08' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading user records...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No users found matching the search criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.user_id}
                  sx={{
                    transition: 'background-color 0.15s',
                    '&:hover': {
                      backgroundColor: 'rgba(101, 12, 8, 0.02)',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.first_name} {user.last_name}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role: any, idx: number) => {
                          const name = typeof role === 'string' ? role : role.role_name;
                          const colors = getRoleChipColor(name);
                          return (
                            <Chip
                              key={idx}
                              label={name}
                              size="small"
                              sx={{
                                bgcolor: colors.bg,
                                color: colors.text,
                                fontWeight: 600,
                                borderRadius: 1.5,
                              }}
                            />
                          );
                        })
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          None
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={user.is_active ? <CheckCircleOutlined sx={{ fontSize: '1rem !important', color: '#10b981 !important' }} /> : undefined}
                      label={user.is_active ? 'Active' : 'Disabled'}
                      size="small"
                      sx={{
                        bgcolor: user.is_active ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        color: user.is_active ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                        borderRadius: 1.5,
                        px: 0.5,
                      }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton
                        onClick={() => handleOpenDialog(user)}
                        size="small"
                        title="Edit User"
                        sx={{ color: '#650C08', bgcolor: 'rgba(101, 12, 8, 0.04)', '&:hover': { bgcolor: 'rgba(101, 12, 8, 0.08)' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDisable(user.user_id)}
                        size="small"
                        title={user.is_active ? 'Disable User' : 'Enable User'}
                        sx={{
                          color: user.is_active ? 'warning.main' : 'success.main',
                          bgcolor: user.is_active ? 'rgba(237, 108, 2, 0.04)' : 'rgba(46, 125, 50, 0.04)',
                          '&:hover': {
                            bgcolor: user.is_active ? 'rgba(237, 108, 2, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                          },
                        }}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDelete(user.user_id)}
                        size="small"
                        title="Delete User"
                        sx={{ color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.04)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog: Create/Edit User */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editingUser ? 'Edit User Profile' : 'Register New User'}</DialogTitle>

        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="dialog-role-label">Assigned Role</InputLabel>
                <Select
                  labelId="dialog-role-label"
                  value={formData.role_id}
                  label="Assigned Role"
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <em>Select Role</em>
                  </MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {!editingUser && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              px: 3,
              borderRadius: 2,
              bgcolor: '#650C08',
              '&:hover': { bgcolor: '#7a1d16' },
            }}
          >
            {editingUser ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
