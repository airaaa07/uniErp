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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShieldOutlined,
} from '@mui/icons-material';
import { roleAPI } from '../services/api';
import type { Role } from '../types';

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    role_name: '',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getAll();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        role_name: role.role_name,
      });
    } else {
      setEditingRole(null);
      setFormData({
        role_name: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await roleAPI.update(editingRole.role_id, formData);
      } else {
        await roleAPI.create(formData);
      }
      handleCloseDialog();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await roleAPI.delete(roleId);
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
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
              background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Role Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure Role-Based Access Control (RBAC) groups and active permissions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2.5 }}
        >
          Add Role
        </Button>
      </Box>

      {/* Roles List Grid Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>System Permissions</TableCell>
              <TableCell>Associated Users</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} thickness={4} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading access roles...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No roles configured. Create your first role to start defining permissions.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow
                  key={role.role_id}
                  sx={{
                    transition: 'background-color 0.15s',
                    '&:hover': {
                      backgroundColor: 'rgba(248, 250, 252, 0.6)',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShieldOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                      {role.role_name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.map((permission) => (
                          <Chip
                            key={permission}
                            label={permission}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(15, 23, 42, 0.05)',
                              color: '#475569',
                              fontWeight: 500,
                              borderRadius: 1.5,
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          No explicit permissions assigned
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${role.user_count || 0} user${role.user_count === 1 ? '' : 's'}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 600,
                        borderColor: 'rgba(15, 23, 42, 0.08)',
                        color: 'text.secondary',
                        bgcolor: 'background.default',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton
                        onClick={() => handleOpenDialog(role)}
                        size="small"
                        title="Edit Role"
                        sx={{
                          color: 'primary.main',
                          bgcolor: 'rgba(79, 70, 229, 0.04)',
                          '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.08)' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(role.role_id)}
                        size="small"
                        title="Delete Role"
                        sx={{
                          color: 'error.main',
                          bgcolor: 'rgba(239, 68, 68, 0.04)',
                          '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                        }}
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

      {/* Role edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingRole ? 'Edit Access Role' : 'Create Access Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}>
            <TextField
              fullWidth
              label="Role Name"
              placeholder="e.g., student_admin"
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 3, borderRadius: 2 }}>
            {editingRole ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Roles;
