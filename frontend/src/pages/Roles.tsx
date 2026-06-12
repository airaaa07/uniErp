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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
      setRoles(response.data);
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
    setFormData({
      role_name: '',
    });
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

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Roles</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Role
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>User Count</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.role_id}>
                <TableCell>{role.role_name}</TableCell>
                <TableCell>
                  {role.permissions?.map((permission) => (
                    <Chip key={permission} label={permission} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>{role.user_count || 0}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(role)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(role.role_id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Roles;
