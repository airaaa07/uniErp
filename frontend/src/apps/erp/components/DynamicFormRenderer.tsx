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
import type { Field, FormLayout, DropdownOption } from "../types";

interface DynamicFormRendererProps {
  moduleKey: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  moduleKey,
  onSuccess,
  onCancel,
}) => {
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadLayout();
  }, [moduleKey]);

  const loadLayout = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await erpRecordAPI.getFormLayout(moduleKey);
      setLayout(response.data);
      
      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      response.data.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.default_value) {
            initialData[field.field_key] = field.default_value;
          }
        });
      });
      setFormData(initialData);
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
      
      await erpRecordAPI.createRecord({
        module_key: moduleKey,
        data: formData,
      });
      
      setSuccess(true);
      setFormData({});
      
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
    const value = formData[field.field_key] || field.default_value || "";
    const error = field.is_mandatory && !value && value !== false;

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
        const options = field.dropdown_options || [];
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
                {options.map((option: DropdownOption, idx: number) => (
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
                {options.map((option: DropdownOption, idx: number) => (
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
        const multiOptions = field.dropdown_options || [];
        return (
          <FormControl fullWidth required={field.is_mandatory} error={error} disabled={field.is_read_only}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              multiple
              value={value || []}
              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              label={field.label}
            >
              {multiOptions.map((option: DropdownOption, idx: number) => (
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !layout) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
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
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      )}

      <Paper>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {layout.sections[0]?.fields[0]?.field_group_name || moduleKey}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please fill out the form below. Fields marked with * are required.
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Form submitted successfully!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {layout.sections.map((section, sectionIndex) => (
            <Box key={sectionIndex} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                {section.name}
              </Typography>
              <Grid container spacing={3}>
                {section.fields
                  .filter(field => field.is_visible)
                  .map((field) => (
                    <Grid size={{ xs: 12, sm: field.field_type === "textarea" ? 12 : 6 }} key={field.field_id}>
                      {renderField(field)}
                    </Grid>
                  ))}
              </Grid>
              {sectionIndex < layout.sections.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={submitting}
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
