import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Switch,
  Chip,
} from "@mui/material";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { designerAPI } from "../../services/api";
import type { Module, ModuleColumn, ModuleColumnCreate, ModuleColumnUpdate } from "../../types";

const ColumnDesigner: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [columns, setColumns] = useState<ModuleColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ModuleColumn | null>(null);

  const [formData, setFormData] = useState<ModuleColumnCreate>({
    module_id: "",
    column_name: "",
    db_data_type: "varchar",
    db_length: undefined,
    db_precision: undefined,
    db_scale: undefined,
    is_nullable: true,
    is_unique: false,
    is_primary_key: false,
    is_auto_increment: false,
    default_value: undefined,
    check_constraint: undefined,
    foreign_module_id: undefined,
    foreign_column_name: undefined,
  });

  const dbDataTypes = [
    "varchar",
    "integer",
    "bigint",
    "decimal",
    "numeric",
    "boolean",
    "date",
    "timestamp",
    "text",
    "jsonb",
  ];

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      loadColumns();
    }
  }, [selectedModule]);

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

  const loadColumns = async () => {
    if (!selectedModule) return;
    try {
      setLoading(true);
      const response = await designerAPI.getModuleColumnsByModule(selectedModule.module_key);
      setColumns(response.data || []);
    } catch (error) {
      console.error("Error loading columns:", error);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!selectedModule) {
      alert("Please select a module first");
      return;
    }
    setEditingColumn(null);
    setFormData({
      module_id: selectedModule.module_id,
      column_name: "",
      db_data_type: "varchar",
      db_length: undefined,
      db_precision: undefined,
      db_scale: undefined,
      is_nullable: true,
      is_unique: false,
      is_primary_key: false,
      is_auto_increment: false,
      default_value: undefined,
      check_constraint: undefined,
      foreign_module_id: undefined,
      foreign_column_name: undefined,
    });
    setOpenDialog(true);
  };

  const handleEdit = (column: ModuleColumn) => {
    setEditingColumn(column);
    setFormData({
      module_id: column.module_id,
      column_name: column.column_name,
      db_data_type: column.db_data_type,
      db_length: column.db_length,
      db_precision: column.db_precision,
      db_scale: column.db_scale,
      is_nullable: column.is_nullable,
      is_unique: column.is_unique,
      is_primary_key: column.is_primary_key,
      is_auto_increment: column.is_auto_increment,
      default_value: column.default_value,
      check_constraint: column.check_constraint,
      foreign_module_id: column.foreign_module_id,
      foreign_column_name: column.foreign_column_name,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (columnId: number) => {
    if (!window.confirm("Are you sure you want to delete this column?")) {
      return;
    }

    try {
      await designerAPI.deleteModuleColumn(columnId);
      loadColumns();
    } catch (error) {
      console.error("Error deleting column:", error);
      alert("Error deleting column");
    }
  };

  const handleSave = async () => {
    if (!formData.column_name.trim()) {
      alert("Column name is required");
      return;
    }

    try {
      if (editingColumn) {
        const updateData: ModuleColumnUpdate = { ...formData };
        await designerAPI.updateModuleColumn(editingColumn.column_id, updateData);
      } else {
        await designerAPI.createModuleColumn(formData);
      }
      setOpenDialog(false);
      loadColumns();
    } catch (error) {
      console.error("Error saving column:", error);
      alert("Error saving column");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Column Designer
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Module</InputLabel>
          <Select
            value={selectedModule?.module_id || ""}
            onChange={(e) => {
              const module = modules.find((m) => m.module_id === e.target.value);
              setSelectedModule(module || null);
            }}
            label="Select Module"
          >
            {modules.map((module) => (
              <MenuItem key={module.module_id} value={module.module_id}>
                {module.module_name} ({module.module_key})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedModule && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">
              Columns for {selectedModule.module_name}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Add Column
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Column Name</TableCell>
                  <TableCell>Data Type</TableCell>
                  <TableCell>Length</TableCell>
                  <TableCell>Nullable</TableCell>
                  <TableCell>Primary Key</TableCell>
                  <TableCell>Unique</TableCell>
                  <TableCell>Auto Increment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : columns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No columns found. Add your first column to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  columns.map((column) => (
                    <TableRow key={column.column_id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {column.column_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={column.db_data_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{column.db_length || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={column.is_nullable ? "Yes" : "No"}
                          size="small"
                          color={column.is_nullable ? "default" : "error"}
                        />
                      </TableCell>
                      <TableCell>
                        {column.is_primary_key && <Chip label="PK" size="small" color="primary" />}
                      </TableCell>
                      <TableCell>
                        {column.is_unique && <Chip label="Unique" size="small" color="secondary" />}
                      </TableCell>
                      <TableCell>
                        {column.is_auto_increment && <Chip label="Auto" size="small" color="info" />}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(column)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(column.column_id)}
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
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingColumn ? "Edit Column" : "Create New Column"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Column Name"
              value={formData.column_name}
              onChange={(e) => setFormData({ ...formData, column_name: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={formData.db_data_type}
                onChange={(e) => setFormData({ ...formData, db_data_type: e.target.value })}
                label="Data Type"
              >
                {dbDataTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Length"
              type="number"
              value={formData.db_length || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  db_length: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <TextField
              fullWidth
              label="Precision"
              type="number"
              value={formData.db_precision || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  db_precision: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <TextField
              fullWidth
              label="Scale"
              type="number"
              value={formData.db_scale || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  db_scale: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <TextField
              fullWidth
              label="Default Value"
              value={formData.default_value || ""}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value || undefined })}
            />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography>Nullable</Typography>
              <Switch
                checked={formData.is_nullable}
                onChange={(e) => setFormData({ ...formData, is_nullable: e.target.checked })}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography>Unique</Typography>
              <Switch
                checked={formData.is_unique}
                onChange={(e) => setFormData({ ...formData, is_unique: e.target.checked })}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography>Primary Key</Typography>
              <Switch
                checked={formData.is_primary_key}
                onChange={(e) => setFormData({ ...formData, is_primary_key: e.target.checked })}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography>Auto Increment</Typography>
              <Switch
                checked={formData.is_auto_increment}
                onChange={(e) => setFormData({ ...formData, is_auto_increment: e.target.checked })}
              />
            </Box>
            <TextField
              fullWidth
              label="Check Constraint"
              value={formData.check_constraint || ""}
              onChange={(e) => setFormData({ ...formData, check_constraint: e.target.value || undefined })}
              sx={{ gridColumn: "span 2" }}
              helperText="SQL check constraint (e.g., age > 18)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingColumn ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ColumnDesigner;
