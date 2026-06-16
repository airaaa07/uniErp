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
} from "@mui/material";
import {
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI } from "../../services/api";
import { fetchReferenceOptions } from "../../utils/referenceLoader";
import type { DesignerRecord as DbRecord } from "../../types";

const RegistrarDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<DbRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutesMap, setInstitutesMap] = useState<Record<string, string>>({});
  const [streamsMap, setStreamsMap] = useState<Record<string, string>>({});

  // Dialog States
  const [selectedReg, setSelectedReg] = useState<DbRecord | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch registrations
      const res = await erpRecordAPI.getRecordsByModule("registration");
      const list = res.data || [];
      // Filter for those that have been approved
      const approved = list.filter(r => r.data?.approval_status === "Approved");
      setRegistrations(approved);

      // Load reference Options for translation
      const modulesRes = await erpRecordAPI.getAllModules();
      const mods = modulesRes.data || [];

      const instOpts = await fetchReferenceOptions("reg_institute_id", mods, true);
      if (instOpts) {
        const iMap: Record<string, string> = {};
        instOpts.forEach(o => { iMap[o.value] = o.label; });
        setInstitutesMap(iMap);
      }

      const streamOpts = await fetchReferenceOptions("reg_stream_id", mods, true);
      if (streamOpts) {
        const sMap: Record<string, string> = {};
        streamOpts.forEach(o => { sMap[o.value] = o.label; });
        setStreamsMap(sMap);
      }

    } catch (err) {
      console.error("Failed to load registrar dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (reg: DbRecord) => {
    setSelectedReg(reg);
    setOpenDetails(true);
  };

  const handleOpenEnroll = (reg: DbRecord) => {
    setSelectedReg(reg);
    setOpenEnrollDialog(true);
  };

  const handleEnrollConfirm = async () => {
    if (!selectedReg) return;
    try {
      // Generate unique enrollment number
      const enrollmentNo = `EN2026${Math.floor(100000 + Math.random() * 900000)}`;

      // Save Enrollment Record to enrollment_master
      await erpRecordAPI.createRecord({
        module_key: "enrollment_master",
        data: {
          enroll_registration_id: selectedReg.record_id,
          enrollment_number: enrollmentNo,
          student_fname: selectedReg.data.student_fname || "",
          student_lname: selectedReg.data.student_lname || "",
          enrollment_date: new Date().toISOString().split("T")[0],
          enroll_stream_id: selectedReg.data.reg_stream_id || "",
          enroll_stream_part: selectedReg.data.stream_part || 1,
          enroll_pmt_tx_ref: selectedReg.data.regn_pmt_ref || "",
          pmt_amount: selectedReg.data.regn_fee || 0,
        }
      });

      // Update Registration record status to Enrolled
      const updatedReg = { ...selectedReg.data, approval_status: "Enrolled" };
      await erpRecordAPI.updateRecord(selectedReg.record_id, { data: updatedReg });

      // Optional: Update Student Inquiry status to Enrolled
      if (selectedReg.data?.reg_inquiry_student_id) {
        try {
          const inquiryRes = await erpRecordAPI.getRecord(selectedReg.data.reg_inquiry_student_id);
          if (inquiryRes.data) {
            const updatedInq = { ...inquiryRes.data.data, inquiry_status: "Enrolled" };
            await erpRecordAPI.updateRecord(selectedReg.data.reg_inquiry_student_id, { data: updatedInq });
          }
        } catch (inqErr) {
          console.error("Failed to update student inquiry status to Enrolled:", inqErr);
        }
      }

      setOpenEnrollDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to enroll candidate:", err);
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
  const pendingEnrollmentsCount = registrations.length;

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            Registrar Matriculation Portal
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Welcome, {user?.first_name || user?.username}! Verify academic approvals, execute matriculation, and generate university enrollment numbers.
          </Typography>
        </Box>
        <SchoolIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>AWAITING ENROLLMENT</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{pendingEnrollmentsCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main registrations table */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
        Matriculation Queue (Approved Registrations)
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.01)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Candidate Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>College & Program</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Approver Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Decision Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Matriculate Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    No candidates currently in the matriculation queue.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => {
                return (
                  <TableRow key={reg.record_id} sx={{ "&:hover": { bgcolor: "rgba(101,12,8,0.01)" } }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {reg.data?.student_fname} {reg.data?.student_lname}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{institutesMap[reg.data?.reg_institute_id] || "N/A"}</Typography>
                      <Typography variant="caption" color="text.secondary">Stream: {streamsMap[reg.data?.reg_stream_id] || "N/A"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{reg.data?.approver_name || "Official"}</Typography>
                      <Typography variant="caption" color="text.secondary">Comments: {reg.data?.approver_comments || "Eligible"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label="Approved" size="small" sx={{ fontWeight: 600, bgcolor: "rgba(6, 182, 212, 0.08)", color: "#0891b2", borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <IconButton
                          onClick={() => handleOpenDetails(reg)}
                          size="small"
                          sx={{ color: "#650C08", bgcolor: "rgba(101,12,8,0.04)" }}
                          title="View Application Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenEnroll(reg)}
                          startIcon={<BadgeIcon />}
                          sx={{
                            borderRadius: 2,
                            bgcolor: "#650C08",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": { bgcolor: "#7a1d16" },
                          }}
                        >
                          Matriculate & Enroll
                        </Button>
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
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Admissions Decision Audit</DialogTitle>
        <DialogContent>
          {selectedReg && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>STUDENT NAME</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.student_fname} {selectedReg.data?.student_lname}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>COLLEGE</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{institutesMap[selectedReg.data?.reg_institute_id] || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>STREAM</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{streamsMap[selectedReg.data?.reg_stream_id] || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>APPROVER NAME</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.approver_name || "N/A"}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>APPROVER COMMENTS</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.approver_comments || "None"}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Enroll Confirm Dialog */}
      <Dialog open={openEnrollDialog} onClose={() => setOpenEnrollDialog(false)} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Confirm Student Enrollment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to enroll <strong>{selectedReg?.data?.student_fname} {selectedReg?.data?.student_lname}</strong>?
            This will generate a permanent university Enrollment Number and matriculate the student profile.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenEnrollDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleEnrollConfirm} variant="contained" sx={{ borderRadius: 2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
            Confirm Enrollment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RegistrarDashboard;
