import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import {
  DragHandle as DragHandleIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

import { designerAPI } from "../../services/api";
import type { Field, FormLayout, Module, ModuleColumn } from "../../types";

const FormLayoutDesigner: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [columns, setColumns] = useState<ModuleColumn[]>([]);
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      loadColumns();
      loadLayout();
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

  const loadLayout = async () => {
    if (!selectedModule) return;
    try {
      setLoading(true);
      const response = await designerAPI.getFormLayout(selectedModule.module_key);
      setLayout(response.data || null);
    } catch (error) {
      console.error("Error loading layout:", error);
      setLayout(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEdit = (field: Field) => {
    // Navigate to field designer with this field pre-loaded
    // This would typically use routing, for now just alert
    alert(`Edit field: ${field.field_key}\nNavigate to Field Designer to edit this field.`);
  };

  const renderFieldCard = (field: Field) => (
    <Card key={field.field_id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton sx={{ cursor: "grab" }}>
              <DragHandleIcon />
            </IconButton>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {field.label}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                {field.field_key}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label={field.field_type} size="small" variant="outlined" />
            {field.is_mandatory && <Chip label="Required" size="small" color="error" />}
            <IconButton size="small" onClick={() => handleFieldEdit(field)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {field.help_tooltip && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            {field.help_tooltip}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Form Layout Designer
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
                Form Layout for {selectedModule.module_name}
              </Typography>
              <Button
                variant="contained"
                onClick={loadLayout}
                disabled={loading}
              >
                Refresh Layout
              </Button>
            </Box>

            {/* Table Columns Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Table Columns
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Columns defined for this module's database table
              </Typography>
              {columns.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No columns defined. Use the Column Designer to add columns.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {columns.map((column) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={column.column_id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {column.column_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {column.db_data_type}
                          </Typography>
                          <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {column.is_primary_key && <Chip label="PK" size="small" color="primary" />}
                            {column.is_unique && <Chip label="Unique" size="small" color="secondary" />}
                            {!column.is_nullable && <Chip label="Not Null" size="small" color="error" />}
                            {column.is_auto_increment && <Chip label="Auto" size="small" color="info" />}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

            {loading ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography>Loading layout...</Typography>
              </Paper>
            ) : !layout || layout.sections.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="textSecondary">
                  No layout found. Make sure the module has fields defined.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {layout.sections.map((section, sectionIndex) => (
                  <Grid size={{ xs: 12, md: 6 }} key={sectionIndex}>
                    <Paper sx={{ height: "100%" }}>
                      <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
                        <Typography variant="h6">
                          {section.name}
                        </Typography>
                        <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                          {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2 }}>
                        {section.fields.length === 0 ? (
                          <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 2 }}>
                            No fields in this section
                          </Typography>
                        ) : (
                          section.fields.map((field) => renderFieldCard(field))
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Layout Designer Instructions
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            The Form Layout Designer allows you to organize fields into sections for better form organization.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            <strong>How to use:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: "text.secondary" }}>
            <li>Select a module from the dropdown above to load its form layout</li>
            <li>View the table columns defined for this module</li>
            <li>Fields are automatically grouped by their section name</li>
            <li>Use the Field Designer to assign fields to sections</li>
            <li>Use the Column Designer to manage database table columns</li>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="textSecondary">
            <strong>Note:</strong> Section names are defined in the Field Designer under the "Section Name" field.
            Fields without a section name are grouped under "General".
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default FormLayoutDesigner;
