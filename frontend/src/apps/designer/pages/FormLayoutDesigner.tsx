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

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { designerAPI } from "../services/api";
import type { Field, FormLayout, Module, ModuleColumn } from "../types";

interface SortableFieldProps {
  field: Field;
  onEdit: (field: Field) => void;
}

const SortableField: React.FC<SortableFieldProps> = ({ field, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.field_id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{ mb: 2, border: isDragging ? "1px solid #1976d2" : "none" }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              size="small"
              sx={{ cursor: "grab" }}
              {...attributes}
              {...listeners}
            >
              <DragHandleIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {field.label}
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ fontFamily: "monospace" }}
              >
                {field.field_key}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label={field.field_type} size="small" variant="outlined" />
            {field.is_mandatory && (
              <Chip label="Required" size="small" color="error" />
            )}
            <IconButton size="small" onClick={() => onEdit(field)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {field.help_tooltip && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ mt: 1, display: "block", pl: 4.5 }}
          >
            {field.help_tooltip}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

interface DroppableSectionProps {
  sectionName: string;
  fields: Field[];
  onEdit: (field: Field) => void;
}

const DroppableSection: React.FC<DroppableSectionProps> = ({
  sectionName,
  fields,
  onEdit,
}) => {
  const { setNodeRef } = useDroppable({
    id: sectionName,
  });

  return (
    <SortableContext
      id={sectionName}
      items={fields.map((f) => f.field_id.toString())}
      strategy={verticalListSortingStrategy}
    >
      <Box
        ref={setNodeRef}
        sx={{
          p: 2,
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f8fafc",
          borderRadius: "0 0 8px 8px",
          border: "1px solid #e2e8f0",
          borderTop: "none",
        }}
      >
        {fields.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #cbd5e1",
              borderRadius: 2,
              p: 3,
              color: "text.secondary",
              bgcolor: "#f1f5f9",
            }}
          >
            <Typography variant="body2">Drag fields here</Typography>
          </Box>
        ) : (
          fields.map((field) => (
            <SortableField key={field.field_id} field={field} onEdit={onEdit} />
          ))
        )}
      </Box>
    </SortableContext>
  );
};

