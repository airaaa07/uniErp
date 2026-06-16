import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

import { erpRecordAPI } from "../services/api";
import { fetchReferenceOptions } from "../utils/referenceLoader";
import type { Field, FormLayout } from "../types";

interface SimpleOption {
  value: string;
  label: string;
}

interface DynamicFormRendererProps {
  moduleKey: string;
  recordId?: string;
  initialData?: Record<string, any>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  moduleKey,
  recordId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referenceOptions, setReferenceOptions] = useState<Record<string, SimpleOption[]>>({});

  useEffect(() => {
    loadLayout();
  }, [moduleKey, recordId]);

  const loadLayout = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await erpRecordAPI.getFormLayout(moduleKey);
      setLayout(response.data);
      
      // Initialize form data with initialData or default values
      const initial: Record<string, any> = { ...initialData };
      if (!initialData) {
        response.data.sections.forEach((section: any) => {
          section.fields.forEach((field: any) => {
            if (field.default_value) {
              initial[field.field_key] = field.default_value;
            }
          });
        });
      }
      setFormData(initial);

      // Load reference option lists from corresponding modules
      try {
        const modulesRes = await erpRecordAPI.getAllModules();
        const modulesList = modulesRes.data || [];
        const refOpts: Record<string, SimpleOption[]> = {};
        
        for (const section of response.data.sections) {
          for (const field of section.fields) {
            if (["select", "multiselect", "radio"].includes(field.field_type)) {
              const opts = await fetchReferenceOptions(field.field_key, modulesList, true);
              if (opts) {
                refOpts[field.field_key] = opts.map(o => ({ value: o.value, label: o.label }));
              }
            }
          }
        }
        setReferenceOptions(refOpts);
      } catch (refErr) {
        console.error("Failed to load reference options:", refErr);
      }

    } catch (error) {
      console.error("Error loading layout:", error);
      setError("Failed to load form. Please check if the module exists and is published.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData({ ...formData, [fieldKey]: value });
  };

  const validateForm = (): boolean => {
    if (!layout) return false;
    
    for (const section of layout.sections) {
      for (const field of section.fields) {
        if (field.is_mandatory && !formData[field.field_key] && formData[field.field_key] !== false) {
          setError(`${field.label} is required`);
          return false;
        }
        
        // Validate min/max length for text fields
        if (field.field_type === "text" || field.field_type === "textarea") {
          const value = formData[field.field_key] || "";
          if (field.min_length && value.length < field.min_length) {
            setError(`${field.label} must be at least ${field.min_length} characters`);
            return false;
          }
          if (field.max_length && value.length > field.max_length) {
            setError(`${field.label} must not exceed ${field.max_length} characters`);
            return false;
          }
        }
        
        // Validate min/max value for number fields
        if (field.field_type === "number") {
          const value = parseFloat(formData[field.field_key]);
          if (field.min_value && value < parseFloat(field.min_value)) {
            setError(`${field.label} must be at least ${field.min_value}`);
            return false;
          }
          if (field.max_value && value > parseFloat(field.max_value)) {
            setError(`${field.label} must not exceed ${field.max_value}`);
            return false;
          }
        }
        
        // Validate regex
        if (field.regex_validation && formData[field.field_key]) {
          const regex = new RegExp(field.regex_validation);
          if (!regex.test(formData[field.field_key])) {
            setError(`${field.label} format is invalid`);
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (recordId) {
        await erpRecordAPI.updateRecord(recordId, {
          data: formData,
        });
      } else {
        await erpRecordAPI.createRecord({
          module_key: moduleKey,
          data: formData,
        });
      }
      
      setSuccess(true);
      if (!recordId) {
        setFormData({});
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.field_key] ?? field.default_value ?? "";
    const error = field.is_mandatory && !value && value !== false;
    const options = referenceOptions[field.field_key] || field.dropdown_options || [];

    switch (field.field_type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            helperText={field.help_tooltip}
            required={field.is_mandatory}
            error={error}
            type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : field.field_type === "url" ? "url" : "text"}
            disabled={field.is_read_only}
          />
        );

      case "number":
        return (
          <TextField
            fullWidth
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            helperText={field.help_tooltip}
            required={field.is_mandatory}
            error={error}
            disabled={field.is_read_only}
            slotProps={{
              htmlInput: {
                min: field.min_value,
                max: field.max_value,
              },
            }}
          />
        );

      case "textarea":
        return (
          <TextField
            fullWidth
            label={field.label}
            multiline
            rows={4}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            helperText={field.help_tooltip}
            required={field.is_mandatory}
            error={error}
            disabled={field.is_read_only}
          />
        );

      case "date":
        return (
          <TextField
            fullWidth
            label={field.label}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            helperText={field.help_tooltip}
            required={field.is_mandatory}
            error={error}
            disabled={field.is_read_only}
          />
        );

      case "datetime":
        return (
          <TextField
            fullWidth
            label={field.label}
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            helperText={field.help_tooltip}
            required={field.is_mandatory}
            error={error}
            disabled={field.is_read_only}
          />
        );

      case "boolean":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value === true || value === "true"}
                onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
                disabled={field.is_read_only}
              />
            }
            label={field.label}
          />
        );

      case "select":
      case "radio":
        if (field.field_type === "select") {
          return (
            <FormControl fullWidth required={field.is_mandatory} error={error} disabled={field.is_read_only}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={value}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                label={field.label}
              >
                <MenuItem value="">Select an option</MenuItem>
                {options.map((option: SimpleOption, idx: number) => (
                  <MenuItem key={idx} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        } else {
          return (
            <FormControl component="fieldset" required={field.is_mandatory} error={error} disabled={field.is_read_only}>
              <Typography variant="subtitle2" gutterBottom>
                {field.label}
              </Typography>
              <RadioGroup
                value={value}
                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              >
                {options.map((option: SimpleOption, idx: number) => (
                  <FormControlLabel
                    key={idx}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          );
        }

      case "multiselect":
        return (
          <FormControl fullWidth required={field.is_mandatory} error={error} disabled={field.is_read_only}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              multiple
              value={Array.isArray(value) ? value : value ? [value] : []}
              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              label={field.label}
            >
              {options.map((option: SimpleOption, idx: number) => (
                <MenuItem key={idx} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            helperText={field.help_tooltip}
            required={field.is_mandatory}
            error={error}
            disabled={field.is_read_only}
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
        <CircularProgress size={36} sx={{ color: "#650C08" }} />
      </Box>
    );
  }

  if (error && !layout) {
    return (
      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!layout) {
    return null;
  }

  return (
    <Box>
      {onCancel && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onCancel}
          sx={{ mb: 2.5, color: "#650C08" }}
        >
          Back
        </Button>
      )}

      <Paper sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#650C08", mb: 1 }}>
            {layout.sections[0]?.fields[0]?.field_group_name || layout.module_name || moduleKey}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
            Please fill out the form fields. Fields marked with * are mandatory.
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Form submitted successfully!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {layout.sections.map((section, sectionIndex) => (
            <Box key={sectionIndex} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: "#650C08" }}>
                {section.name}
              </Typography>
              <Grid container spacing={3}>
                {section.fields
                  .filter(field => field.is_visible)
                  .map((field) => (
                    <Grid size={field.field_type === "textarea" ? 12 : 6} key={field.field_id}>
                      {renderField(field)}
                    </Grid>
                  ))}
              </Grid>
              {sectionIndex < layout.sections.length - 1 && <Divider sx={{ mt: 4 }} />}
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 2, mt: 4, pt: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ bgcolor: "#650C08", px: 4, borderRadius: 2, "&:hover": { bgcolor: "#7a1d16" } }}
            >
              {submitting ? "Saving..." : recordId ? "Save Changes" : "Submit"}
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={submitting}
                sx={{ borderRadius: 2, color: "text.secondary", borderColor: "divider" }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DynamicFormRenderer;
