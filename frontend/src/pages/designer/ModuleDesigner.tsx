import React, { useState, useEffect } from "react";
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
  Switch,
} from "@mui/material";
import Grid from "@mui/material/Grid";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { designerAPI } from "../../services/api";
import type {
  Module,
  ModuleCreate,
  ModuleUpdate,
} from "../../types";

const ModuleDesigner: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [formData, setFormData] = useState<ModuleCreate>({
    module_key: "",
    module_name: "",
    description: "",
  });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const response = await designerAPI.getAllModules();
      setModules(response.data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingModule(null);
    setFormData({ module_key: "", module_name: "", description: "" });
    setOpenDialog(true);
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      module_key: module.module_key,
      module_name: module.module_name,
      description: module.description,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (moduleKey: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this module? This will also delete all associated fields and records.",
      )
    ) {
      return;
    }

    try {
      await designerAPI.deleteModule(moduleKey);
      loadModules();
    } catch (error) {
      console.error("Error deleting module:", error);
      alert("Error deleting module");
    }
  };

  const handleSave = async () => {
    try {
      if (editingModule) {
        const updateData: ModuleUpdate = {
          module_name: formData.module_name,
          description: formData.description,
        };
        await designerAPI.updateModule(editingModule.module_key, updateData);
      } else {
        await designerAPI.createModule(formData);
      }
      setOpenDialog(false);
      loadModules();
    } catch (error) {
      console.error("Error saving module:", error);
      alert("Error saving module");
    }
  };

  const handleToggleActive = async (module: Module) => {
    try {
      await designerAPI.updateModule(module.module_key, {
        is_active: !module.is_active,
      });
      loadModules();
    } catch (error) {
      console.error("Error toggling module status:", error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Module Designer
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Create Module
          </Button>
        </Box>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Module Key</TableCell>
                  <TableCell>Module Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : modules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No modules found. Create your first module to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  modules.map((module) => (
                    <TableRow key={module.module_id}>
                      <TableCell>
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {module.module_key}
                        </Typography>
                      </TableCell>
                      <TableCell>{module.module_name}</TableCell>
                      <TableCell>{module.description || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={module.is_active ? "Active" : "Inactive"}
                          color={module.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(module)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(module)}
                          title="Toggle Active"
                        >
                          <Switch checked={module.is_active} size="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(module.module_key)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingModule ? "Edit Module" : "Create New Module"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Module Key"
                value={formData.module_key}
                onChange={(e) =>
                  setFormData({ ...formData, module_key: e.target.value })
                }
                disabled={!!editingModule}
                helperText={
                  editingModule
                    ? "Cannot be changed after creation"
                    : "Unique identifier (e.g., student_inquiry)"
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Module Name"
                value={formData.module_name}
                onChange={(e) =>
                  setFormData({ ...formData, module_name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingModule ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModuleDesigner;
