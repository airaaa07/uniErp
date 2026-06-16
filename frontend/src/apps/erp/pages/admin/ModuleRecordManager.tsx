import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  SupportAgent as SupportAgentIcon,
  CheckCircleOutlined as CheckCircleIcon,
} from "@mui/icons-material";
import { erpRecordAPI, userAPI } from "../../services/api";
import { fetchReferenceOptions } from "../../utils/referenceLoader";
import DynamicFormRenderer from "../../components/DynamicFormRenderer";
import type { DesignerRecord as DbRecord, FormLayout } from "../../types";

const ModuleRecordManager: React.FC = () => {
  const { moduleKey = "inquiry_master" } = useParams<{ moduleKey: string }>();

  const [records, setRecords] = useState<DbRecord[]>([]);
  const [layout, setLayout] = useState<FormLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog States
  const [selectedRecord, setSelectedRecord] = useState<DbRecord | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | undefined>(undefined);

  // Workflow Dialog States
  const [openAssignCounsellor, setOpenAssignCounsellor] = useState(false);
  const [counsellorsList, setCounsellorsList] = useState<any[]>([]);
  const [selectedCounsellorId, setSelectedCounsellorId] = useState("");

  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);

  // Reference Label Mapping cache
  const [mappedLabels, setMappedLabels] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetchData();
  }, [moduleKey, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Layout, records, and all system modules
      const [layoutRes, recordsRes, modulesRes] = await Promise.all([
        erpRecordAPI.getFormLayout(moduleKey),
        erpRecordAPI.getRecordsByModule(moduleKey, search),
        erpRecordAPI.getAllModules()
      ]);
      
      setLayout(layoutRes.data);
      setRecords(recordsRes.data || []);
      const mods = modulesRes.data || [];

      // Load reference option lists to format IDs in the table as names
      const labelsCache: Record<string, Record<string, string>> = {};
      for (const section of layoutRes.data?.sections || []) {
        for (const field of section.fields || []) {
          if (["select", "multiselect", "radio"].includes(field.field_type)) {
            const opts = await fetchReferenceOptions(field.field_key, mods, true);
            if (opts) {
              const cache: Record<string, string> = {};
              opts.forEach(o => { cache[o.value] = o.label; });
              labelsCache[field.field_key] = cache;
            }
          }
        }
      }
      setMappedLabels(labelsCache);

    } catch (error) {
      console.error("Error fetching module data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await erpRecordAPI.deleteRecord(recordId);
        fetchData();
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingRecordId(undefined);
    setOpenFormDialog(true);
  };

  const handleOpenEdit = (rec: DbRecord) => {
    setEditingRecordId(rec.record_id);
    setSelectedRecord(rec);
    setOpenFormDialog(true);
  };

  const handleOpenDetails = (rec: DbRecord) => {
    setSelectedRecord(rec);
    setOpenDetails(true);
  };

  // Workflow: Assign Counsellor
  const handleOpenCounsellorDialog = async (rec: DbRecord) => {
    setSelectedRecord(rec);
    try {
      const usersRes = await userAPI.getAll();
      const list = (usersRes.data || []).filter((u: any) =>
        u.roles?.some((r: any) => {
          const name = typeof r === "string" ? r : r.role_name;
          return name?.toLowerCase().includes("counsellor");
        })
      );
      setCounsellorsList(list);
      setSelectedCounsellorId(String(rec.data?.counsellor_id || ""));
      setOpenAssignCounsellor(true);
    } catch (err) {
      console.error("Failed to fetch counsellors:", err);
    }
  };

  const handleSaveCounsellor = async () => {
    if (!selectedRecord) return;
    try {
      const updatedData = { ...selectedRecord.data, counsellor_id: selectedCounsellorId };
      // If status is Open, transition to Assigned
      if (updatedData.inquiry_status === "Open" || !updatedData.inquiry_status) {
        updatedData.inquiry_status = "Assigned";
      }
      await erpRecordAPI.updateRecord(selectedRecord.record_id, { data: updatedData });
      setOpenAssignCounsellor(false);
      fetchData();
    } catch (err) {
      console.error("Failed to assign counsellor:", err);
    }
  };

  // Workflow: Register Student
  const handleOpenRegisterDialog = (rec: DbRecord) => {
    setSelectedRecord(rec);
    setOpenRegisterDialog(true);
  };

  const handleRegisterSuccess = async () => {
    if (selectedRecord) {
      // Transition inquiry status to Registered
      try {
        const updatedInquiry = { ...selectedRecord.data, inquiry_status: "Registered" };
        await erpRecordAPI.updateRecord(selectedRecord.record_id, { data: updatedInquiry });
      } catch (err) {
        console.error("Failed to update inquiry status:", err);
      }
    }
    setOpenRegisterDialog(false);
    fetchData();
  };

  // Workflow: Approve & Enroll
  const handleOpenEnrollDialog = (rec: DbRecord) => {
    setSelectedRecord(rec);
    setOpenEnrollDialog(true);
  };

  const handleEnrollConfirm = async () => {
    if (!selectedRecord) return;
    try {
      // Generate unique enrollment number
      const enrollmentNo = `EN2026${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Save Enrollment Record
      await erpRecordAPI.createRecord({
        module_key: "enrollment",
        data: {
          regn_id: selectedRecord.record_id,
          enrollment_number: enrollmentNo,
          student_fname: selectedRecord.data.student_fname || selectedRecord.data.first_name || "",
          student_lname: selectedRecord.data.student_lname || selectedRecord.data.last_name || "",
          enrollment_date: new Date().toISOString().split("T")[0],
          stream_id: selectedRecord.data.stream_id || "",
          pmt_amount: selectedRecord.data.regn_fee || "0",
        }
      });

      // Update Registration record's approval status
      const updatedReg = { ...selectedRecord.data, approval_status: "Enrolled" };
      await erpRecordAPI.updateRecord(selectedRecord.record_id, { data: updatedReg });

      setOpenEnrollDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to enroll candidate:", err);
    }
  };

  // Label display helper
  const getFieldLabel = (fieldKey: string): string => {
    if (!layout?.sections) return fieldKey;
    for (const section of layout.sections) {
      const field = section.fields.find(f => f.field_key === fieldKey);
      if (field) return field.label;
    }
    return fieldKey;
  };

  // Formatter helper for cell values
  const formatCellValue = (fieldKey: string, val: any): string => {
    if (val === undefined || val === null) return "N/A";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) return val.join(", ");
    
    // Resolve dynamic reference label from cache if available
    if (mappedLabels[fieldKey] && mappedLabels[fieldKey][String(val)]) {
      return mappedLabels[fieldKey][String(val)];
    }
    return String(val);
  };

  // Fetch visible fields to render in table columns
  const getVisibleColumns = () => {
    if (!layout?.sections) return [];
    const cols: any[] = [];
    layout.sections.forEach(sec => {
      sec.fields.forEach(f => {
        if (f.is_visible && f.field_type !== "textarea") {
          cols.push(f);
        }
      });
    });
    // Cap at 4 columns for table readability
    return cols.slice(0, 4);
  };

  const columns = getVisibleColumns();

  return (
    <Container maxWidth="xl" sx={{ py: 1 }}>
      {/* Dynamic Module Welcome Banner */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #650C08 0%, #b77a6f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5,
              textTransform: "capitalize"
            }}
          >
            {layout?.module_name || moduleKey.replace(/_/g, " ")} Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage live {layout?.module_name || moduleKey} records, search entries, and coordinate admissions.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          sx={{
            borderRadius: 2.5,
            bgcolor: "#650C08",
            "&:hover": { bgcolor: "#7a1d16" },
          }}
        >
          Add Record
        </Button>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(101, 12, 8, 0.08)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(101, 12, 8, 0.08)", color: "#650C08" }}>
                <AssignmentIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Total Records</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#650C08" }}>{records.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search records by typing filter keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", mr: 0.5 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: "#ffffff",
                borderRadius: 3,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                "& fieldset": { borderColor: "rgba(15, 23, 42, 0.06) !important" },
              },
            }
          }}
        />
      </Box>

      {/* Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0, 0, 0, 0.01)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Record ID</TableCell>
              {columns.map(col => (
                <TableCell key={col.field_id} sx={{ fontWeight: 700 }}>{col.label}</TableCell>
              ))}
              {moduleKey === "inquiry_master" && <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>}
              {moduleKey === "registration" && <TableCell sx={{ fontWeight: 700 }}>Approval</TableCell>}
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 3} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={36} sx={{ color: "#650C08" }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading module records...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 3} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No records found in this module.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((rec) => {
                const data = rec.data || {};
                
                return (
                  <TableRow
                    key={rec.record_id}
                    sx={{
                      transition: "background-color 0.15s",
                      "&:hover": { backgroundColor: "rgba(101, 12, 8, 0.015)" },
                    }}
                  >
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "text.secondary" }}>
                      {rec.record_id.slice(0, 8)}...
                    </TableCell>
                    {columns.map(col => (
                      <TableCell key={col.field_id}>
                        {formatCellValue(col.field_key, data[col.field_key])}
                      </TableCell>
                    ))}
                    
                    {/* Inquiry Status Badge */}
                    {moduleKey === "inquiry_master" && (
                      <TableCell>
                        <Chip
                          label={data.inquiry_status || "Open"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 1.5,
                            bgcolor:
                              data.inquiry_status === "Enrolled"
                                ? "rgba(16, 185, 129, 0.08)"
                                : data.inquiry_status === "Registered"
                                ? "rgba(6, 182, 212, 0.08)"
                                : data.inquiry_status === "Assigned"
                                ? "rgba(245, 158, 11, 0.08)"
                                : "rgba(101, 12, 8, 0.08)",
                            color:
                              data.inquiry_status === "Enrolled"
                                ? "#10b981"
                                : data.inquiry_status === "Registered"
                                ? "#0891b2"
                                : data.inquiry_status === "Assigned"
                                ? "#d97706"
                                : "#650C08",
                          }}
                        />
                      </TableCell>
                    )}

                    {/* Registration Status Badge */}
                    {moduleKey === "registration" && (
                      <TableCell>
                        <Chip
                          label={data.approval_status || "Submitted"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            borderRadius: 1.5,
                            bgcolor:
                              data.approval_status === "Enrolled" || data.approval_status === "Approved"
                                ? "rgba(16, 185, 129, 0.08)"
                                : data.approval_status === "Rejected"
                                ? "rgba(239, 68, 68, 0.08)"
                                : "rgba(245, 158, 11, 0.08)",
                            color:
                              data.approval_status === "Enrolled" || data.approval_status === "Approved"
                                ? "#10b981"
                                : data.approval_status === "Rejected"
                                ? "#ef4444"
                                : "#d97706",
                          }}
                        />
                      </TableCell>
                    )}

                    {/* Action buttons */}
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        
                        {/* Dynamic workflow: Assign Counsellor */}
                        {moduleKey === "inquiry_master" && (
                          <IconButton
                            onClick={() => handleOpenCounsellorDialog(rec)}
                            size="small"
                            title="Assign Counsellor"
                            sx={{ color: "#0891b2", bgcolor: "rgba(6, 182, 212, 0.04)", "&:hover": { bgcolor: "rgba(6, 182, 212, 0.08)" } }}
                          >
                            <SupportAgentIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* Dynamic workflow: Register Student */}
                        {moduleKey === "inquiry_master" && data.inquiry_status !== "Registered" && data.inquiry_status !== "Enrolled" && (
                          <IconButton
                            onClick={() => handleOpenRegisterDialog(rec)}
                            size="small"
                            title="Register Candidate"
                            sx={{ color: "#d97706", bgcolor: "rgba(245, 158, 11, 0.04)", "&:hover": { bgcolor: "rgba(245, 158, 11, 0.08)" } }}
                          >
                            <PersonAddIcon fontSize="small" />
                          </IconButton>
                        )}

                        {/* Dynamic workflow: Approve & Enroll */}
                        {moduleKey === "registration" && data.approval_status !== "Enrolled" && (
                          <IconButton
                            onClick={() => handleOpenEnrollDialog(rec)}
                            size="small"
                            title="Approve & Enroll"
                            sx={{ color: "#10b981", bgcolor: "rgba(16, 185, 129, 0.04)", "&:hover": { bgcolor: "rgba(16, 185, 129, 0.08)" } }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        )}

                        <IconButton
                          onClick={() => handleOpenDetails(rec)}
                          size="small"
                          title="View Details"
                          sx={{ color: "#650C08", bgcolor: "rgba(101, 12, 8, 0.04)", "&:hover": { bgcolor: "rgba(101, 12, 8, 0.08)" } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          onClick={() => handleOpenEdit(rec)}
                          size="small"
                          title="Edit Record"
                          sx={{ color: "primary.main", bgcolor: "rgba(25, 118, 210, 0.04)", "&:hover": { bgcolor: "rgba(25, 118, 210, 0.08)" } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          onClick={() => handleDelete(rec.record_id)}
                          size="small"
                          title="Delete Record"
                          sx={{ color: "error.main", bgcolor: "rgba(239, 68, 68, 0.04)", "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)" } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>

                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog: Record Form (Create / Edit) */}
      <Dialog
        open={openFormDialog}
        onClose={() => setOpenFormDialog(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>
          {editingRecordId ? "Edit Module Record" : "Add New Record"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <DynamicFormRenderer
              moduleKey={moduleKey}
              recordId={editingRecordId}
              initialData={editingRecordId ? selectedRecord?.data : undefined}
              onSuccess={() => {
                setOpenFormDialog(false);
                fetchData();
              }}
              onCancel={() => setOpenFormDialog(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog: Record Details Viewer */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08", pb: 1 }}>
          Module Entry Details
        </DialogTitle>
        <DialogContent>
          {selectedRecord && selectedRecord.data ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {Object.keys(selectedRecord.data).map((key) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={key}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 0.5 }}>
                        {getFieldLabel(key)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                        {formatCellValue(key, selectedRecord.data[key])}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", color: "text.secondary" }}>
                <Typography variant="caption">UUID: {selectedRecord.record_id}</Typography>
                <Typography variant="caption">Submitted: {new Date(selectedRecord.created_at).toLocaleString()}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">No details available.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDetails(false)} variant="contained" sx={{ px: 3, borderRadius: 2, bgcolor: "#650C08", "&:hover": { bgcolor: "#7a1d16" } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Assign Counsellor */}
      <Dialog open={openAssignCounsellor} onClose={() => setOpenAssignCounsellor(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Assign Counsellor</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Counsellor</InputLabel>
              <Select
                value={selectedCounsellorId}
                label="Select Counsellor"
                onChange={(e) => setSelectedCounsellorId(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>None / Unassigned</em>
                </MenuItem>
                {counsellorsList.map((c) => (
                  <MenuItem key={c.user_id} value={String(c.user_id)}>
                    {c.first_name} {c.last_name} ({c.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAssignCounsellor(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveCounsellor} variant="contained" sx={{ borderRadius: 2, bgcolor: "#650C08", "&:hover": { bgcolor: "#7a1d16" } }}>
            Save Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Register Student */}
      <Dialog
        open={openRegisterDialog}
        onClose={() => setOpenRegisterDialog(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>
          Submit Academic Registration Form
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <DynamicFormRenderer
              moduleKey="registration"
              initialData={{
                inq_student_id: selectedRecord?.record_id || "",
                student_fname: selectedRecord?.data?.student_fname || selectedRecord?.data?.first_name || "",
                student_lname: selectedRecord?.data?.student_lname || selectedRecord?.data?.last_name || "",
                stream_id: selectedRecord?.data?.stream_id || "",
                regn_fee: "1500", // Standard registration fee
                regn_pmt_ref: `TXN${Date.now()}`, // Autogenerated txn ref
                approval_status: "Submitted",
              }}
              onSuccess={handleRegisterSuccess}
              onCancel={() => setOpenRegisterDialog(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog: Approve & Enroll */}
      <Dialog open={openEnrollDialog} onClose={() => setOpenEnrollDialog(false)} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Approve & Enroll Candidate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to approve this registration and generate a university Enrollment Number?
            This will create an official student profile and update the status to "Enrolled".
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEnrollDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleEnrollConfirm} variant="contained" sx={{ borderRadius: 2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
            Enroll Student
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ModuleRecordManager;
