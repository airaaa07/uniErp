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
  Tabs,
  Tab,
} from "@mui/material";
import {
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  AssignmentTurnedIn as AssignmentIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { erpRecordAPI } from "../../services/api";
import { fetchReferenceOptions } from "../../utils/referenceLoader";
import type { DesignerRecord as DbRecord } from "../../types";

const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<DbRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [institutesMap, setInstitutesMap] = useState<Record<string, string>>({});
  const [streamsMap, setStreamsMap] = useState<Record<string, string>>({});

  // Dialog States
  const [selectedReg, setSelectedReg] = useState<DbRecord | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);

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
      setRegistrations(res.data || []);

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
      console.error("Failed to load finance dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Enrolled":
        return { bg: "rgba(16, 185, 129, 0.08)", text: "#10b981" };
      case "Approved":
        return { bg: "rgba(6, 182, 212, 0.08)", text: "#0891b2" };
      case "Fee Paid":
        return { bg: "rgba(245, 158, 11, 0.08)", text: "#d97706" };
      default:
        return { bg: "rgba(101, 12, 8, 0.08)", text: "#650C08" };
    }
  };

  const handleOpenDetails = (reg: DbRecord) => {
    setSelectedReg(reg);
    setOpenDetails(true);
  };

  const handleOpenVerify = (reg: DbRecord) => {
    setSelectedReg(reg);
    setOpenVerifyDialog(true);
  };

  const handleVerifyConfirm = async () => {
    if (!selectedReg) return;
    try {
      // Transition status to Fee Paid
      const updatedData = { ...selectedReg.data, approval_status: "Fee Paid" };
      await erpRecordAPI.updateRecord(selectedReg.record_id, { data: updatedData });
      
      // Update student inquiry status to Fee Paid
      if (selectedReg.data?.reg_inquiry_student_id) {
        try {
          const inquiryRes = await erpRecordAPI.getRecord(selectedReg.data.reg_inquiry_student_id);
          if (inquiryRes.data) {
            const updatedInq = { ...inquiryRes.data.data, inquiry_status: "Fee Paid" };
            await erpRecordAPI.updateRecord(selectedReg.data.reg_inquiry_student_id, { data: updatedInq });
          }
        } catch (inqErr) {
          console.error("Failed to update student inquiry status to Fee Paid:", inqErr);
        }
      }
      
      setOpenVerifyDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to verify registration payment:", err);
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
  const pendingVerification = registrations.filter(r => r.data?.approval_status === "Submitted" || !r.data?.approval_status).length;
  const paymentPending = registrations.filter(r => r.data?.approval_status === "Payment Pending").length;
  const verifiedFees = registrations.filter(r => r.data?.approval_status === "Fee Paid" || r.data?.approval_status === "Approved" || r.data?.approval_status === "Enrolled").length;

  const displayedRegs = registrations.filter(r => {
    const status = r.data?.approval_status || "Submitted";
    if (tabValue === 0) {
      return status === "Submitted";
    } else if (tabValue === 1) {
      return status === "Payment Pending";
    } else {
      return status === "Fee Paid" || status === "Approved" || status === "Enrolled";
    }
  });

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* Welcome Banner */}
      <Box sx={{ p: 4, mb: 4, borderRadius: 4, bgcolor: "#650C08", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 6px 20px rgba(101,12,8,0.15)" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}>
            Finance Controller Desk
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 600 }}>
            Welcome, {user?.first_name || user?.username}! Verify student payment references, track fee structures, and approve transaction records to progress admissions.
          </Typography>
        </Box>
        <AttachMoneyIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 180, opacity: 0.08 }} />
      </Box>

      {/* Finance Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(245, 158, 11, 0.08)", color: "#d97706" }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>PAYMENT PENDING</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{paymentPending}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(101, 12, 8, 0.08)", color: "#650C08" }}>
                <AssignmentIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>PENDING VERIFICATION</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{pendingVerification}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 4 }}>
          <Card sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                <CheckCircleIcon />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>VERIFIED PAYMENTS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{verifiedFees}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main registrations table */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#650C08", mb: 2 }}>
        Academic Registration Payment Queue
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} textColor="primary" indicatorColor="primary">
          <Tab label={`Pending Verification (${pendingVerification})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Payment Pending (${paymentPending})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Verification History (${verifiedFees})`} sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.01)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Student Details</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>College & Program</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fee & Tx Reference</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Quick Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRegs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {tabValue === 0
                      ? "No registration forms awaiting verification."
                      : tabValue === 1
                      ? "No candidates currently pending payment."
                      : "No verification history found."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedRegs.map((reg) => {
                const colors = getStatusColor(reg.data?.approval_status || "Submitted");
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
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{reg.data?.regn_fee || "0"}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>Ref: {reg.data?.regn_pmt_ref || "N/A"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={reg.data?.approval_status || "Submitted"} size="small" sx={{ fontWeight: 600, bgcolor: colors.bg, color: colors.text, borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <IconButton
                          onClick={() => handleOpenDetails(reg)}
                          size="small"
                          sx={{ color: "#650C08", bgcolor: "rgba(101,12,8,0.04)" }}
                          title="View Payment Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {(reg.data?.approval_status === "Submitted" || !reg.data?.approval_status) && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenVerify(reg)}
                            startIcon={<CheckCircleIcon />}
                            sx={{
                              borderRadius: 2,
                              bgcolor: "#10b981",
                              textTransform: "none",
                              fontWeight: 600,
                              "&:hover": { bgcolor: "#059669" },
                            }}
                          >
                            Verify Fee
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
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Payment Entry Details</DialogTitle>
        <DialogContent>
          {selectedReg && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>STUDENT NAME</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReg.data?.student_fname} {selectedReg.data?.student_lname}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>PAYMENT AMOUNT</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "#10b981" }}>₹{selectedReg.data?.regn_fee}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>TRANSACTION REFERENCE</Typography>
                  <Typography variant="body1" sx={{ fontFamily: "monospace", fontWeight: 600 }}>{selectedReg.data?.regn_pmt_ref}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>COLLEGE</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{institutesMap[selectedReg.data?.reg_institute_id]}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>STREAM</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{streamsMap[selectedReg.data?.reg_stream_id]}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block" }}>ACADEMIC PART</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Semester/Year {selectedReg.data?.stream_part}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Confirm Dialog */}
      <Dialog open={openVerifyDialog} onClose={() => setOpenVerifyDialog(false)} slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#650C08" }}>Confirm Fee Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to verify the payment reference <strong>{selectedReg?.data?.regn_pmt_ref}</strong> for <strong>₹{selectedReg?.data?.regn_fee}</strong>?
            This will mark the student's status as "Fee Paid".
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenVerifyDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleVerifyConfirm} variant="contained" sx={{ borderRadius: 2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
            Verify & Approve Fee
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FinanceDashboard;