const FormLayoutDesigner: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [columns, setColumns] = useState<ModuleColumn[]>([]);
  const [layout, setLayout] = useState<FormLayout | null>({
    module_key: "",
    sections: [],
  });
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    // Restore selected module from localStorage after modules are loaded
    const savedModuleId = localStorage.getItem("selectedModuleId");
    if (savedModuleId && modules.length > 0) {
      const savedModule = modules.find((m) => m.module_id === savedModuleId);
      if (savedModule) {
        setSelectedModule(savedModule);
      }
    }
  }, [modules]);

  useEffect(() => {
    if (selectedModule) {
      loadColumns();
      loadLayout();
      // Save selected module to localStorage
      localStorage.setItem("selectedModuleId", selectedModule.module_id);
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
      const response = await designerAPI.getModuleColumnsByModule(
        selectedModule.module_key,
      );
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

      const response = await designerAPI.getFormLayout(
        selectedModule.module_key,
      );

      const layoutData = response.data;

      if (!layoutData) {
        setLayout(null);
        return;
      }

      setLayout({
        ...layoutData,
        sections: Array.isArray(layoutData.sections) ? layoutData.sections : [],
      });
    } catch (error) {
      console.error("Error loading layout:", error);
      setLayout(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldEdit = (field: Field) => {
    alert(
      `Edit field: ${field.field_key}\nNavigate to Field Designer to edit this field.`,
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !layout) return;

    const activeId = Number(active.id);
    const overIdStr = over.id.toString();

    // Find active field and source section
    let activeField: Field | null = null;
    let sourceSectionName = "";
    for (const sec of layout.sections) {
      const found = sec.fields.find((f) => f.field_id === activeId);
      if (found) {
        activeField = found;
        sourceSectionName = sec.name;
        break;
      }
    }

    if (!activeField) return;

    // Find target section and position
    let targetSectionName = "";
    let targetIndex = -1;

    // Check if target is a section header/container
    const isOverSection = layout.sections.some((s) => s.name === overIdStr);
    if (isOverSection) {
      targetSectionName = overIdStr;
      targetIndex = 0;
    } else {
      // Over is another field
      const overId = Number(overIdStr);
      for (const sec of layout.sections) {
        const idx = sec.fields.findIndex((f) => f.field_id === overId);
        if (idx !== -1) {
          targetSectionName = sec.name;
          targetIndex = idx;
          break;
        }
      }
    }

    if (!targetSectionName) return;

    // Same position same section?
    if (sourceSectionName === targetSectionName) {
      const sourceIndex = layout.sections
        .find((s) => s.name === sourceSectionName)!
        .fields.findIndex((f) => f.field_id === activeId);
      if (sourceIndex === targetIndex) return;
    }

    // Build new sections array
    const newSections = layout.sections.map((sec) => {
      let newFields = [...sec.fields];
      if (sec.name === sourceSectionName) {
        newFields = newFields.filter((f) => f.field_id !== activeId);
      }
      if (sec.name === targetSectionName) {
        const insertIdx = targetIndex === -1 ? newFields.length : targetIndex;
        newFields.splice(insertIdx, 0, {
          ...activeField!,
          field_group_name:
            targetSectionName === "General" ? "" : targetSectionName,
        });
      }
      return {
        ...sec,
        fields: newFields,
      };
    });

    // Optimistically update UI
    setLayout({
      ...layout,
      sections: newSections,
    });

    try {
      // 1. If section changed, update the group name database field
      if (sourceSectionName !== targetSectionName) {
        const newGroupName =
          targetSectionName === "General" ? "" : targetSectionName;
        await designerAPI.updateField(activeId, {
          field_group_name: newGroupName,
        });
      }

      // 2. Re-sequence target section sort_orders
      const targetSec = newSections.find((s) => s.name === targetSectionName)!;
      const promises = targetSec.fields.map((f, i) =>
        designerAPI.updateFieldOrder(f.field_id, i + 1),
      );

      // 3. Re-sequence source section sort_orders if changed
      if (sourceSectionName !== targetSectionName) {
        const sourceSec = newSections.find(
          (s) => s.name === sourceSectionName,
        )!;
        sourceSec.fields.forEach((f, i) => {
          promises.push(designerAPI.updateFieldOrder(f.field_id, i + 1));
        });
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to update layout:", error);
      loadLayout();
    }
  };

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
              value={selectedModule?.module_key || ""}
              onChange={(e) => {
                const module = modules.find(
                  (m) => m.module_key === e.target.value,
                );
                setSelectedModule(module || null);
              }}
              label="Select Module"
            >
              {modules.map((module) => (
                <MenuItem key={module.module_key} value={module.module_key}>
                  {module.module_name} ({module.module_key})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {selectedModule && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
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
                    <Grid
                      size={{ xs: 12, sm: 6, md: 4 }}
                      key={column.column_id}
                    >
                      <Card variant="outlined">
                        <CardContent>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {column.column_name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ display: "block" }}
                          >
                            {column.db_data_type}
                          </Typography>
                          <Box
                            sx={{
                              mt: 1,
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            {column.is_primary_key && (
                              <Chip label="PK" size="small" color="primary" />
                            )}
                            {column.is_unique && (
                              <Chip
                                label="Unique"
                                size="small"
                                color="secondary"
                              />
                            )}
                            {!column.is_nullable && (
                              <Chip
                                label="Not Null"
                                size="small"
                                color="error"
                              />
                            )}
                            {column.is_auto_increment && (
                              <Chip label="Auto" size="small" color="info" />
                            )}
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
            ) : !layout?.sections?.length ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="textSecondary">
                  No layout found. Make sure the module has fields defined.
                </Typography>
              </Paper>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Grid container spacing={3}>
                  {layout.sections.map((section, sectionIndex) => (
                    <Grid size={{ xs: 12, md: 6 }} key={sectionIndex}>
                      <Paper
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{ p: 2, bgcolor: "primary.main", color: "white" }}
                        >
                          <Typography variant="h6">{section.name}</Typography>
                          <Typography
                            variant="caption"
                            color="inherit"
                            sx={{ opacity: 0.8 }}
                          >
                            {section.fields.length} field
                            {section.fields.length !== 1 ? "s" : ""}
                          </Typography>
                        </Box>
                        <DroppableSection
                          sectionName={section.name}
                          fields={section.fields}
                          onEdit={handleFieldEdit}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </DndContext>
            )}
          </>
        )}

        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Layout Designer Instructions
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            The Form Layout Designer allows you to organize fields into sections
            for better form organization.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            <strong>How to use:</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: "text.secondary" }}>
            <li>
              Select a module from the dropdown above to load its form layout
            </li>
            <li>
              Drag and drop the fields using the drag handle icon to reorder
              fields within a section or move them between sections
            </li>
            <li>
              Use the Field Designer to create/edit individual fields and
              customize their settings
            </li>
            <li>Use the Column Designer to manage database table columns</li>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="textSecondary">
            <strong>Note:</strong> Changes are saved automatically as you drag
            and drop fields.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default FormLayoutDesigner;
