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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { settingsAPI } from '../services/api';
import type { AppSetting } from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<AppSetting | null>(null);
  const [formData, setFormData] = useState({
    setting_key: '',
    setting_value: '',
    description: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (setting?: AppSetting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        description: setting.description,
      });
    } else {
      setEditingSetting(null);
      setFormData({
        setting_key: '',
        setting_value: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSetting(null);
    setFormData({
      setting_key: '',
      setting_value: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingSetting) {
        await settingsAPI.update(editingSetting.setting_id, formData);
      } else {
        await settingsAPI.create(formData);
      }
      handleCloseDialog();
      fetchSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleDelete = async (settingId: number) => {
    if (window.confirm('Are you sure you want to delete this setting?')) {
      try {
        await settingsAPI.delete(settingId);
        fetchSettings();
      } catch (error) {
        console.error('Error deleting setting:', error);
      }
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">System Settings</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Setting
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settings.map((setting) => (
              <TableRow key={setting.setting_id}>
                <TableCell>{setting.setting_key}</TableCell>
                <TableCell>{setting.setting_value}</TableCell>
                <TableCell>{setting.description}</TableCell>
                <TableCell>{new Date(setting.updated_at).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(setting)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(setting.setting_id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSetting ? 'Edit Setting' : 'Add Setting'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Setting Key"
              value={formData.setting_key}
              onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
              disabled={!!editingSetting}
            />
            <TextField
              fullWidth
              label="Setting Value"
              value={formData.setting_value}
              onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSetting ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
