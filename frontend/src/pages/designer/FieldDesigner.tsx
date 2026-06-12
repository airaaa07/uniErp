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
} from "@mui/material";

import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";

import { designerAPI } from "../../services/api";
import type { Field, FieldCreate, FieldUpdate, FieldType, Module, ModuleColumn } from "../../types";

// Design tokens
const C = {
  navy: "#1E3A8A",
  navyLight: "#EEF2FF",
  navyMid: "#BFDBFE",
  surface: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  borderMid: "#CBD5E1",
  text: "#0F172A",
  textMid: "#475569",
  textFaint: "#94A3B8",
  red: "#A32D2D",
  redBg: "#FCEBEB",
  redBorder: "#FCA5A5",
  green: "#27500A",
  greenBg: "#EAF3DE",
  greenBorder: "#C0DD97",
  amber: "#633806",
  amberBg: "#FAEEDA",
  amberBorder: "#FAC775",
  teal: "#085041",
  tealBg: "#E1F5EE",
  tealBorder: "#5DCAA5",
  purple: "#3C3489",
  purpleBg: "#EEEDFE",
  purpleBorder: "#AFA9EC",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  text: { bg: "#E6F1FB", color: "#0C447C" },
  number: { bg: "#FAEEDA", color: "#633806" },
  date: { bg: "#E1F5EE", color: "#085041" },
  select: { bg: "#EEEDFE", color: "#3C3489" },
  textarea: { bg: "#F1EFE8", color: "#444441" },
};

const fieldTypes: FieldType[] = [
  "text", "number", "date", "datetime", "boolean", "select", "multiselect", "radio", "textarea", "email", "phone", "url"
];

// Helper to convert label to field key
function toKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

// Toggle component
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        background: checked ? C.navy : C.borderMid,
        opacity: disabled ? 0.45 : 1,
        transition: "background .18s",
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          top: 3,
          left: checked ? 19 : 3,
          transition: "left .15s",
        }}
      />
    </button>
  );
}

