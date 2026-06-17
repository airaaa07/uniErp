import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { erpRecordAPI, userAPI } from '../../services/api';

interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  college_id?: number;
  is_active: boolean;
  created_at: string;
  roles: string[];
}

const availableRoles = [
  'Counsellor',
  'Admission Officer',
  'Registrar',
  'Finance Controller',
  'Student',
];

const CollegeUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
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
    role: 'Counsellor',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getCollegeUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch college users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'Counsellor',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      password: '',
      first_name: userToEdit.first_name || '',
      last_name: userToEdit.last_name || '',
      role: userToEdit.roles?.[0] || 'Counsellor',
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Update existing user
        await userAPI.updateCollegeUser(editingUser.user_id, {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        });
      } else {
        // Create new user - need to get role_id
        const roleRes = await fetch('/api/designer/roles');
        const roles = await roleRes.json();
        const roleObj = roles.find((r: any) => r.role_name === formData.role);

        await userAPI.createCollegeUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role_id: roleObj?.role_id,
        });
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  const handleToggleStatus = async (userToToggle: User) => {
    try {
      await userAPI.toggleCollegeUserStatus(userToToggle.user_id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const filteredUsers = users.filter(
    u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={40} sx={{ color: '#650C08' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Header */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: '#650C08', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 6px 20px rgba(101,12,8,0.15)' }}>
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
            College User Management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Manage users within your college. Create counsellors, officers, and staff accounts for your institution.
          </Typography>
        </Box>
        <PeopleIcon sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Actions Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
        />
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenCreate}
          sx={{
            borderRadius: 2,
            bgcolor: '#650C08',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#7a1d16' },
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No users found. Create your first college user.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.user_id} sx={{ '&:hover': { bgcolor: 'rgba(101,12,8,0.01)' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
                  <TableCell>{u.first_name} {u.last_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.roles?.[0] || 'No Role'}
                      size="small"
                      sx={{ fontWeight: 600, borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.is_active}
                      onChange={() => handleToggleStatus(u)}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10b981',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#10b981',
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        onClick={() => handleOpenEdit(u)}
                        size="small"
                        sx={{ color: '#650C08', bgcolor: 'rgba(101,12,8,0.04)' }}
                        title="Edit User"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#650C08' }}>
          {editingUser ? 'Edit User' : 'Create New College User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {!editingUser && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            )}
            <TextField
              fullWidth
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
            {!editingUser && (
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={editingUser ? <EditIcon /> : <AddIcon />}
            sx={{ borderRadius: 2, bgcolor: '#650C08', '&:hover': { bgcolor: '#7a1d16' } }}
          >
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CollegeUsers;
