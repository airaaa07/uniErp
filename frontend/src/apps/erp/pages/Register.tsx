import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, CheckCircle, Info, RefreshCw, HelpCircle, FileText, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { publicAPI } from "../services/api";
import type { Field, FormLayout } from "../types";

export default function Register() {
  const [searchParams] = useSearchParams();

  // Get module key from query param or default to "inquiry_master"
  const moduleKey = searchParams.get("module") || "inquiry_master";

  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadLayout();
  }, [moduleKey]);

  const loadLayout = async () => {
    try {
      setLoading(true);
      setSubmitError(null);
      const response = await publicAPI.getFormLayout(moduleKey);
      setLayout(response.data || null);

      // Try to restore from localStorage
      const cached = localStorage.getItem(`inquiryFormData_${moduleKey}`);
      if (cached) {
        try {
          setFormData(JSON.parse(cached));
        } catch {
          // Ignore parse errors
        }
      } else {
        // Initialize with default values
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
      }
    } catch (err: any) {
      console.error("Error loading layout:", err);
      setLayout(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    const updated = { ...formData, [fieldKey]: value };
    setFormData(updated);
    // Cache progress
    localStorage.setItem(`inquiryFormData_${moduleKey}`, JSON.stringify(updated));
    // Clear error
    if (errors[fieldKey]) {
      setErrors({ ...errors, [fieldKey]: "" });
    }
  };

  const validate = (): boolean => {
    if (!layout?.sections) return false;
    const newErrors: Record<string, string> = {};

    layout.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (!field.is_visible) return;

        const val = formData[field.field_key];
        const isString = typeof val === "string";
        const isEmpty = val === undefined || val === null || (isString && val.trim() === "");

        // Required Check
        if (field.is_mandatory && isEmpty) {
          newErrors[field.field_key] = "This field is required";
          return;
        }

        // Email Check
        if (field.field_type === "email" && !isEmpty) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            newErrors[field.field_key] = "Please enter a valid email address";
            return;
          }
        }

        // Phone Check
        if (field.field_type === "phone" && !isEmpty) {
          const phoneRegex = /^[+]?[0-9\s-]{7,15}$/;
          if (!phoneRegex.test(val)) {
            newErrors[field.field_key] = "Please enter a valid phone number";
            return;
          }
        }

        // Min/Max Length check for text/textarea
        if ((field.field_type === "text" || field.field_type === "textarea") && !isEmpty) {
          if (field.min_length && val.length < field.min_length) {
            newErrors[field.field_key] = `Minimum length is ${field.min_length} characters`;
            return;
          }
          if (field.max_length && val.length > field.max_length) {
            newErrors[field.field_key] = `Maximum length is ${field.max_length} characters`;
            return;
          }
        }

        // Number check
        if (field.field_type === "number" && !isEmpty) {
          const num = parseFloat(val);
          if (isNaN(num)) {
            newErrors[field.field_key] = "Please enter a valid number";
            return;
          }
          if (field.min_value && num < parseFloat(field.min_value)) {
            newErrors[field.field_key] = `Value must be at least ${field.min_value}`;
            return;
          }
          if (field.max_value && num > parseFloat(field.max_value)) {
            newErrors[field.field_key] = `Value cannot exceed ${field.max_value}`;
            return;
          }
        }
      });
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      toast.error("Please fill in all required fields correctly.");
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await publicAPI.createRecord({
        module_key: moduleKey,
        data: formData,
      });

      // Success setup
      localStorage.removeItem(`inquiryFormData_${moduleKey}`);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(
        err.response?.data?.error || "Failed to submit form. Please check your network and try again."
      );
      toast.error("Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    localStorage.removeItem(`inquiryFormData_${moduleKey}`);
    setErrors({});
    setSubmitted(false);
    setSubmitError(null);
  };

  // Render dynamic fields
  const renderFieldInput = (field: Field) => {
    const value = formData[field.field_key] ?? "";
    const hasError = !!errors[field.field_key];
    const isPii = field.is_pii;

    const baseInputStyle = `w-full rounded-lg border px-4 py-2.5 outline-none transition duration-150 focus:ring-2 focus:ring-[#650C08] focus:border-transparent ${
      hasError ? "border-rose-400 bg-rose-50/30" : isPii ? "border-amber-200 bg-amber-50/20" : "border-gray-300 hover:border-gray-400"
    } ${field.is_read_only ? "bg-gray-100 cursor-not-allowed text-gray-500" : "text-gray-900 bg-white"}`;

    switch (field.field_type) {
      case "textarea":
        return (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.is_read_only}
            className={baseInputStyle}
          />
        );

      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={value === true || value === "true"}
              onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
              disabled={field.is_read_only}
              className="w-5 h-5 rounded text-[#650C08] border-gray-300 focus:ring-[#650C08]"
            />
            <span className="text-sm font-medium text-gray-700">{field.placeholder || "Yes / Approved"}</span>
          </label>
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            disabled={field.is_read_only}
            className={baseInputStyle}
          >
            <option value="">Select an option</option>
            {field.dropdown_options &&
              Array.isArray(field.dropdown_options) &&
              field.dropdown_options.map((opt: any, idx: number) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        );

      case "multiselect":
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (option) => option.value);
              handleFieldChange(field.field_key, opts);
            }}
            disabled={field.is_read_only}
            className={`${baseInputStyle} h-28`}
          >
            {field.dropdown_options &&
              Array.isArray(field.dropdown_options) &&
              field.dropdown_options.map((opt: any, idx: number) => (
                <option key={idx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        );

      case "radio":
        return (
          <div className="flex flex-col gap-2 mt-1">
            {field.dropdown_options &&
              Array.isArray(field.dropdown_options) &&
              field.dropdown_options.map((opt: any, idx: number) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name={field.field_key}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={() => handleFieldChange(field.field_key, opt.value)}
                    disabled={field.is_read_only}
                    className="text-[#650C08] focus:ring-[#650C08]"
                  />
                  {opt.label}
                </label>
              ))}
          </div>
        );

      default:
        const inputType =
          field.field_type === "email"
            ? "email"
            : field.field_type === "phone"
            ? "tel"
            : field.field_type === "url"
            ? "url"
            : field.field_type === "number"
            ? "number"
            : field.field_type === "date"
            ? "date"
            : field.field_type === "datetime"
            ? "datetime-local"
            : "text";
        return (
          <input
            type={inputType}
            value={value}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.is_read_only}
            min={field.min_value || undefined}
            max={field.max_value || undefined}
            className={baseInputStyle}
          />
        );
    }
  };

  const universityPanelGradient = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal" as const,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-7xl min-h-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* LEFT BRAND PANEL */}
        <div
          className="w-full lg:w-[32%] flex flex-col justify-between p-8 lg:p-10 text-white relative overflow-hidden"
          style={universityPanelGradient}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-2xl border border-white/20 shadow-lg">
              U
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-lg text-rose-100">University</h1>
              <p className="text-xs text-rose-200/80 uppercase tracking-widest font-semibold">Admissions</p>
            </div>
          </div>

          <div className="my-10 lg:my-0 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white tracking-tight">
              Begin Your Journey Today.
            </h2>
            <p className="text-sm text-rose-100/85 leading-relaxed">
              Submit your admission inquiry to get in touch with our admissions counsellors and secure your college admission.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p className="text-sm text-rose-100/90">Fill out your academic and personal profile inquiries.</p>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p className="text-sm text-rose-100/90">Submit the inquiry dynamically mapped from the Designer Studio.</p>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p className="text-sm text-rose-100/90">Our counsellors review and reach back to complete documentation.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-rose-200/70 border-t border-white/10 pt-6 mt-6 lg:mt-0">
            <p>Singhania University</p>
            <p>Jhunjhunu, RJ</p>
          </div>
        </div>

        {/* RIGHT DYNAMIC FORM PANEL */}
        <div className="w-full lg:w-[68%] flex flex-col bg-slate-50/50 p-6 sm:p-10 lg:p-14 overflow-y-auto max-h-[85vh] lg:max-h-none justify-center">
          <div className="max-w-3xl mx-auto w-full">
            
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition duration-150"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
              <span className="bg-[#650C08]/10 text-[#650C08] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Module: {moduleKey}
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <RefreshCw className="w-10 h-10 animate-spin text-[#650C08] mb-4" />
                <p className="text-sm font-medium text-gray-600">Loading inquiry form layout...</p>
              </div>
            ) : submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl shadow-md border border-gray-100 max-w-xl mx-auto">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-inner animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-3">
                  Inquiry Submitted Successfully!
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-md">
                  Thank you for applying. Your admission inquiry has been registered. Our counsellor desk will review your credentials and contact you shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-lg border border-gray-300 font-medium text-sm text-gray-700 hover:bg-gray-50 transition duration-150"
                  >
                    Submit Another Inquiry
                  </button>
                  <Link
                    to="/login"
                    className="px-6 py-2.5 rounded-lg bg-[#650C08] hover:bg-[#7a1d16] font-medium text-sm text-white text-center shadow-md shadow-red-900/10 transition duration-150"
                  >
                    Go to Login Portal
                  </Link>
                </div>
              </div>
            ) : !layout || !layout.sections || layout.sections.length === 0 || layout.sections.every(s => !s.fields || s.fields.filter(f => f.is_visible).length === 0) ? (
              
              /* UNCONFIGURED MODULE STATE */
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-[#650C08]/10 text-[#650C08] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Inquiry Module Configuration Pending</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  The inquiry master form schema is not configured in the database yet. To display custom form fields here, configure the module schema using the designer dashboard:
                </p>
                
                <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2.5 border border-slate-100 text-xs text-gray-600 mb-8 font-medium">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#650C08]" />
                    <span>Go to the <strong>Designer Portal</strong> (`/designer/login`).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#650C08]" />
                    <span>Create a new module with exact key: <code className="bg-[#650C08]/10 text-[#650C08] px-1.5 py-0.5 rounded font-mono font-bold">inquiry_master</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#650C08]" />
                    <span>Add fields (e.g. Full Name, Email, Course, Phone) and mark visible.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-[#650C08]" />
                    <span>Configure form sections in Layout Designer and save.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href="/designer/login"
                    className="px-5 py-2.5 rounded-lg bg-[#650C08] hover:bg-[#7a1d16] text-white text-sm font-semibold shadow-md shadow-red-900/10 transition"
                  >
                    Open Designer Login
                  </a>
                  <button
                    onClick={loadLayout}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition"
                  >
                    Retry Loading
                  </button>
                </div>
              </div>
            ) : (
              
              /* DYNAMIC FORM FILLER */
              <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-md">
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Admission Application Form
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Fields marked with <span className="text-rose-500 font-bold">*</span> are mandatory for submission.
                  </p>
                </div>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 text-sm p-4 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {layout.sections.map((section, sIndex) => {
                  const visibleFields = section.fields.filter(f => f.is_visible);
                  if (visibleFields.length === 0) return null;

                  return (
                    <div key={sIndex} className="space-y-5">
                      <div className="border-b border-gray-100 pb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {section.name}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {visibleFields
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((field) => {
                            const isFullWidth = field.field_type === "textarea" || field.field_type === "multiselect";
                            return (
                              <div
                                key={field.field_id}
                                className={`space-y-1.5 ${isFullWidth ? "md:col-span-2" : ""}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <label className="text-xs font-bold text-gray-700">
                                    {field.label}
                                  </label>
                                  {field.is_mandatory && <span className="text-rose-500 font-extrabold">*</span>}
                                  {field.is_pii && (
                                    <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                      PII
                                    </span>
                                  )}
                                  {field.help_tooltip && (
                                    <span
                                      title={field.help_tooltip}
                                      className="cursor-help text-gray-400 hover:text-gray-600 transition"
                                    >
                                      <HelpCircle className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>

                                {renderFieldInput(field)}

                                {errors[field.field_key] && (
                                  <p className="text-xs font-medium text-rose-500">
                                    {errors[field.field_key]}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg bg-[#650C08] hover:bg-[#7a1d16] text-white text-sm font-semibold shadow-md shadow-red-900/10 transition disabled:opacity-70 flex items-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {submitting ? "Submitting Inquiry..." : "Submit Inquiry"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
