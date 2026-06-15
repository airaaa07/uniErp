import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
} from "@mui/material";

import { designerAPI } from "../services/api";
import type { Field, FormLayout, Module } from "../types";

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
};

// Form field component
function FormField({ field, value, onChange, error }: { field: Field; value: any; onChange: (v: any) => void; error?: boolean }) {
  const border = error ? `0.5px solid ${C.redBorder}` : `0.5px solid ${C.borderMid}`;
  const base = {
    width: "100%",
    border,
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 13,
    background: field.is_pii ? "#FFF7F7" : C.surface,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  let ctrl;
  if (field.field_type === "textarea") {
    ctrl = (
      <textarea
        style={{ ...base, resize: "vertical" as const, boxSizing: "border-box" as const }}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  } else if (field.field_type === "boolean") {
    ctrl = (
      <Checkbox
        checked={value === true || value === "true"}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  } else {
    const inputType = field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : field.field_type === "url" ? "url" : field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : field.field_type === "datetime" ? "datetime-local" : "text";
    ctrl = (
      <input
        style={{ ...base, boxSizing: "border-box" as any }}
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        min={field.min_value || undefined}
        max={field.max_value || undefined}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography sx={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>
          {field.label}
        </Typography>
        {field.is_mandatory && <span style={{ color: C.red, fontSize: 12 }}>*</span>}
        {!field.is_mandatory && <span style={{ fontSize: 10, color: C.textFaint }}>(optional)</span>}
        {field.is_pii && <Chip label="PII" size="small" sx={{ background: C.redBg, color: C.red, fontSize: 10, height: 20 }} />}
        {field.help_tooltip && <span title={field.help_tooltip} style={{ cursor: "help", color: C.navyMid, fontSize: 13 }}>ⓘ</span>}
      </Box>
      {ctrl}
      {field.help_tooltip && !error && <Typography sx={{ fontSize: 11, color: C.textFaint, mt: 1 }}>ⓘ {field.help_tooltip}</Typography>}
      {error && <Typography sx={{ fontSize: 11, color: C.red, mt: 1 }}>⚠ Required</Typography>}
    </Box>
  );
}

const FormPreview: React.FC = () => {
  const [moduleKey, setModuleKey] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (moduleKey) {
      loadLayout();
    }
  }, [moduleKey]);

  // Reload layout when component becomes visible (for real-time updates from FieldDesigner)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && moduleKey) {
        loadLayout();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [moduleKey]);

  const loadModules = async () => {
    try {
      const response = await designerAPI.getAllModules();
      setModules(response.data || []);
    } catch (error) {
      console.error("Error loading modules:", error);
    }
  };

  const loadLayout = async () => {
    if (!moduleKey) return;
    try {
      setLoading(true);
      setSubmitted(false);
      const response = await designerAPI.getFormLayout(moduleKey);
      setLayout(response.data || null);

      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      if (response.data?.sections) {
        response.data.sections.forEach((section) => {
          section.fields.forEach((field) => {
            if (field.default_value) {
              initialData[field.field_key] = field.default_value;
            }
          });
        });
      }
      setFormData(initialData);
      setErrors({});
    } catch (error) {
      console.error("Error loading layout:", error);
      setLayout(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData({ ...formData, [fieldKey]: value });
    setErrors({ ...errors, [fieldKey]: "" });
  };

  const handleSave = async () => {
    if (!moduleKey) return;

    // Validate
    const newErrors: Record<string, string> = {};
    if (layout?.sections) {
      layout.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.is_mandatory && !formData[field.field_key]?.trim()) {
            newErrors[field.field_key] = "Required";
          }
        });
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await designerAPI.createRecord({
        module_key: moduleKey,
        data: formData,
      });
      setSubmitted(true);
      setFormData({});
      // Clear saved form data from localStorage after successful submission
      localStorage.removeItem(`formData_${moduleKey}`);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Error saving record");
    }
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
  };

  // Get all visible fields grouped by section
  const getVisibleFields = () => {
    if (!layout?.sections) return [];
    const allFields: { section: string; fields: Field[] }[] = [];
    layout.sections.forEach((section) => {
      const visibleFields = section.fields.filter((f) => f.is_visible);
      if (visibleFields.length > 0) {
        allFields.push({ section: section.name, fields: visibleFields });
      }
    });
    return allFields;
  };

  const groupedFields = getVisibleFields();

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "inherit" }}>
      {/* Header */}
      <Box sx={{ padding: "12px 16px", borderBottom: `0.5px solid ${C.border}`, background: C.surface }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Form Preview
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Select Module</InputLabel>
          <Select
            value={moduleKey}
            onChange={(e) => setModuleKey(e.target.value)}
            label="Select Module"
          >
            <MenuItem value="">— Select a module —</MenuItem>
            {modules.map((module) => (
              <MenuItem key={module.module_id} value={module.module_key}>
                {module.module_name} ({module.module_key})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {moduleKey ? (
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          {submitted ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 3.5,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: C.greenBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                ✓
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.green }}>
                Form submitted successfully
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                <Button
                  onClick={handleReset}
                  sx={{
                    padding: "8px 16px",
                    border: `0.5px solid ${C.border}`,
                    borderRadius: 1,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  New submission
                </Button>
                <Button
                  onClick={() => setSubmitted(false)}
                  sx={{
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: 1,
                    background: C.navy,
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Back to form
                </Button>
              </Box>
            </Box>
          ) : loading ? (
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
              <Typography sx={{ fontSize: 40 }}>⏳</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>
                Loading form...
              </Typography>
            </Box>
          ) : !layout || groupedFields.length === 0 ? (
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
              <Typography sx={{ fontSize: 40 }}>📋</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>
                No form layout found
              </Typography>
              <Typography sx={{ fontSize: 12, color: C.textFaint }}>
                Make sure the module has fields defined and is published.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ height: "100%", overflowY: "auto" }}>
              <Box sx={{ maxWidth: 680, margin: "0 auto", padding: "16px" }}>
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                    {moduleKey} — Form Preview
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: C.textFaint, mt: 1 }}>
                    Fields marked <span style={{ color: C.red }}>*</span> are required · PII fields are stored securely
                  </Typography>
                </Box>

                {groupedFields.map((group, groupIndex) => (
                  <Box key={groupIndex} sx={{ mb: 5 }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textFaint,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                        mb: 3,
                        pb: 1.5,
                        borderBottom: `0.5px solid ${C.border}`,
                      }}
                    >
                      {group.section}
                    </Typography>
                    <Grid container spacing={2}>
                      {group.fields
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((field) => (
                          <Grid size={{ xs: 12, sm: field.field_type === "textarea" ? 12 : 6 }} key={field.field_id}>
                            <FormField
                              field={field}
                              value={formData[field.field_key] || field.default_value || ""}
                              onChange={(v) => handleFieldChange(field.field_key, v)}
                              error={!!errors[field.field_key]}
                            />
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                ))}

                <Box sx={{ display: "flex", gap: 2, pt: 4, borderTop: `0.5px solid ${C.border}` }}>
                  <Button
                    onClick={handleSave}
                    sx={{
                      padding: "9px 22px",
                      background: C.navy,
                      color: "#fff",
                      border: "none",
                      borderRadius: 1,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Submit form
                  </Button>
                  <Button
                    onClick={handleReset}
                    sx={{
                      padding: "9px 14px",
                      border: `0.5px solid ${C.border}`,
                      borderRadius: 1,
                      background: "transparent",
                      fontSize: 13,
                      cursor: "pointer",
                      color: C.textMid,
                    }}
                  >
                    Reset
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
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
            Enter the module key above to load and preview its form
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FormPreview;
