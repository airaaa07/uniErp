import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from "@mui/material";
import {
  SupportAgent as SupportAgentIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI } from "../../services/api";
import { fetchReferenceOptions } from "../../utils/referenceLoader";
import type { DesignerRecord as DbRecord } from "../../types";

const CounsellorDashboard: React.FC = () => {
  const { user } = useAuth();

  const [assignedStudents, setAssignedStudents] = useState<DbRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [coursesMap, setCoursesMap] = useState<Record<string, string>>({});
  
  // Counselor selection options
  const [institutes, setInstitutes] = useState<{ value: string; label: string }[]>([]);
  const [streams, setStreams] = useState<{ value: string; label: string }[]>([]);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dialog States
  const [selectedStudent, setSelectedStudent] = useState<DbRecord | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all inquiries
      const res = await erpRecordAPI.getRecordsByModule("inquiry_master");
      const inquiries = res.data || [];

      // Filter inquiries assigned to this counselor
      const filtered = inquiries.filter(
        (inq) => String(inq.data?.counsellor_id) === String(user?.user_id)
      );
      setAssignedStudents(filtered);

      // Fetch Courses catalog for translation
      const modulesRes = await erpRecordAPI.getAllModules();
      const modulesList = modulesRes.data || [];
      
      const courseOpts = await fetchReferenceOptions("course_id", modulesList, true);
      if (courseOpts) {
        const cMap: Record<string, string> = {};
        courseOpts.forEach((o) => {
          cMap[o.value] = o.label;
        });
        setCoursesMap(cMap);
      }

      // Fetch Institutes
      const instOpts = await fetchReferenceOptions("reg_institute_id", modulesList, true);
      if (instOpts) {
        setInstitutes(instOpts);
      }

      // Fetch Streams
      const streamOpts = await fetchReferenceOptions("reg_stream_id", modulesList, true);
      if (streamOpts) {
        setStreams(streamOpts);
      }

    } catch (err) {
      console.error("Failed to load counselor dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Enrolled":
        return { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" };
      case "Registered":
      case "Approved":
        return { bg: "rgba(6, 182, 212, 0.08)", text: "#0891b2" };
      case "Payment Pending":
        return { bg: "rgba(59, 130, 246, 0.08)", text: "#3b82f6" };
      case "Submitted":
        return { bg: "rgba(168, 85, 247, 0.08)", text: "#a855f7" };
      case "Fee Paid":
        return { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" };
      case "Assigned":
        return { bg: "rgba(245, 158, 11, 0.08)", text: "#d97706" };
      default:
        return { bg: "rgba(101, 12, 8, 0.08)", text: "#650C08" };
    }
  };

  const handleOpenDetails = (student: DbRecord) => {
    setSelectedStudent(student);
    setOpenDetails(true);
  };

  const handleOpenRegister = (student: DbRecord) => {
    setSelectedStudent(student);
    setSelectedInstId("");
    setSelectedStreamId("");
    setOpenRegisterDialog(true);
  };

  const handleApproveCounseling = async () => {
    if (!selectedStudent || !selectedInstId || !selectedStreamId) return;
    try {
      setSubmitting(true);
      
      // Look up registration fee
      let feeAmount = 1500; // standard default
      try {
        const feeRes = await erpRecordAPI.getRecordsByModule("registration_fee");
        const fees = feeRes.data || [];
        const match = fees.find(
          (f) =>
            String(f.data?.institute_id) === String(selectedInstId) &&
            String(f.data?.stream_id) === String(selectedStreamId)
        );
        if (match && match.data?.fee) {
          feeAmount = parseFloat(match.data.fee);
        }
      } catch (feeErr) {
        console.warn("Could not load registration fee catalog, using default:", feeErr);
      }

      // 1. Create registration record
      const regData = {
        reg_inquiry_student_id: selectedStudent.record_id,
        student_fname: selectedStudent.data?.inq_fname || "",
        student_lname: selectedStudent.data?.inq_lname || "",
        regn_fee: feeAmount,
        regn_pmt_ref: "", // Blank, to be filled by student
        reg_institute_id: selectedInstId,
        reg_stream_id: selectedStreamId,
        stream_part: 1,
        reg_class_10_percent: Number(selectedStudent.data?.class_10_percent || 0),
        reg_class_12_percent: Number(selectedStudent.data?.class_12_percent || 0),
        approval_status: "Payment Pending",
      };

      await erpRecordAPI.createRecord({
        module_key: "registration",
        data: regData,
      });

      // 2. Update Inquiry status to Payment Pending
      const updatedInquiry = {
        ...selectedStudent.data,
        inquiry_status: "Payment Pending",
      };
      await erpRecordAPI.updateRecord(selectedStudent.record_id, { data: updatedInquiry });

      setOpenRegisterDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to approve counseling & request payment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress size={40} sx={{ color: "#650C08" }} />
      </Box>
    );
  }

  // Calculate statistics
  const totalAssigned = assignedStudents.length;
  const assignedOnly = assignedStudents.filter(s => s.data?.inquiry_status === "Assigned" || !s.data?.inquiry_status).length;
  const paymentPendingCount = assignedStudents.filter(s => s.data?.inquiry_status === "Payment Pending").length;
  const enrolledCount = assignedStudents.filter(s => s.data?.inquiry_status === "Enrolled").length;

  const displayedStudents = assignedStudents.filter(s => {
    const status = s.data?.inquiry_status || "Assigned";
    if (tabValue === 0) {
      return status === "Assigned";
    } else {
      return status !== "Assigned";
    }
  });

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            Counselor Admissions Hub
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Welcome, {user?.first_name || user?.username}! Track and counsel your assigned student leads, recommend courses and college programs, and request registration payments.
          </Typography>
        </Box>
        <SupportAgentIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Counselor Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3.2 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(101, 12, 8, 0.08)", color: "#650C08" }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ASSIGNED LEADS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{totalAssigned}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.8 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(245, 158, 11, 0.08)", color: "#d97706" }}>
                <AssignmentIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>IN COUNSELING</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{assignedOnly}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.0 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(59, 130, 246, 0.08)", color: "#3b82f6" }}>
                <PersonAddIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>PAYMENT PENDING</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{paymentPendingCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3.0 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ENROLLED</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{enrolledCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main leads table */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
        Assigned Candidates Directory
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} textColor="primary" indicatorColor="primary">
          <Tab label={`Pending Counseling (${assignedOnly})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Counseling History (${totalAssigned - assignedOnly})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.01)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Candidate Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contact Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Program of Interest</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Admissions Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Quick Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {tabValue === 0 ? "No candidates currently pending counseling." : "No processed counseling history found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedStudents.map((student) => {
                const colors = getStatusColor(student.data?.inquiry_status || "Assigned");
                return (
                  <TableRow key={student.record_id} sx={{ "&:hover": { bgcolor: "rgba(101,12,8,0.01)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {student.data?.inq_fname} {student.data?.inq_lname}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.data?.mobile_no || "N/A"}</Typography>
                      <Typography variant="caption" color="text.secondary">Nationality: {student.data?.nationality || "Indian"}</Typography>
                    </TableCell>
                    <TableCell>
                      {coursesMap[student.data?.course_master_course_name] || student.data?.course_master_course_name || "Under Review"}
                    </TableCell>
                    <TableCell>
                      <Chip label={student.data?.inquiry_status || "Assigned"} size="small" sx={{ fontWeight: 600, bgcolor: colors.bg, color: colors.text, borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <IconButton
                          onClick={() => handleOpenDetails(student)}
                          size="small"
                          sx={{ color: "#650C08", bgcolor: "rgba(101,12,8,0.04)" }}
                          title="View Lead Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {(student.data?.inquiry_status === "Assigned" || !student.data?.inquiry_status) && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenRegister(student)}
                            startIcon={<PersonAddIcon />}
                            sx={{
                              borderRadius: 2,
                              bgcolor: "#650C08",
                              textTransform: "none",
                              fontWeight: 600,
                              "&:hover": { bgcolor: "#7a1d16" },
                            }}
                          >
                            Approve Counseling
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Candidate Profile Details</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>FULL NAME</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedStudent.data?.inq_fname} {selectedStudent.data?.inq_mname || ""} {selectedStudent.data?.inq_lname}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>MOBILE NO</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedStudent.data?.mobile_no || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>PARENT / GUARDIAN</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedStudent.data?.legal_guardian_name} ({selectedStudent.data?.relation || "Guardian"})</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>DATE OF BIRTH</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedStudent.data?.dob}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>CLASS 10%</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedStudent.data?.class_10_percent}%</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>CLASS 12%</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedStudent.data?.class_12_percent}%</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Counseling & Request Payment Dialog */}
      <Dialog open={openRegisterDialog} onClose={() => setOpenRegisterDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Recommend Admission & Request Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Select the recommended College/Institute and Stream for <strong>{selectedStudent?.data?.inq_fname} {selectedStudent?.data?.inq_lname}</strong>. This will transition their status to "Payment Pending" and allow the student to complete their registration payment.
            </Typography>

            <FormControl fullWidth required>
              <InputLabel>College/Institute</InputLabel>
              <Select
                value={selectedInstId}
                label="College/Institute"
                onChange={(e) => setSelectedInstId(e.target.value)}
              >
                {institutes.map((inst) => (
                  <MenuItem key={inst.value} value={inst.value}>
                    {inst.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Recommended Stream</InputLabel>
              <Select
                value={selectedStreamId}
                label="Recommended Stream"
                onChange={(e) => setSelectedStreamId(e.target.value)}
              >
                {streams.map((stream) => (
                  <MenuItem key={stream.value} value={stream.value}>
                    {stream.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setOpenRegisterDialog(false)} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveCounseling}
            variant="contained"
            disabled={!selectedInstId || !selectedStreamId || submitting}
            sx={{
              borderRadius: 2,
              bgcolor: "#650C08",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#7a1d16" },
            }}
          >
            {submitting ? "Processing..." : "Approve & Request Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CounsellorDashboard;
