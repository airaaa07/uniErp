import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

import { designerAPI } from "../../services/api";
import type { Field, DesignerRecord as Record, Module } from "../../types";

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

// Toggle component
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
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
function CustomChip({
  children,
  scheme = "gray",
}: {
  children: React.ReactNode;
  scheme?: string;
}) {
  const schemes: {
    [key: string]: { bg: string; color: string; border: string };
  } = {
    blue: { bg: "#E6F1FB", color: "#0C447C", border: "#9FC7F0" },
    red: { bg: C.redBg, color: C.red, border: C.redBorder },
    green: { bg: C.greenBg, color: C.green, border: C.greenBorder },
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

const RecordViewer: React.FC = () => {
  const [moduleKey, setModuleKey] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealPii, setRevealPii] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (moduleKey) {
      loadData();
    }
  }, [moduleKey]);

  // Reload data when component becomes visible (for real-time updates from FormPreview)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && moduleKey) {
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  const loadData = async () => {
    if (!moduleKey) return;
    try {
      setLoading(true);
      const [fieldsResponse, recordsResponse] = await Promise.all([
        designerAPI.getFieldsByModule(moduleKey),
        designerAPI.getRecordsByModule(moduleKey),
      ]);
      setFields(fieldsResponse.data || []);
      setRecords(recordsResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setFields([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const exportableFields = fields
    .filter((f) => f.is_exportable)
    .sort((a, b) => a.sort_order - b.sort_order);

  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true;
    const dataStr = Object.values(record.data || {})
      .join(" ")
      .toLowerCase();
    return dataStr.includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        fontFamily: "inherit",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: "12px 16px",
          borderBottom: `0.5px solid ${C.border}`,
          background: C.surface,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Record Viewer
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
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Toolbar */}
          <Box
            sx={{
              p: "10px 14px",
              borderBottom: `0.5px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 2,
              background: C.bg,
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              {filteredRecords.length} submission
              {filteredRecords.length !== 1 ? "s" : ""}
            </Typography>
            <CustomChip scheme="gray">
              {exportableFields.length} columns
            </CustomChip>
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SearchIcon sx={{ color: C.textFaint, fontSize: 16 }} />
                <TextField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records…"
                  size="small"
                  sx={{
                    width: 200,
                    "& .MuiInputBase-root": { background: C.surface },
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 12, color: C.textMid }}>
                  Reveal PII
                </Typography>
                <Toggle checked={revealPii} onChange={setRevealPii} />
              </Box>
              <Button
                onClick={loadData}
                size="small"
                startIcon={<RefreshIcon />}
                disabled={loading}
                sx={{
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 1,
                  background: "transparent",
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Table */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {loading ? (
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
                <Typography
                  sx={{ fontSize: 14, fontWeight: 600, color: C.textMid }}
                >
                  Loading records...
                </Typography>
              </Box>
            ) : !records.length ? (
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
                <Typography
                  sx={{ fontSize: 14, fontWeight: 600, color: C.textMid }}
                >
                  No submissions yet
                </Typography>
                <Typography sx={{ fontSize: 12, color: C.textFaint }}>
                  Go to Form Preview and submit a record first.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ height: "100%" }}>
                <Table sx={{ minWidth: 800 }} stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          padding: "8px 10px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 11,
                          color: C.textFaint,
                          borderBottom: `0.5px solid ${C.border}`,
                          whiteSpace: "nowrap",
                          background: "#F1F5F9",
                          width: 36,
                        }}
                      >
                        #
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "8px 10px",
                          textAlign: "left",
                          fontWeight: 600,
                          fontSize: 11,
                          color: C.textFaint,
                          borderBottom: `0.5px solid ${C.border}`,
                          whiteSpace: "nowrap",
                          background: "#F1F5F9",
                          width: 130,
                        }}
                      >
                        Submitted
                      </TableCell>
                      {exportableFields.map((field) => (
                        <TableCell
                          key={field.field_id}
                          sx={{
                            padding: "8px 10px",
                            textAlign: "left",
                            fontWeight: 600,
                            fontSize: 11,
                            color: C.textFaint,
                            borderBottom: `0.5px solid ${C.border}`,
                            whiteSpace: "nowrap",
                            background: "#F1F5F9",
                          }}
                        >
                          {field.label}
                          {field.is_pii && (
                            <span style={{ marginLeft: 4 }}>
                              <CustomChip scheme="red">PII</CustomChip>
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.map((record, index) => (
                      <TableRow
                        key={record.record_id}
                        sx={{
                          background: index % 2 === 0 ? C.surface : C.bg,
                          "&:hover": {
                            background: C.navyLight,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            padding: "8px 10px",
                            borderBottom: `0.5px solid ${C.bg}`,
                            fontSize: 12,
                            color: C.textFaint,
                            fontFamily: "monospace",
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            padding: "8px 10px",
                            borderBottom: `0.5px solid ${C.bg}`,
                            fontSize: 12,
                            color: C.textFaint,
                          }}
                        >
                          {formatDate(record.created_at)}
                        </TableCell>
                        {exportableFields.map((field) => (
                          <TableCell
                            key={field.field_id}
                            sx={{
                              padding: "8px 10px",
                              borderBottom: `0.5px solid ${C.bg}`,
                              fontSize: 12,
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {field.is_pii && !revealPii ? (
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  letterSpacing: 2,
                                  color: C.textFaint,
                                }}
                              >
                                ●●●●●●
                              </span>
                            ) : (
                              record.data?.[field.field_key] || (
                                <span style={{ color: C.border }}>—</span>
                              )
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
            Enter the module key above to load and view submitted records
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecordViewer;