// CustomChip component
function CustomChip({ children, scheme = "gray" }: { children: React.ReactNode; scheme?: string }) {
  const schemes: Record<string, { bg: string; color: string; border: string }> = {
    blue: { bg: "#E6F1FB", color: "#0C447C", border: "#9FC7F0" },
    red: { bg: C.redBg, color: C.red, border: C.redBorder },
    green: { bg: C.greenBg, color: C.green, border: C.greenBorder },
    amber: { bg: C.amberBg, color: C.amber, border: C.amberBorder },
    teal: { bg: C.tealBg, color: C.teal, border: C.tealBorder },
    purple: { bg: C.purpleBg, color: C.purple, border: C.purpleBorder },
    gray: { bg: C.bg, color: C.textFaint, border: C.border },
  };
  const c = schemes[scheme] || schemes.gray;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 4,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
        border: `0.5px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// Type pill component
function TypePill({ type }: { type: string }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.text;
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 7px",
        borderRadius: 4,
        fontWeight: 600,
        background: c.bg,
        color: c.color,
      }}
    >
      {type}
    </span>
  );
}

// Section component
function Section({
  icon,
  title,
  open: initOpen = true,
  children,
}: {
  icon: string;
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(initOpen);
  return (
    <div style={{ borderBottom: `0.5px solid ${C.border}` }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 16px",
          cursor: "pointer",
          background: C.bg,
          userSelect: "none",
        }}
      >
        <span>{icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.textMid,
            flex: 1,
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 13,
            color: C.textFaint,
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform .18s",
          }}
        >
          ›
        </span>
      </div>
      {open && (
        <div
          style={{
            padding: "14px 16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Field row component
function FieldRow({
  field,
  selected,
  onClick,
}: {
  field: Field;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 10px",
        margin: "0 6px 2px",
        cursor: "pointer",
        borderRadius: 6,
        borderLeft: `2px solid ${selected ? C.navy : "transparent"}`,
        background: selected ? C.navyLight : "transparent",
        opacity: field.is_active ? 1 : 0.5,
        transition: "all .1s",
      }}
    >
      <TypePill type={field.field_type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: selected ? C.navy : C.text,
          }}
        >
          {field.label || <span style={{ color: C.textFaint }}>Untitled</span>}
        </div>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: C.textFaint }}>
          {field.field_key}
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        {field.is_mandatory && <CustomChip scheme="blue">*</CustomChip>}
        {field.is_pii && <CustomChip scheme="red">P</CustomChip>}
        {field.is_audited && <CustomChip scheme="teal">A</CustomChip>}
        {!field.is_active && <CustomChip scheme="gray">off</CustomChip>}
      </div>
    </div>
  );
}

const FieldDesigner: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [columns, setColumns] = useState<ModuleColumn[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<FieldCreate>({
    module_key: "",
    label: "",
    field_key: "",
    field_type: "text",
    field_group_name: "",
    placeholder: "",
    help_tooltip: "",
    default_value: "",
    min_value: "",
    max_value: "",
    system_field: false,
    is_visible: true,
    is_mandatory: false,
    is_pii: false,
    is_audited: false,
    is_searchable: true,
    is_exportable: true,
    sort_order: 99,
  });

  const selectedField = selectedFieldId ? fields.find((f) => f.field_id === selectedFieldId) : null;

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      loadColumns();
      loadFields();
    }
  }, [selectedModule]);

  const loadModules = async () => {
    try {
      const response = await designerAPI.getAllModules();
      setModules(response.data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
      setModules([]);
    }
  };

  const loadColumns = async () => {
    if (!selectedModule) return;
    try {
      const response = await designerAPI.getModuleColumnsByModule(selectedModule.module_key);
      setColumns(response.data || []);
    } catch (error) {
      console.error("Error loading columns:", error);
      setColumns([]);
    }
  };

  const loadFields = async () => {
    if (!selectedModule) return;
    try {
      const response = await designerAPI.getFieldsByModule(selectedModule.module_key);
      setFields(response.data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
      setFields([]);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setSelectedFieldId(null);
    setSelectedColumnId(null);
    setFormData({
      module_key: selectedModule?.module_key || "",
      label: "",
      field_key: "",
      field_type: "text",
      field_group_name: "",
      placeholder: "",
      help_tooltip: "",
      default_value: "",
      min_value: "",
      max_value: "",
      system_field: false,
      is_visible: true,
      is_mandatory: false,
      is_pii: false,
      is_audited: false,
      is_searchable: true,
      is_exportable: true,
      sort_order: 99,
    });
  };

  const handleEdit = (field: Field) => {
    setIsCreating(false);
    setSelectedFieldId(field.field_id);
    setFormData({
      module_key: field.module_key,
      label: field.label,
      field_key: field.field_key,
      field_type: field.field_type,
      field_group_name: field.field_group_name,
      placeholder: field.placeholder,
      help_tooltip: field.help_tooltip,
      default_value: field.default_value,
      min_value: field.min_value,
      max_value: field.max_value,
      system_field: field.system_field,
      is_visible: field.is_visible,
      is_mandatory: field.is_mandatory,
      is_pii: field.is_pii,
      is_audited: field.is_audited,
      is_searchable: field.is_searchable,
      is_exportable: field.is_exportable,
      sort_order: field.sort_order,
    });
  };

  const handleDelete = async (fieldId: number) => {
    if (!window.confirm("Are you sure you want to delete this field?")) {
      return;
    }

    try {
      await designerAPI.deleteField(fieldId);
      setSelectedFieldId(null);
      loadFields();
    } catch (error) {
      console.error("Error deleting field:", error);
      alert("Error deleting field");
    }
  };

  const handleSave = async () => {
    if (!formData.label.trim()) {
      alert("Label is required");
      return;
    }

    try {
      if (selectedField) {
        const updateData: FieldUpdate = { ...formData };
        await designerAPI.updateField(selectedField.field_id, updateData);
      } else {
        await designerAPI.createField(formData);
      }
      setIsCreating(false);
      setSelectedFieldId(null);
      loadFields();
    } catch (error) {
      console.error("Error saving field:", error);
      alert("Error saving field");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedFieldId(null);
  };

  const setField = (key: keyof FieldCreate, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const onLabelChange = (value: string) => {
    setField("label", value);
    if (!formData.field_key || formData.field_key === toKey(formData.label)) {
      setField("field_key", toKey(value));
    }
  };

  // Filter fields based on search
  const activeFields = fields.filter(
    (f) =>
      (f.is_active ?? true) &&
      (!searchQuery ||
        f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.field_key.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const retiredFields = fields.filter(
    (f) =>
      !(f.is_active ?? true) &&
      (!searchQuery || f.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statePill = !(formData.is_visible ?? true) ? (
    <CustomChip scheme="amber">Hidden</CustomChip>
  ) : (
    <CustomChip scheme="green">Live</CustomChip>
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "inherit" }}>
      {/* Header */}
      <Box sx={{ padding: "12px 16px", borderBottom: `0.5px solid ${C.border}`, background: C.surface }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Field Designer
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Select Module</InputLabel>
          <Select
            value={selectedModule?.module_key || ""}
            label="Select Module"
            onChange={(e) => {
              const module = modules.find(m => m.module_key === e.target.value);
              setSelectedModule(module || null);
              setSelectedFieldId(null);
              setSelectedColumnId(null);
            }}
          >
            {modules.map((module) => (
              <MenuItem key={module.module_key} value={module.module_key}>
                {module.module_name} ({module.module_key})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedModule ? (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar */}
          <Box
            sx={{
              width: 236,
              flexShrink: 0,
              borderRight: `0.5px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              background: C.bg,
            }}
          >
            <Box sx={{ padding: "10px 10px 8px" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  border: `0.5px solid ${C.borderMid}`,
                  borderRadius: 1,
                  padding: "5px 9px",
                  background: C.surface,
                  mb: 2,
                }}
              >
                <SearchIcon sx={{ color: C.textFaint, fontSize: 16 }} />
                <TextField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fields…"
                  size="small"
                  sx={{
                    border: "none",
                    outline: "none",
                    fontSize: 12,
                    flex: 1,
                    background: "transparent",
                    "& .MuiInputBase-root": { background: "transparent" },
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                />
              </Box>
              <Button
                onClick={handleCreate}
                fullWidth
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
              >
                Add Field
              </Button>
            </Box>
            <Box sx={{ flex: 1, overflowY: "auto", pb: 2 }}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.textFaint,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  px: 2,
                  pb: 0.5,
                }}
              >
                Active Fields ({activeFields.length})
              </Typography>
              {activeFields.map((f) => (
                <FieldRow
                  key={f.field_id}
                  field={f}
                  selected={selectedFieldId === f.field_id}
                  onClick={() => handleEdit(f)}
                />
              ))}
              {!activeFields.length && !searchQuery && (
                <Typography sx={{ fontSize: 12, color: C.textFaint, px: 3.5, py: 1 }}>
                  No active fields.
                </Typography>
              )}
              {retiredFields.length > 0 && (
                <>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: C.textFaint,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      px: 2,
                      pt: 1.5,
                      pb: 0.5,
                    }}
                  >
                    Retired ({retiredFields.length})
                  </Typography>
                  {retiredFields.map((f) => (
                    <FieldRow
                      key={f.field_id}
                      field={f}
                      selected={selectedFieldId === f.field_id}
                      onClick={() => handleEdit(f)}
                    />
                  ))}
                </>
              )}
            </Box>
            <Box
              sx={{
                p: 1,
                borderTop: `0.5px solid ${C.border}`,
                fontSize: 11,
                color: C.textFaint,
              }}
            >
              {fields.filter((f) => f.is_active ?? true).length} active · {fields.filter((f) => f.is_pii).length} PII ·{" "}
              {fields.filter((f) => f.is_audited).length} audited
            </Box>
          </Box>

          {/* Editor Panel */}
          <Box sx={{ flex: 1, overflow: "hidden", background: C.surface }}>
            {selectedColumnId ? (
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <Box
                  sx={{
                    p: "12px 16px",
                    borderBottom: `0.5px solid ${C.border}`,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {columns.find(c => c.column_id === selectedColumnId)?.column_name}
                      </Typography>
                      <CustomChip scheme="gray">
                        {columns.find(c => c.column_id === selectedColumnId)?.db_data_type}
                      </CustomChip>
                    </Box>
                    <Button
                      onClick={() => setSelectedColumnId(null)}
                      size="small"
                      sx={{
                        border: `0.5px solid ${C.border}`,
                        borderRadius: 1,
                        background: "transparent",
                        color: C.textMid,
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                  {/* Config strip */}
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {columns.find(c => c.column_id === selectedColumnId)?.is_primary_key && <CustomChip scheme="blue">🔑 Primary Key</CustomChip>}
                    {!columns.find(c => c.column_id === selectedColumnId)?.is_nullable && <CustomChip scheme="amber">NOT NULL</CustomChip>}
                    {columns.find(c => c.column_id === selectedColumnId)?.is_unique && <CustomChip scheme="purple">UNIQUE</CustomChip>}
                    {columns.find(c => c.column_id === selectedColumnId)?.is_auto_increment && <CustomChip scheme="green">AUTO INCREMENT</CustomChip>}
                  </Box>
                </Box>

                {/* Scrollable body */}
                <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
                  <Section icon="📋" title="Column Details">
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Column Name</Typography>
                      <Typography sx={{ fontSize: 12, color: C.textMid }}>
                        {columns.find(c => c.column_id === selectedColumnId)?.column_name}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Data Type</Typography>
                      <Typography sx={{ fontSize: 12, color: C.textMid }}>
                        {columns.find(c => c.column_id === selectedColumnId)?.db_data_type}
                      </Typography>
                    </Box>
                    {columns.find(c => c.column_id === selectedColumnId)?.db_length && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Length</Typography>
                        <Typography sx={{ fontSize: 12, color: C.textMid }}>
                          {columns.find(c => c.column_id === selectedColumnId)?.db_length}
                        </Typography>
                      </Box>
                    )}
                    {columns.find(c => c.column_id === selectedColumnId)?.db_precision && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Precision</Typography>
                        <Typography sx={{ fontSize: 12, color: C.textMid }}>
                          {columns.find(c => c.column_id === selectedColumnId)?.db_precision}
                        </Typography>
                      </Box>
                    )}
                    {columns.find(c => c.column_id === selectedColumnId)?.db_scale && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Scale</Typography>
                        <Typography sx={{ fontSize: 12, color: C.textMid }}>
                          {columns.find(c => c.column_id === selectedColumnId)?.db_scale}
                        </Typography>
                      </Box>
                    )}
                    {columns.find(c => c.column_id === selectedColumnId)?.default_value && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Default Value</Typography>
                        <Typography sx={{ fontSize: 12, color: C.textMid }}>
                          {columns.find(c => c.column_id === selectedColumnId)?.default_value}
                        </Typography>
                      </Box>
                    )}
                    {columns.find(c => c.column_id === selectedColumnId)?.check_constraint && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Check Constraint</Typography>
                        <Typography sx={{ fontSize: 12, color: C.textMid }}>
                          {columns.find(c => c.column_id === selectedColumnId)?.check_constraint}
                        </Typography>
                      </Box>
                    )}
                    {columns.find(c => c.column_id === selectedColumnId)?.foreign_module_id && (
                      <Box sx={{ gridColumn: "span 2" }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>Foreign Key</Typography>
                        <Typography sx={{ fontSize: 12, color: C.textMid }}>
                          References module ID: {columns.find(c => c.column_id === selectedColumnId)?.foreign_module_id}, column: {columns.find(c => c.column_id === selectedColumnId)?.foreign_column_name}
                        </Typography>
                      </Box>
                    )}
                  </Section>
                </Box>
              </Box>
            ) : isCreating || selectedField ? (
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <Box
                  sx={{
                    p: "12px 16px",
                    borderBottom: `0.5px solid ${C.border}`,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {isCreating ? "New field" : selectedField?.label || "Edit field"}
                      </Typography>
                      <TypePill type={formData.field_type} />
                      {statePill}
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {!isCreating && selectedField && (
                        <Button
                          onClick={() => handleDelete(selectedField.field_id)}
                          size="small"
                          sx={{
                            border: `0.5px solid ${C.redBorder}`,
                            borderRadius: 1,
                            background: "transparent",
                            color: C.red,
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      <Button
                        onClick={handleCancel}
                        size="small"
                        sx={{
                          border: `0.5px solid ${C.border}`,
                          borderRadius: 1,
                          background: "transparent",
                          color: C.textMid,
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        variant="contained"
                        size="small"
                        sx={{ borderRadius: 1 }}
                      >
                        {isCreating ? "Add field" : "Save changes"}
                      </Button>
                    </Box>
                  </Box>
                  {/* Config strip */}
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {formData.is_mandatory && <CustomChip scheme="blue">✱ Mandatory</CustomChip>}
                    {formData.is_pii && <CustomChip scheme="red">🛡 PII</CustomChip>}
                    {formData.is_audited && <CustomChip scheme="teal">⏱ Audited</CustomChip>}
                    {formData.help_tooltip && <CustomChip scheme="purple">ⓘ Tooltip</CustomChip>}
                    {formData.default_value && <CustomChip scheme="amber">✎ Default: {formData.default_value}</CustomChip>}
                    {!formData.is_searchable && <CustomChip scheme="gray">⊘ Not searchable</CustomChip>}
                    {!formData.is_exportable && <CustomChip scheme="gray">⊘ No export</CustomChip>}
                  </Box>
                </Box>

                {/* Scrollable body */}
                <Box sx={{ flex: 1, overflowY: "auto" }}>
                  <Section icon="📝" title="Basic" open={true}>
                    <Box sx={{ gridColumn: "span 2" }}>
                      <TextField
                        fullWidth
                        label="Display label"
                        value={formData.label}
                        onChange={(e) => onLabelChange(e.target.value)}
                        placeholder="e.g. Guardian name"
                        autoFocus={isCreating}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ gridColumn: "span 2" }}>
                      <TextField
                        fullWidth
                        label="Field key"
                        value={formData.field_key}
                        onChange={(e) => setField("field_key", e.target.value)}
                        placeholder="guardian_name"
                        helperText="Auto-generated. Lowercase + underscores only."
                        size="small"
                        disabled
                        sx={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                    </Box>
                    <FormControl fullWidth size="small">
                      <InputLabel>Field Type</InputLabel>
                      <Select
                        value={formData.field_type}
                        onChange={(e) => setField("field_type", e.target.value as FieldType)}
                        label="Field Type"
                      >
                        {fieldTypes.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select column</InputLabel>
                      <Select
                        value={formData.field_key}
                        onChange={(e) => setField("field_key", e.target.value)}
                        label="Map to table column"
                      >
                        <MenuItem value="">— None —</MenuItem>
                        {columns.map((column) => (
                          <MenuItem key={column.column_id} value={column.column_name}>
                            {column.column_name} ({column.db_data_type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                      <InputLabel>Field group</InputLabel>
                      <Select
                        value={formData.field_group_name}
                        onChange={(e) => setField("field_group_name", e.target.value)}
                        label="Field group"
                      >
                        <MenuItem value="">— None —</MenuItem>
                        {modules.map((module) => (
                          <MenuItem key={module.module_id} value={module.module_key}>
                            {module.module_key}
                          </MenuItem>
                        ))}
                        <MenuItem value="__custom__">+ Custom field group...</MenuItem>
                      </Select>
                    </FormControl>
                    {formData.field_group_name === "__custom__" && (
                      <TextField
                        fullWidth
                        label="Custom field group name"
                        value=""
                        onChange={(e) => setField("field_group_name", e.target.value)}
                        placeholder="e.g. Academic details"
                        size="small"
                        sx={{ gridColumn: "span 2" }}
                      />
                    )}
                    <TextField
                      fullWidth
                      label="Placeholder"
                      value={formData.placeholder}
                      onChange={(e) => setField("placeholder", e.target.value)}
                      placeholder="Text shown inside empty input"
                      size="small"
                      sx={{ gridColumn: "span 2" }}
                    />
                  </Section>

                  <Section icon="✅" title="Validation & defaults" open={false}>
                    <TextField
                      fullWidth
                      label="Default value"
                      value={formData.default_value}
                      onChange={(e) => setField("default_value", e.target.value)}
                      placeholder="Leave blank for none"
                      helperText="Pre-filled when the form opens."
                      size="small"
                      sx={{ gridColumn: "span 2" }}
                    />
                    {["number", "date"].includes(formData.field_type) && (
                      <>
                        <TextField
                          fullWidth
                          label="Min value"
                          value={formData.min_value}
                          onChange={(e) => setField("min_value", e.target.value)}
                          size="small"
                        />
                        <TextField
                          fullWidth
                          label="Max value"
                          value={formData.max_value}
                          onChange={(e) => setField("max_value", e.target.value)}
                          size="small"
                        />
                      </>
                    )}
                    <TextField
                      fullWidth
                      label="Sort order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setField("sort_order", parseInt(e.target.value) || 0)}
                      helperText="Lower number = appears earlier."
                      size="small"
                    />
                  </Section>

                  <Section icon="⚙️" title="Behaviour" open={true}>
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: `0.5px solid ${C.bg}`,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Visible on form</Typography>
                          <Typography sx={{ fontSize: 11, color: C.textFaint }}>
                            Toggle without deleting the field or its data.
                          </Typography>
                        </Box>
                        <Toggle checked={Boolean(formData.is_visible)} onChange={(v) => setField("is_visible", v)} />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: `0.5px solid ${C.bg}`,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Mandatory</Typography>
                          <Typography sx={{ fontSize: 11, color: C.textFaint }}>
                            Student cannot submit without filling this field.
                          </Typography>
                        </Box>
                        <Toggle checked={Boolean(formData.is_mandatory)} onChange={(v) => setField("is_mandatory", v)} />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: `0.5px solid ${C.bg}`,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Searchable</Typography>
                          <Typography sx={{ fontSize: 11, color: C.textFaint }}>
                            Admin can filter the student list by this field.
                          </Typography>
                        </Box>
                        <Toggle checked={Boolean(formData.is_searchable)} onChange={(v) => setField("is_searchable", v)} />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Include in exports</Typography>
                          <Typography sx={{ fontSize: 11, color: C.textFaint }}>
                            Field appears in CSV and Excel exports.
                          </Typography>
                        </Box>
                        <Toggle checked={Boolean(formData.is_exportable)} onChange={(v) => setField("is_exportable", v)} />
                      </Box>
                    </Box>
                  </Section>

                  <Section icon="💬" title="Help tooltip" open={false}>
                    <TextField
                      fullWidth
                      label="Tooltip text"
                      value={formData.help_tooltip}
                      onChange={(e) => setField("help_tooltip", e.target.value)}
                      placeholder="Guidance shown when student hovers ⓘ…"
                      helperText="Leave blank to hide the ⓘ icon on the form."
                      multiline
                      rows={3}
                      size="small"
                      sx={{ gridColumn: "span 2" }}
                    />
                  </Section>

                  <Section icon="🛡️" title="Data governance" open={true}>
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          borderBottom: `0.5px solid ${C.bg}`,
                          background: formData.is_pii ? "#FFFBEB" : "transparent",
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>PII — personally identifiable</Typography>
                          <Typography sx={{ fontSize: 11, color: C.textFaint }}>
                            Masked for non-privileged roles. Excluded from bulk exports unless approved.
                          </Typography>
                        </Box>
                        <Toggle checked={Boolean(formData.is_pii)} onChange={(v) => setField("is_pii", v)} />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 0",
                          background: formData.is_audited ? "#FFFBEB" : "transparent",
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Audited — track all changes</Typography>
                          <Typography sx={{ fontSize: 11, color: C.textFaint }}>
                            Every change written to field_audit_log via DB trigger with old value, new value, and who changed it.
                          </Typography>
                        </Box>
                        <Toggle checked={Boolean(formData.is_audited)} onChange={(v) => setField("is_audited", v)} />
                      </Box>
                    </Box>
                  </Section>

                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 2.5,
                  color: C.textFaint,
                }}
              >
                <Typography sx={{ fontSize: 42 }}>⚙️</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>
                  Select a field to configure
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    textAlign: "center",
                    maxWidth: 220,
                    lineHeight: 1.7,
                    color: C.textFaint,
                  }}
                >
                  Click any field in the list, or click <strong style={{ color: C.textMid }}>+ Add field</strong> to create a new
                  attribute.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 2,
            color: C.textFaint,
          }}
        >
          <Typography sx={{ fontSize: 40 }}>🔑</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>
            Enter a module key to get started
          </Typography>
          <Typography sx={{ fontSize: 12, color: C.textFaint }}>
            Enter the module key above to load and manage its fields
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FieldDesigner;
