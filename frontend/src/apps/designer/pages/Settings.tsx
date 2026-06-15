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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SettingsApplicationsOutlined,
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
      setSettings(response.data || []);
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
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage global system settings, keys, values, and environment configurations.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2.5 }}
        >
          Add Setting
        </Button>
      </Box>

      {/* Settings Grid list */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Configuration Key</TableCell>
              <TableCell>Setting Value</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} thickness={4} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading configuration properties...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : settings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No system configurations defined. Click "Add Setting" to register a key.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              settings.map((setting) => (
                <TableRow
                  key={setting.setting_id}
                  sx={{
                    transition: 'background-color 0.15s',
                    '&:hover': {
                      backgroundColor: 'rgba(248, 250, 252, 0.6)',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsApplicationsOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
                          bgcolor: 'rgba(15, 23, 42, 0.04)',
                          px: 0.8,
                          py: 0.4,
                          borderRadius: 1,
                          fontSize: '0.825rem',
                          color: '#1e293b',
                        }}
                      >
                        {setting.setting_key}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {setting.setting_value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                      {setting.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {new Date(setting.updated_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(setting.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton
                        onClick={() => handleOpenDialog(setting)}
                        size="small"
                        title="Edit Configuration"
                        sx={{
                          color: 'primary.main',
                          bgcolor: 'rgba(79, 70, 229, 0.04)',
                          '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.08)' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(setting.setting_id)}
                        size="small"
                        title="Delete Configuration"
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

      {/* Dialog: Edit/Create Setting */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingSetting ? 'Edit System Configuration' : 'Create Configuration Key'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
            <TextField
              fullWidth
              label="Setting Key"
              placeholder="e.g., mail_smtp_port"
              value={formData.setting_key}
              onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
              disabled={!!editingSetting}
              helperText={editingSetting ? 'System key identifiers are read-only after creation' : ''}
            />
            <TextField
              fullWidth
              label="Setting Value"
              placeholder="e.g., 587 or smtp.googlemail.com"
              value={formData.setting_value}
              onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Description"
              placeholder="Specify the use and constraints of this configuration value..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ px: 3, borderRadius: 2 }}>
            {editingSetting ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
